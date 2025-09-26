import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config";
import { PropensityModel } from "../services/marketing/propensity";

const router = Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

// Initialize marketing services
const propensityModel = new PropensityModel(supabase);

// GET /propensity?customerId=&eventId= → retorna score 0..1
router.get("/propensity", async (req, res) => {
  try {
    const { customerId, eventId } = req.query;

    if (!customerId) {
      return res.status(400).json({
        error: "Missing required parameter",
        required: ["customerId"]
      });
    }

    // Get customer data
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

    // Get customer consumption history
    const { data: consumptions } = await supabase
      .from("consumptions")
      .select("*")
      .eq("customerid", customerId)
      .order("timestamp", { ascending: false })
      .limit(50);

    let eventData = null;
    if (eventId) {
      const { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      eventData = event;
    }

    // Calculate propensity score
    const propensityResult = await propensityModel.calculatePropensity(
      customer,
      interactions || [],
      consumptions || [],
      eventData
    );

    // Store scoring snapshot
    await supabase.from("scoring_snapshots").insert({
      customer_id: customerId,
      event_id: eventId || null,
      propensity_score: propensityResult.score,
      segment: propensityResult.segment,
      recency_days: propensityResult.features.recency,
      frequency_score: propensityResult.features.frequency,
      monetary_value: propensityResult.features.monetary,
      predicted_ltv: propensityResult.predictedLTV,
    });

    res.json({
      customerId,
      eventId: eventId || null,
      propensityScore: Math.round(propensityResult.score * 10000) / 10000,
      segment: propensityResult.segment,
      features: propensityResult.features,
      predictedLTV: propensityResult.predictedLTV,
      confidence: propensityResult.confidence,
      recommendations: propensityResult.recommendations,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Propensity calculation error:", error);
    res.status(500).json({ error: "Failed to calculate propensity score" });
  }
});

// POST /campaigns/dispatch → grava intenção e retorna cohorts segmentados
router.post("/campaigns/dispatch", async (req, res) => {
  try {
    const { 
      campaignName, 
      eventId, 
      targetSegments = ["alta_propensao", "media_propensao"], 
      messageType = "promocional",
      budget,
      channel = "email"
    } = req.body;

    if (!campaignName) {
      return res.status(400).json({
        error: "Missing required parameter",
        required: ["campaignName"]
      });
    }

    // Get customers with recent propensity scores
    let query = supabase
      .from("scoring_snapshots")
      .select("*, customers(*)")
      .order("created_at", { ascending: false });

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data: scoringData, error: scoringError } = await query.limit(1000);

    if (scoringError) {
      return res.status(500).json({ error: "Failed to fetch scoring data" });
    }

    // Filter by target segments
    const segmentMapping: Record<string, (score: number) => boolean> = {
      "alta_propensao": (score) => score >= 0.7,
      "media_propensao": (score) => score >= 0.4 && score < 0.7,
      "baixa_propensao": (score) => score < 0.4,
    };

    const targetCustomers = scoringData?.filter(item => 
      targetSegments.some(segment => 
        segmentMapping[segment] && segmentMapping[segment](item.propensity_score)
      )
    ) || [];

    // Group customers by segment and propensity
    const cohorts = groupIntoCohorts(targetCustomers, targetSegments);

    // Calculate campaign metrics
    const totalReach = targetCustomers.length;
    const estimatedCTR = calculateEstimatedCTR(cohorts);
    const estimatedConversion = calculateEstimatedConversion(cohorts);
    const estimatedRevenue = calculateEstimatedRevenue(cohorts, budget);

    const campaignId = `campaign_${Date.now()}`;

    // Store campaign intention (in a real scenario, you'd have a campaigns table)
    const campaignData = {
      campaignId,
      campaignName,
      eventId,
      targetSegments,
      messageType,
      channel,
      budget,
      targetCustomers: targetCustomers.length,
      cohorts: cohorts.length,
      estimatedMetrics: {
        reach: totalReach,
        ctr: estimatedCTR,
        conversion: estimatedConversion,
        revenue: estimatedRevenue,
      },
      createdAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      campaign: campaignData,
      cohorts: cohorts.map(cohort => ({
        segment: cohort.segment,
        size: cohort.customers.length,
        averagePropensity: cohort.averagePropensity,
        estimatedCTR: cohort.estimatedCTR,
        estimatedConversion: cohort.estimatedConversion,
        preferredGenres: cohort.topGenres,
        averageLTV: cohort.averageLTV,
      })),
      recommendations: generateCampaignRecommendations(cohorts, campaignData),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Campaign dispatch error:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// Helper functions
function groupIntoCohorts(customers: any[], targetSegments: string[]) {
  const cohorts: any[] = [];

  targetSegments.forEach(segment => {
    const segmentCustomers = customers.filter(customer => {
      const score = customer.propensity_score;
      switch (segment) {
        case "alta_propensao": return score >= 0.7;
        case "media_propensao": return score >= 0.4 && score < 0.7;
        case "baixa_propensao": return score < 0.4;
        default: return false;
      }
    });

    if (segmentCustomers.length > 0) {
      // Get customer interaction history for genre analysis
      const genres: Record<string, number> = {};
      segmentCustomers.forEach(customer => {
        if (customer.customers) {
          // In a real implementation, you'd join with interactions to get genre preferences
          genres["Eletrônica"] = (genres["Eletrônica"] || 0) + 1;
        }
      });

      const topGenres = Object.entries(genres)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([genre, count]) => ({ genre, count }));

      cohorts.push({
        segment,
        customers: segmentCustomers,
        averagePropensity: segmentCustomers.reduce((sum, c) => sum + c.propensity_score, 0) / segmentCustomers.length,
        averageLTV: segmentCustomers.reduce((sum, c) => sum + (c.predicted_ltv || 0), 0) / segmentCustomers.length,
        estimatedCTR: segment === "alta_propensao" ? 0.15 : segment === "media_propensao" ? 0.08 : 0.03,
        estimatedConversion: segment === "alta_propensao" ? 0.12 : segment === "media_propensao" ? 0.05 : 0.01,
        topGenres: topGenres.length > 0 ? topGenres : [{ genre: "Geral", count: segmentCustomers.length }],
      });
    }
  });

  return cohorts;
}

function calculateEstimatedCTR(cohorts: any[]) {
  const totalCustomers = cohorts.reduce((sum, cohort) => sum + cohort.customers.length, 0);
  if (totalCustomers === 0) return 0;

  const weightedCTR = cohorts.reduce((sum, cohort) => 
    sum + (cohort.estimatedCTR * cohort.customers.length), 0
  );

  return weightedCTR / totalCustomers;
}

function calculateEstimatedConversion(cohorts: any[]) {
  const totalCustomers = cohorts.reduce((sum, cohort) => sum + cohort.customers.length, 0);
  if (totalCustomers === 0) return 0;

  const weightedConversion = cohorts.reduce((sum, cohort) => 
    sum + (cohort.estimatedConversion * cohort.customers.length), 0
  );

  return weightedConversion / totalCustomers;
}

function calculateEstimatedRevenue(cohorts: any[], budget?: number) {
  const totalRevenue = cohorts.reduce((sum, cohort) => 
    sum + (cohort.averageLTV * cohort.customers.length * cohort.estimatedConversion), 0
  );

  return budget ? Math.min(totalRevenue, budget * 3) : totalRevenue; // Cap at 3x budget
}

function generateCampaignRecommendations(cohorts: any[], campaign: any) {
  const recommendations = [];

  // Segment-specific recommendations
  cohorts.forEach(cohort => {
    if (cohort.segment === "alta_propensao") {
      recommendations.push({
        type: "targeting",
        priority: "alta",
        message: `Foque no segmento de alta propensão (${cohort.customers.length} clientes) com ofertas premium`,
        expectedImpact: "+25% conversão",
      });
    }

    if (cohort.averagePropensity > 0.6) {
      recommendations.push({
        type: "timing",
        priority: "média",
        message: "Envie campanhas para este segmento nos horários de maior engajamento (19h-21h)",
        expectedImpact: "+15% CTR",
      });
    }
  });

  // Budget recommendations
  if (campaign.budget) {
    recommendations.push({
      type: "budget",
      priority: "alta",
      message: `Aloque 60% do orçamento para segmento de alta propensão para maximizar ROI`,
      expectedImpact: `+${Math.round(campaign.estimatedMetrics.revenue * 0.3)}% receita`,
    });
  }

  return recommendations;
}

export default router;