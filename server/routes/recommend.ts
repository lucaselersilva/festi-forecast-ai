import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config";
import { UserFactors } from "../services/recommend/user_factors";
import { ItemFactors } from "../services/recommend/item_factors";
import { Ranker } from "../services/recommend/ranker";

const router = Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

// Initialize recommendation services
const userFactors = new UserFactors(supabase);
const itemFactors = new ItemFactors(supabase);
const ranker = new Ranker(supabase);

// GET /events?customerId= → retorna top-N eventos recomendados
router.get("/events", async (req, res) => {
  try {
    const { customerId, limit = "10" } = req.query;

    if (!customerId) {
      return res.status(400).json({
        error: "Missing required parameter",
        required: ["customerId"]
      });
    }

    // Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get customer interaction history
    const { data: interactions } = await supabase
      .from("interactions")
      .select("*, events(*)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(100);

    // Calculate user factors
    const userProfile = await userFactors.calculateUserProfile(customerId as string, interactions || []);

    // Get available future events
    const { data: availableEvents } = await supabase
      .from("events")
      .select("*, ticket_types(*)")
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (!availableEvents || availableEvents.length === 0) {
      return res.json({
        customerId,
        recommendations: [],
        message: "No upcoming events available"
      });
    }

    // Calculate item factors and rank events
    const eventRecommendations = await Promise.all(
      availableEvents.slice(0, parseInt(limit as string) * 3).map(async (event) => {
        const itemProfile = await itemFactors.calculateItemProfile(event.id, event);
        const score = await ranker.calculateRecommendationScore(userProfile, itemProfile, event);
        
        return {
          eventId: event.id,
          event,
          score,
          reasons: ranker.generateRecommendationReasons(userProfile, itemProfile, event),
        };
      })
    );

    // Sort by score and take top N
    const topRecommendations = eventRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit as string));

    res.json({
      customerId,
      userProfile: {
        favoriteGenres: userProfile.favoriteGenres,
        averageTicketPrice: userProfile.averageTicketPrice,
        preferredCities: userProfile.preferredCities,
        totalEvents: userProfile.totalEvents,
      },
      recommendations: topRecommendations.map(rec => ({
        eventId: rec.eventId,
        event: {
          id: rec.event.id,
          date: rec.event.date,
          artist: rec.event.artist,
          genre: rec.event.genre,
          city: rec.event.city,
          venue: rec.event.venue,
          ticketTypes: rec.event.ticket_types,
        },
        score: Math.round(rec.score * 100) / 100,
        reasons: rec.reasons,
        conversionProbability: rec.score > 0.7 ? "alta" : rec.score > 0.4 ? "média" : "baixa",
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Event recommendation error:", error);
    res.status(500).json({ error: "Failed to get event recommendations" });
  }
});

// GET /addons?customerId=&eventId= → retorna sugestões de upsell
router.get("/addons", async (req, res) => {
  try {
    const { customerId, eventId } = req.query;

    if (!customerId || !eventId) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["customerId", "eventId"]
      });
    }

    // Get customer consumption history
    const { data: consumptions } = await supabase
      .from("consumptions")
      .select("*")
      .eq("customerid", customerId)
      .order("timestamp", { ascending: false })
      .limit(50);

    // Get event details
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Analyze consumption patterns
    const consumptionAnalysis = analyzeConsumptionPatterns(consumptions || []);

    // Generate addon recommendations based on patterns and event genre
    const addonRecommendations = generateAddonRecommendations(
      consumptionAnalysis,
      event,
      consumptions || []
    );

    res.json({
      customerId,
      eventId,
      consumptionProfile: {
        averageSpending: consumptionAnalysis.averageSpending,
        favoriteItems: consumptionAnalysis.topItems,
        frequencyPattern: consumptionAnalysis.frequency,
      },
      recommendations: addonRecommendations,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Addon recommendation error:", error);
    res.status(500).json({ error: "Failed to get addon recommendations" });
  }
});

// Helper functions
function analyzeConsumptionPatterns(consumptions: any[]) {
  if (consumptions.length === 0) {
    return {
      averageSpending: 0,
      topItems: [],
      frequency: "baixa",
      totalValue: 0,
    };
  }

  const totalValue = consumptions.reduce((sum, c) => sum + parseFloat(c.totalvalue || 0), 0);
  const averageSpending = totalValue / consumptions.length;

  // Count item frequencies
  const itemCounts: Record<string, number> = {};
  consumptions.forEach(c => {
    itemCounts[c.item] = (itemCounts[c.item] || 0) + c.quantity;
  });

  const topItems = Object.entries(itemCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([item, count]) => ({ item, count }));

  const frequency = consumptions.length > 10 ? "alta" : consumptions.length > 3 ? "média" : "baixa";

  return { averageSpending, topItems, frequency, totalValue };
}

function generateAddonRecommendations(analysis: any, event: any, consumptions: any[]) {
  const recommendations = [];

  // Base recommendations by genre
  const genreRecommendations: Record<string, any[]> = {
    "Eletrônica": [
      { item: "Combo Energético + Vodka", price: 45, reason: "Popular em eventos eletrônicos" },
      { item: "Água Premium", price: 8, reason: "Essencial para hidratação na pista" },
    ],
    "Rock": [
      { item: "Cerveja Artesanal", price: 15, reason: "Preferida do público rock" },
      { item: "Combo Cerveja + Petisco", price: 35, reason: "Combinação clássica" },
    ],
    "Sertanejo": [
      { item: "Caipirinha Premium", price: 25, reason: "Bebida tradicional do gênero" },
      { item: "Combo Whisky + Gelo", price: 55, reason: "Popular em shows sertanejos" },
    ],
    "Funk": [
      { item: "Gin Tônica", price: 30, reason: "Trend no público funk" },
      { item: "Combo Drinks Coloridos", price: 40, reason: "Visual atrativo para o gênero" },
    ],
  };

  const baseRecs = genreRecommendations[event.genre] || [
    { item: "Bebida Gelada", price: 12, reason: "Recomendação geral" },
    { item: "Petisco", price: 20, reason: "Acompanhamento popular" },
  ];

  // Personalize based on customer history
  if (analysis.averageSpending > 30) {
    recommendations.push({
      ...baseRecs[1] || baseRecs[0],
      conversionProbability: "alta",
      expectedUplift: `+R$ ${Math.round(analysis.averageSpending * 0.3)}`,
    });
  }

  if (analysis.topItems.length > 0) {
    const favoriteItem = analysis.topItems[0];
    recommendations.push({
      item: `Combo ${favoriteItem.item} + Extra`,
      price: Math.round(analysis.averageSpending * 1.2),
      reason: `Baseado no seu histórico (${favoriteItem.count}x consumido)`,
      conversionProbability: "alta",
      expectedUplift: `+R$ ${Math.round(analysis.averageSpending * 0.4)}`,
    });
  }

  // Add base recommendations
  baseRecs.forEach(rec => {
    recommendations.push({
      ...rec,
      conversionProbability: analysis.frequency === "alta" ? "média" : "baixa",
      expectedUplift: `+R$ ${Math.round(rec.price * 0.7)}`,
    });
  });

  return recommendations.slice(0, 4); // Return top 4 recommendations
}

export default router;