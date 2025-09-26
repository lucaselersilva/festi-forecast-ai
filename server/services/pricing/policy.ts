/**
 * Pricing Policy Engine
 * 
 * Combines external signals, business rules, and demand elasticity
 * to recommend optimal pricing strategies.
 */

import { SupabaseClient } from "@supabase/supabase-js";

interface PricingContext {
  basePrice: number;
  currentStock: number;
  capacity: number;
  timeToEvent: number;
  channel: string;
  signals: any;
}

interface DemandElasticity {
  priceElasticity: number;
  demandCurve: { price: number; expectedDemand: number }[];
  lastUpdated: Date;
}

export class PricingPolicy {
  private supabase: SupabaseClient;
  private elasticityCache: Map<string, DemandElasticity> = new Map();
  
  // Business rules configuration
  private readonly MIN_MARKUP = 0.8;  // Minimum 80% of base price
  private readonly MAX_MARKUP = 2.5;  // Maximum 250% of base price
  private readonly CAPACITY_THRESHOLDS = {
    LOW_STOCK: 0.2,    // Below 20% capacity
    MEDIUM_STOCK: 0.5, // Below 50% capacity
  };

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Calculate recommended price based on policy rules
   */
  async calculatePrice(
    eventId: string,
    ticketTypeId: string,
    context: PricingContext
  ): Promise<number> {
    
    // Start with base price
    let recommendedPrice = context.basePrice;

    // Apply demand elasticity if available
    const elasticity = await this.getDemandElasticity(eventId, ticketTypeId);
    if (elasticity) {
      recommendedPrice = this.applyElasticityPricing(recommendedPrice, context, elasticity);
    }

    // Apply business rules
    recommendedPrice = this.applyBusinessRules(recommendedPrice, context);

    // Apply external signals
    recommendedPrice = this.applyExternalSignals(recommendedPrice, context);

    // Ensure price is within acceptable bounds
    recommendedPrice = this.enforceBusinessConstraints(recommendedPrice, context.basePrice);

    return Math.round(recommendedPrice * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Apply demand elasticity to pricing
   */
  private applyElasticityPricing(
    basePrice: number,
    context: PricingContext,
    elasticity: DemandElasticity
  ): number {
    
    // Find optimal price point on demand curve
    const stockRatio = context.currentStock / context.capacity;
    const timeRatio = Math.max(0, context.timeToEvent) / (30 * 24 * 60 * 60 * 1000); // 30 days max

    // Adjust based on stock level and time pressure
    let targetDemand = stockRatio;
    
    if (timeRatio < 0.1) { // Less than 3 days
      targetDemand *= 1.2; // Increase target demand (raise prices)
    } else if (timeRatio > 0.7) { // More than 21 days
      targetDemand *= 0.8; // Decrease target demand (lower prices)
    }

    // Find price that matches target demand
    const optimalPoint = elasticity.demandCurve.find(point => 
      Math.abs(point.expectedDemand - targetDemand) < 0.1
    );

    return optimalPoint ? optimalPoint.price : basePrice;
  }

  /**
   * Apply core business rules
   */
  private applyBusinessRules(price: number, context: PricingContext): number {
    let adjustedPrice = price;

    // Stock-based premium
    const stockRatio = context.currentStock / context.capacity;
    
    if (stockRatio <= this.CAPACITY_THRESHOLDS.LOW_STOCK) {
      // High demand, low stock - apply premium
      adjustedPrice *= 1.15; // 15% premium
    } else if (stockRatio <= this.CAPACITY_THRESHOLDS.MEDIUM_STOCK) {
      // Medium demand - slight premium
      adjustedPrice *= 1.08; // 8% premium
    }

    // Time-based pricing
    const daysToEvent = context.timeToEvent / (1000 * 60 * 60 * 24);
    
    if (daysToEvent < 1) {
      // Last day premium
      adjustedPrice *= 1.25;
    } else if (daysToEvent < 3) {
      // Last minute premium
      adjustedPrice *= 1.15;
    } else if (daysToEvent < 7) {
      // Week before premium
      adjustedPrice *= 1.1;
    } else if (daysToEvent > 30) {
      // Early bird discount
      adjustedPrice *= 0.95;
    }

    // Channel-based adjustments
    switch (context.channel) {
      case "mobile":
        adjustedPrice *= 1.02; // 2% mobile premium
        break;
      case "app":
        adjustedPrice *= 0.98; // 2% app discount (loyalty)
        break;
      case "partner":
        adjustedPrice *= 1.05; // 5% partner premium
        break;
    }

    return adjustedPrice;
  }

  /**
   * Apply external signals (weather, trends, holidays)
   */
  private applyExternalSignals(price: number, context: PricingContext): number {
    let adjustedPrice = price;

    if (!context.signals) return adjustedPrice;

    // Weather impact
    if (context.signals.temperature !== undefined) {
      const temp = context.signals.temperature;
      // Outdoor events: good weather = premium, bad weather = discount
      if (temp > 25 && temp < 30 && (context.signals.precipitation || 0) < 2) {
        adjustedPrice *= 1.08; // Good weather premium
      } else if (temp < 15 || (context.signals.precipitation || 0) > 10) {
        adjustedPrice *= 0.95; // Bad weather discount
      }
    }

    // Holiday premium
    if (context.signals.is_holiday) {
      adjustedPrice *= 1.12; // 12% holiday premium
    }

    // Google Trends boost
    if (context.signals.google_trends) {
      const trendsScore = context.signals.google_trends;
      if (trendsScore > 80) {
        adjustedPrice *= 1.1; // High trend premium
      } else if (trendsScore > 60) {
        adjustedPrice *= 1.05; // Medium trend premium
      } else if (trendsScore < 30) {
        adjustedPrice *= 0.97; // Low trend discount
      }
    }

    // Instagram mentions boost
    if (context.signals.instagram_mentions > 300) {
      adjustedPrice *= 1.06; // Social buzz premium
    }

    return adjustedPrice;
  }

  /**
   * Enforce business constraints
   */
  private enforceBusinessConstraints(price: number, basePrice: number): number {
    const minPrice = basePrice * this.MIN_MARKUP;
    const maxPrice = basePrice * this.MAX_MARKUP;

    return Math.max(minPrice, Math.min(maxPrice, price));
  }

  /**
   * Get or calculate demand elasticity for event/ticket type
   */
  private async getDemandElasticity(
    eventId: string,
    ticketTypeId: string
  ): Promise<DemandElasticity | null> {
    
    const cacheKey = `${eventId}-${ticketTypeId}`;
    
    // Check cache first
    const cached = this.elasticityCache.get(cacheKey);
    if (cached && (Date.now() - cached.lastUpdated.getTime()) < 24 * 60 * 60 * 1000) {
      return cached;
    }

    // Fetch historical demand data
    const { data: snapshots } = await this.supabase
      .from("demand_snapshots")
      .select("*")
      .eq("event_id", eventId)
      .eq("ticket_type_id", ticketTypeId)
      .order("snapshot_time", { ascending: false })
      .limit(100);

    if (!snapshots || snapshots.length < 10) {
      return null; // Not enough data
    }

    // Calculate price elasticity
    const elasticity = this.calculateElasticity(snapshots);
    
    // Cache result
    this.elasticityCache.set(cacheKey, elasticity);
    
    return elasticity;
  }

  /**
   * Calculate price elasticity from historical data
   */
  private calculateElasticity(snapshots: any[]): DemandElasticity {
    // Group by price points
    const priceGroups: Map<number, { views: number; clicks: number; sales: number; count: number }> = new Map();

    snapshots.forEach(snapshot => {
      const price = Math.round(snapshot.price);
      const existing = priceGroups.get(price) || { views: 0, clicks: 0, sales: 0, count: 0 };
      
      priceGroups.set(price, {
        views: existing.views + (snapshot.views || 0),
        clicks: existing.clicks + (snapshot.clicks || 0),
        sales: existing.sales + (snapshot.sales || 0),
        count: existing.count + 1,
      });
    });

    // Calculate demand curve
    const demandCurve = Array.from(priceGroups.entries()).map(([price, data]) => {
      const avgViews = data.views / data.count;
      const conversionRate = data.views > 0 ? data.sales / data.views : 0;
      const expectedDemand = avgViews * conversionRate;

      return { price, expectedDemand };
    }).sort((a, b) => a.price - b.price);

    // Simple elasticity calculation (% change in demand / % change in price)
    let elasticity = -1.0; // Default elastic demand

    if (demandCurve.length >= 2) {
      const [low, high] = [demandCurve[0], demandCurve[demandCurve.length - 1]];
      const priceChange = (high.price - low.price) / low.price;
      const demandChange = (high.expectedDemand - low.expectedDemand) / low.expectedDemand;
      
      if (priceChange !== 0) {
        elasticity = demandChange / priceChange;
      }
    }

    return {
      priceElasticity: elasticity,
      demandCurve,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get pricing recommendations and insights
   */
  async getPricingInsights(eventId: string, ticketTypeId: string): Promise<any> {
    const elasticity = await this.getDemandElasticity(eventId, ticketTypeId);
    
    const insights = {
      hasHistoricalData: !!elasticity,
      priceElasticity: elasticity?.priceElasticity || "unknown",
      elasticityType: this.classifyElasticity(elasticity?.priceElasticity || 0),
      recommendations: this.generatePricingRecommendations(elasticity),
      lastUpdated: elasticity?.lastUpdated || null,
    };

    return insights;
  }

  /**
   * Classify elasticity type
   */
  private classifyElasticity(elasticity: number): string {
    if (Math.abs(elasticity) > 1) return "elástica"; // Sensitive to price changes
    if (Math.abs(elasticity) < 0.5) return "inelástica"; // Not sensitive to price changes
    return "unitária"; // Neutral sensitivity
  }

  /**
   * Generate pricing recommendations based on elasticity
   */
  private generatePricingRecommendations(elasticity: DemandElasticity | null): string[] {
    const recommendations = [];

    if (!elasticity) {
      recommendations.push("Colete mais dados históricos para melhorar as recomendações");
      recommendations.push("Use pricing conservador até ter mais informações");
      return recommendations;
    }

    if (Math.abs(elasticity.priceElasticity) > 1) {
      recommendations.push("Demanda é sensível ao preço - cuidado com aumentos");
      recommendations.push("Considere descontos para aumentar volume");
    } else {
      recommendations.push("Demanda é pouco sensível ao preço - oportunidade de premium");
      recommendations.push("Pode aumentar preços sem grande impacto na demanda");
    }

    if (elasticity.demandCurve.length > 5) {
      const optimalPrice = elasticity.demandCurve.reduce((best, current) => 
        (current.price * current.expectedDemand) > (best.price * best.expectedDemand) ? current : best
      );
      recommendations.push(`Preço ótimo histórico: R$ ${optimalPrice.price}`);
    }

    return recommendations;
  }
}