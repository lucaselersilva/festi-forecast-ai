/**
 * Intraday Pricing Job
 * 
 * Runs every hour to update pricing based on real-time demand signals,
 * stock levels, and external factors.
 */

import { createClient } from "@supabase/supabase-js";
import { MultiarmedBandit } from "../services/pricing/bandit";
import { PricingPolicy } from "../services/pricing/policy";
import { config } from "../config";

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
const bandit = new MultiarmedBandit(config.pricing.banditEpsilon);
const pricingPolicy = new PricingPolicy(supabase);

async function runIntradayPricing() {
  console.log("🕐 Starting intraday pricing update...");
  
  try {
    // Get all active events (next 60 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + 60);
    
    const { data: activeEvents, error: eventsError } = await supabase
      .from("events")
      .select("*, ticket_types(*)")
      .gte("date", new Date().toISOString().split("T")[0])
      .lte("date", cutoffDate.toISOString().split("T")[0]);

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    if (!activeEvents || activeEvents.length === 0) {
      console.log("📭 No active events found for pricing update");
      return;
    }

    console.log(`📊 Processing ${activeEvents.length} active events...`);

    let updatedCount = 0;
    const batchSize = 10;

    // Process events in batches
    for (let i = 0; i < activeEvents.length; i += batchSize) {
      const batch = activeEvents.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (event) => {
        try {
          await processEventPricing(event);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Error processing event ${event.id}:`, error);
        }
      }));

      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < activeEvents.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Intraday pricing completed. Updated ${updatedCount} events.`);
    
    // Log summary metrics
    await logPricingMetrics(updatedCount);

  } catch (error) {
    console.error("💥 Intraday pricing job failed:", error);
    
    // Log error for monitoring
    await supabase.from("demand_snapshots").insert({
      event_id: "system",
      ticket_type_id: "system",
      price: 0,
      available_stock: 0,
      views: 0,
      clicks: 0,
      sales: 0,
      channel: "system_error",
      metadata: { error: error.message, job: "intraday-pricing" },
    });
  }
}

async function processEventPricing(event: any) {
  if (!event.ticket_types || event.ticket_types.length === 0) {
    return;
  }

  // Get recent demand snapshots for analysis
  const { data: recentSnapshots } = await supabase
    .from("demand_snapshots")
    .select("*")
    .eq("event_id", event.id)
    .gte("snapshot_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .order("snapshot_time", { ascending: false });

  // Get external signals
  const { data: signals } = await supabase
    .from("signals")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Process each ticket type
  for (const ticketType of event.ticket_types) {
    const contextualFeatures = {
      basePrice: ticketType.base_price,
      currentStock: ticketType.available,
      capacity: ticketType.capacity,
      timeToEvent: new Date(event.date).getTime() - Date.now(),
      channel: "system",
      signals: signals || {},
    };

    // Calculate demand velocity
    const demandVelocity = calculateDemandVelocity(recentSnapshots || [], ticketType.id);
    
    // Get current conversion rate
    const conversionRate = calculateConversionRate(recentSnapshots || [], ticketType.id);

    // Only update pricing if there's significant activity or time pressure
    const shouldUpdatePricing = 
      demandVelocity.sales > 0 || 
      conversionRate > 0.05 || 
      contextualFeatures.timeToEvent < 7 * 24 * 60 * 60 * 1000 || // Less than 7 days
      (ticketType.available / ticketType.capacity) < 0.3; // Less than 30% stock

    if (!shouldUpdatePricing) {
      continue;
    }

    // Calculate new recommended price
    const recommendedPrice = await pricingPolicy.calculatePrice(
      event.id,
      ticketType.id,
      contextualFeatures
    );

    // Get bandit recommendation
    const candidatePrices = [
      recommendedPrice * 0.95,
      recommendedPrice,
      recommendedPrice * 1.05,
    ];

    const selectedPrice = await bandit.selectPrice(
      `${event.id}-${ticketType.id}`,
      candidatePrices,
      contextualFeatures
    );

    // Update price if it's significantly different (> 5% change)
    const priceChangePercent = Math.abs(selectedPrice - ticketType.current_price) / ticketType.current_price;
    
    if (priceChangePercent > 0.05) {
      const { error: updateError } = await supabase
        .from("ticket_types")
        .update({ current_price: selectedPrice })
        .eq("id", ticketType.id);

      if (updateError) {
        console.error(`Failed to update price for ticket type ${ticketType.id}:`, updateError);
        continue;
      }

      // Record the pricing decision
      await supabase.from("demand_snapshots").insert({
        event_id: event.id,
        ticket_type_id: ticketType.id,
        price: selectedPrice,
        available_stock: ticketType.available,
        channel: "system_pricing",
        views: 0,
        clicks: 0,
        sales: 0,
      });

      console.log(`💰 Updated price for ${event.artist} - ${ticketType.name}: R$ ${ticketType.current_price} → R$ ${selectedPrice}`);
    }

    // Update bandit with recent performance
    if (demandVelocity.sales > 0) {
      const reward = calculateReward(demandVelocity, conversionRate, contextualFeatures);
      await bandit.updateReward(`${event.id}-${ticketType.id}`, ticketType.current_price, reward);
    }
  }
}

function calculateDemandVelocity(snapshots: any[], ticketTypeId: string): {
  views: number;
  clicks: number;
  sales: number;
} {
  const ticketSnapshots = snapshots.filter(s => s.ticket_type_id === ticketTypeId);
  
  return {
    views: ticketSnapshots.reduce((sum, s) => sum + (s.views || 0), 0),
    clicks: ticketSnapshots.reduce((sum, s) => sum + (s.clicks || 0), 0),
    sales: ticketSnapshots.reduce((sum, s) => sum + (s.sales || 0), 0),
  };
}

function calculateConversionRate(snapshots: any[], ticketTypeId: string): number {
  const ticketSnapshots = snapshots.filter(s => s.ticket_type_id === ticketTypeId);
  
  const totalViews = ticketSnapshots.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalSales = ticketSnapshots.reduce((sum, s) => sum + (s.sales || 0), 0);
  
  return totalViews > 0 ? totalSales / totalViews : 0;
}

function calculateReward(
  demandVelocity: { views: number; clicks: number; sales: number },
  conversionRate: number,
  contextualFeatures: any
): number {
  // Reward function combines sales success with stock optimization
  const salesReward = demandVelocity.sales * 0.5;
  const conversionReward = conversionRate * 0.3;
  
  // Stock level bonus (reward for maintaining good stock levels)
  const stockRatio = contextualFeatures.currentStock / contextualFeatures.capacity;
  const stockReward = stockRatio > 0.3 && stockRatio < 0.8 ? 0.2 : 0; // Sweet spot
  
  return Math.min(1, salesReward + conversionReward + stockReward);
}

async function logPricingMetrics(updatedCount: number) {
  const metrics = {
    timestamp: new Date().toISOString(),
    job: "intraday-pricing",
    events_processed: updatedCount,
    success: true,
  };

  // Log to demand_snapshots for tracking
  await supabase.from("demand_snapshots").insert({
    event_id: "system_metrics",
    ticket_type_id: "system_metrics", 
    price: 0,
    available_stock: 0,
    channel: "system_job",
    views: updatedCount,
    clicks: 0,
    sales: 0,
  });

  console.log("📈 Pricing metrics logged:", metrics);
}

// Main execution
if (require.main === module) {
  runIntradayPricing()
    .then(() => {
      console.log("🏁 Intraday pricing job completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Intraday pricing job failed:", error);
      process.exit(1);
    });
}

export { runIntradayPricing };