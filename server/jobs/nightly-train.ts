/**
 * Nightly Training Job
 * 
 * Runs daily to retrain models, update recommendation factors,
 * and analyze performance metrics from the previous day.
 */

import { createClient } from "@supabase/supabase-js";
import { MultiarmedBandit } from "../services/pricing/bandit";
import { PricingPolicy } from "../services/pricing/policy";
import { PropensityModel } from "../services/marketing/propensity";
import { UserFactors } from "../services/recommend/user_factors";
import { ItemFactors } from "../services/recommend/item_factors";
import { Ranker } from "../services/recommend/ranker";
import { config } from "../config";

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

async function runNightlyTraining() {
  console.log("🌙 Starting nightly training job...");
  
  try {
    const trainingResults = {
      timestamp: new Date().toISOString(),
      pricingUpdates: 0,
      recommendationUpdates: 0,
      propensityUpdates: 0,
      performanceMetrics: {},
    };

    // 1. Update pricing models
    console.log("💰 Training pricing models...");
    trainingResults.pricingUpdates = await trainPricingModels();

    // 2. Update recommendation models
    console.log("🎯 Training recommendation models...");
    trainingResults.recommendationUpdates = await trainRecommendationModels();

    // 3. Update propensity models
    console.log("📊 Training propensity models...");
    trainingResults.propensityUpdates = await trainPropensityModels();

    // 4. Generate performance reports
    console.log("📈 Generating performance reports...");
    trainingResults.performanceMetrics = await generatePerformanceReports();

    // 5. Cleanup old data
    console.log("🧹 Cleaning up old data...");
    await cleanupOldData();

    // 6. Log training results
    await logTrainingResults(trainingResults);

    console.log("✅ Nightly training completed successfully");
    console.log("📊 Training Summary:", trainingResults);

  } catch (error) {
    console.error("💥 Nightly training job failed:", error);
    
    // Log error for monitoring
    await supabase.from("demand_snapshots").insert({
      event_id: "system_error",
      ticket_type_id: "system_error",
      price: 0,
      available_stock: 0,
      channel: "nightly_training_error",
      views: 0,
      clicks: 0,
      sales: 0,
    });
    
    throw error;
  }
}

async function trainPricingModels(): Promise<number> {
  // Get yesterday's pricing performance data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const { data: pricingData, error } = await supabase
    .from("demand_snapshots")
    .select("*")
    .gte("snapshot_time", `${yesterdayStr}T00:00:00`)
    .lt("snapshot_time", `${yesterdayStr}T23:59:59`)
    .order("snapshot_time", { ascending: false });

  if (error || !pricingData) {
    console.warn("⚠️ No pricing data found for training");
    return 0;
  }

  const bandit = new MultiarmedBandit(config.pricing.banditEpsilon);
  const pricingPolicy = new PricingPolicy(supabase);
  let updatesCount = 0;

  // Group by event-ticket combinations
  const eventTicketGroups = groupBy(pricingData, item => `${item.event_id}-${item.ticket_type_id}`);

  for (const [eventTicketKey, snapshots] of Object.entries(eventTicketGroups)) {
    try {
      // Calculate performance metrics
      const performance = calculatePricingPerformance(snapshots);
      
      if (performance.totalInteractions === 0) continue;

      // Update bandit rewards based on actual performance
      for (const snapshot of snapshots) {
        const reward = calculatePricingReward(snapshot, performance);
        await bandit.updateReward(eventTicketKey, snapshot.price, reward);
      }

      updatesCount++;

      // Get insights for monitoring
      const insights = await pricingPolicy.getPricingInsights(
        snapshots[0].event_id,
        snapshots[0].ticket_type_id
      );

      if (updatesCount <= 5) { // Log first few for debugging
        console.log(`📊 Updated pricing model for ${eventTicketKey}:`, {
          totalInteractions: performance.totalInteractions,
          conversionRate: performance.conversionRate,
          revenuePerView: performance.revenuePerView,
          insights: insights.elasticityType,
        });
      }

    } catch (error) {
      console.error(`Error training pricing for ${eventTicketKey}:`, error);
    }
  }

  return updatesCount;
}

async function trainRecommendationModels(): Promise<number> {
  // Get recent interaction data for recommendation training
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data: recentInteractions, error } = await supabase
    .from("interactions")
    .select("*, events(*)")
    .gte("created_at", oneDayAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error || !recentInteractions) {
    console.warn("⚠️ No interaction data found for recommendation training");
    return 0;
  }

  const userFactors = new UserFactors(supabase);
  const itemFactors = new ItemFactors(supabase);
  const ranker = new Ranker(supabase);

  // Group interactions by customer
  const customerGroups = groupBy(recentInteractions, item => item.customer_id);
  let updatesCount = 0;

  // Process a sample of customers for training
  const customerSample = Object.entries(customerGroups).slice(0, 50);

  for (const [customerId, interactions] of customerSample) {
    try {
      // Calculate updated user profile
      const userProfile = await userFactors.calculateUserProfile(customerId, interactions);
      
      // Get purchase outcomes for this customer
      const purchases = interactions.filter(i => i.interaction_type === "purchase");
      
      if (purchases.length > 0) {
        // Use purchase data to update ranker weights
        const performanceData = calculateRecommendationPerformance(interactions);
        ranker.updateWeights(performanceData);
        updatesCount++;
      }

    } catch (error) {
      console.error(`Error training recommendations for customer ${customerId}:`, error);
    }
  }

  return updatesCount;
}

async function trainPropensityModels(): Promise<number> {
  // Get recent customer activity for propensity training
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: recentCustomers, error } = await supabase
    .from("customers")
    .select("*")
    .limit(100);

  if (error || !recentCustomers) {
    console.warn("⚠️ No customer data found for propensity training");
    return 0;
  }

  const propensityModel = new PropensityModel(supabase);
  let updatesCount = 0;
  const trainingData = [];

  // Collect training data
  for (const customer of recentCustomers.slice(0, 20)) { // Sample for performance
    try {
      // Get customer interactions and purchases
      const { data: interactions } = await supabase
        .from("interactions")
        .select("*, events(*)")
        .eq("customer_id", customer.id)
        .gte("created_at", oneWeekAgo.toISOString())
        .order("created_at", { ascending: false });

      const { data: consumptions } = await supabase
        .from("consumptions")
        .select("*")
        .eq("customerid", customer.id)
        .gte("timestamp", oneWeekAgo.toISOString());

      if (!interactions || interactions.length === 0) continue;

      // Calculate features and actual outcomes
      const propensityResult = await propensityModel.calculatePropensity(
        customer,
        interactions,
        consumptions || []
      );

      const actualPurchases = interactions.filter(i => i.interaction_type === "purchase").length;
      const hadPurchase = actualPurchases > 0;

      trainingData.push({
        features: propensityResult.features,
        actualPurchase: hadPurchase,
      });

      updatesCount++;

    } catch (error) {
      console.error(`Error collecting propensity data for customer ${customer.id}:`, error);
    }
  }

  // Update propensity model with training data
  if (trainingData.length > 5) {
    propensityModel.updateModel(trainingData);
    console.log(`🧠 Updated propensity model with ${trainingData.length} training examples`);
  }

  return updatesCount;
}

async function generatePerformanceReports(): Promise<any> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Get performance metrics
  const { data: pricingMetrics } = await supabase
    .from("demand_snapshots")
    .select("*")
    .gte("snapshot_time", `${yesterdayStr}T00:00:00`)
    .lt("snapshot_time", `${yesterdayStr}T23:59:59`);

  const { data: interactionMetrics } = await supabase
    .from("interactions")
    .select("*")
    .gte("created_at", `${yesterdayStr}T00:00:00`)
    .lt("created_at", `${yesterdayStr}T23:59:59`);

  const metrics = {
    pricing: {
      totalPriceQuotes: pricingMetrics?.filter(m => m.views > 0).length || 0,
      totalSales: pricingMetrics?.reduce((sum, m) => sum + (m.sales || 0), 0) || 0,
      totalRevenue: pricingMetrics?.reduce((sum, m) => sum + (m.price * (m.sales || 0)), 0) || 0,
      averageConversionRate: calculateAverageConversionRate(pricingMetrics || []),
    },
    recommendations: {
      totalInteractions: interactionMetrics?.length || 0,
      totalViews: interactionMetrics?.filter(i => i.interaction_type === "view").length || 0,
      totalPurchases: interactionMetrics?.filter(i => i.interaction_type === "purchase").length || 0,
      conversionRate: interactionMetrics ? 
        (interactionMetrics.filter(i => i.interaction_type === "purchase").length / interactionMetrics.length) : 0,
    },
    date: yesterdayStr,
  };

  // Store performance report
  await supabase.from("demand_snapshots").insert({
    event_id: "performance_report",
    ticket_type_id: "daily_metrics",
    price: metrics.pricing.totalRevenue,
    available_stock: 0,
    channel: "nightly_training",
    views: metrics.recommendations.totalViews,
    clicks: metrics.recommendations.totalInteractions,
    sales: metrics.pricing.totalSales,
  });

  return metrics;
}

async function cleanupOldData(): Promise<void> {
  // Clean up old demand snapshots (keep last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { error: cleanupError } = await supabase
    .from("demand_snapshots")
    .delete()
    .lt("snapshot_time", ninetyDaysAgo.toISOString())
    .neq("event_id", "system_metrics") // Keep system metrics
    .neq("event_id", "performance_report"); // Keep performance reports

  if (cleanupError) {
    console.warn("⚠️ Failed to cleanup old data:", cleanupError);
  } else {
    console.log("🧹 Cleaned up demand snapshots older than 90 days");
  }
}

async function logTrainingResults(results: any): Promise<void> {
  // Log comprehensive training results
  console.log("📊 Training Results Summary:");
  console.log(`   • Pricing models updated: ${results.pricingUpdates}`);
  console.log(`   • Recommendation models updated: ${results.recommendationUpdates}`);
  console.log(`   • Propensity models updated: ${results.propensityUpdates}`);
  console.log(`   • Daily revenue: R$ ${results.performanceMetrics.pricing?.totalRevenue?.toFixed(2) || 0}`);
  console.log(`   • Daily conversions: ${results.performanceMetrics.pricing?.totalSales || 0}`);
  console.log(`   • Conversion rate: ${(results.performanceMetrics.recommendations?.conversionRate * 100)?.toFixed(2) || 0}%`);

  // Store training summary
  await supabase.from("demand_snapshots").insert({
    event_id: "training_summary",
    ticket_type_id: "nightly_job",
    price: results.performanceMetrics.pricing?.totalRevenue || 0,
    available_stock: results.pricingUpdates + results.recommendationUpdates + results.propensityUpdates,
    channel: "nightly_training",
    views: results.performanceMetrics.recommendations?.totalViews || 0,
    clicks: results.performanceMetrics.recommendations?.totalInteractions || 0,
    sales: results.performanceMetrics.pricing?.totalSales || 0,
  });
}

// Helper functions
function groupBy<T>(array: T[], keyFn: (item: T) => string): { [key: string]: T[] } {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {} as { [key: string]: T[] });
}

function calculatePricingPerformance(snapshots: any[]): {
  totalInteractions: number;
  conversionRate: number;
  revenuePerView: number;
} {
  const totalViews = snapshots.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalSales = snapshots.reduce((sum, s) => sum + (s.sales || 0), 0);
  const totalRevenue = snapshots.reduce((sum, s) => sum + (s.price * (s.sales || 0)), 0);

  return {
    totalInteractions: totalViews + totalSales,
    conversionRate: totalViews > 0 ? totalSales / totalViews : 0,
    revenuePerView: totalViews > 0 ? totalRevenue / totalViews : 0,
  };
}

function calculatePricingReward(snapshot: any, performance: any): number {
  // Reward function for pricing decisions
  const conversionReward = performance.conversionRate * 0.5;
  const revenueReward = Math.min(0.3, performance.revenuePerView / 100);
  const volumeReward = Math.min(0.2, (snapshot.sales || 0) / 10);

  return conversionReward + revenueReward + volumeReward;
}

function calculateRecommendationPerformance(interactions: any[]): { [factor: string]: number } {
  const totalInteractions = interactions.length;
  const purchases = interactions.filter(i => i.interaction_type === "purchase");
  const views = interactions.filter(i => i.interaction_type === "view");

  return {
    conversionRate: totalInteractions > 0 ? purchases.length / totalInteractions : 0.5,
    engagementRate: totalInteractions > 0 ? (purchases.length + views.length) / totalInteractions : 0.5,
  };
}

function calculateAverageConversionRate(snapshots: any[]): number {
  if (!snapshots || snapshots.length === 0) return 0;

  const validSnapshots = snapshots.filter(s => (s.views || 0) > 0);
  if (validSnapshots.length === 0) return 0;

  const totalConversionRate = validSnapshots.reduce((sum, s) => {
    const views = s.views || 0;
    const sales = s.sales || 0;
    return sum + (views > 0 ? sales / views : 0);
  }, 0);

  return totalConversionRate / validSnapshots.length;
}

// Main execution
if (require.main === module) {
  runNightlyTraining()
    .then(() => {
      console.log("🏁 Nightly training job completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Nightly training job failed:", error);
      process.exit(1);
    });
}

export { runNightlyTraining };
