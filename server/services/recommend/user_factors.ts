/**
 * User Factors Analysis for Recommendation Engine
 * 
 * Analyzes user behavior patterns, preferences, and historical data
 * to create detailed user profiles for personalized recommendations.
 */

import { SupabaseClient } from "@supabase/supabase-js";

interface UserProfile {
  customerId: string;
  favoriteGenres: { genre: string; score: number }[];
  averageTicketPrice: number;
  priceRange: { min: number; max: number };
  preferredCities: string[];
  preferredVenues: string[];
  averageGroupSize: number;
  frequencyPattern: "alta" | "média" | "baixa";
  totalEvents: number;
  totalSpent: number;
  lifetimeValue: number;
  churnRisk: "baixo" | "médio" | "alto";
  lastActivity: Date;
  seasonality: { [month: string]: number };
  dayOfWeekPreference: { [day: string]: number };
  consumptionProfile: {
    averageBarSpend: number;
    favoriteItems: string[];
    spendingPattern: "premium" | "médio" | "econômico";
  };
}

export class UserFactors {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Calculate comprehensive user profile
   */
  async calculateUserProfile(customerId: string, interactions: any[]): Promise<UserProfile> {
    // Get customer basic data
    const { data: customer } = await this.supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    // Get consumption history
    const { data: consumptions } = await this.supabase
      .from("consumptions")
      .select("*")
      .eq("customerid", customerId)
      .order("timestamp", { ascending: false })
      .limit(100);

    // Analyze interactions
    const genreAnalysis = this.analyzeGenrePreferences(interactions);
    const priceAnalysis = this.analyzePricePatterns(interactions);
    const locationAnalysis = this.analyzeLocationPreferences(interactions);
    const temporalAnalysis = this.analyzeTemporalPatterns(interactions);
    const consumptionAnalysis = this.analyzeConsumptionProfile(consumptions || []);

    // Calculate derived metrics
    const frequencyPattern = this.calculateFrequencyPattern(interactions);
    const churnRisk = this.calculateChurnRisk(interactions, customer);
    const lifetimeValue = this.calculateLifetimeValue(interactions, consumptions || []);

    return {
      customerId,
      favoriteGenres: genreAnalysis.topGenres,
      averageTicketPrice: priceAnalysis.average,
      priceRange: priceAnalysis.range,
      preferredCities: locationAnalysis.cities,
      preferredVenues: locationAnalysis.venues,
      averageGroupSize: this.calculateAverageGroupSize(interactions),
      frequencyPattern,
      totalEvents: interactions.filter(i => i.interaction_type === "purchase").length,
      totalSpent: priceAnalysis.totalSpent,
      lifetimeValue,
      churnRisk,
      lastActivity: interactions.length > 0 ? new Date(interactions[0].created_at) : new Date(),
      seasonality: temporalAnalysis.seasonality,
      dayOfWeekPreference: temporalAnalysis.dayOfWeek,
      consumptionProfile: consumptionAnalysis,
    };
  }

  /**
   * Analyze genre preferences with weighted scoring
   */
  private analyzeGenrePreferences(interactions: any[]): { topGenres: { genre: string; score: number }[] } {
    const genreScores: Map<string, number> = new Map();

    interactions.forEach(interaction => {
      if (!interaction.events?.genre) return;

      const genre = interaction.events.genre;
      const weight = this.getInteractionWeight(interaction.interaction_type);
      const recencyBonus = this.getRecencyBonus(interaction.created_at);

      const currentScore = genreScores.get(genre) || 0;
      genreScores.set(genre, currentScore + (weight * recencyBonus));
    });

    // Convert to sorted array
    const topGenres = Array.from(genreScores.entries())
      .map(([genre, score]) => ({ genre, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return { topGenres };
  }

  /**
   * Analyze price patterns and spending behavior
   */
  private analyzePricePatterns(interactions: any[]): {
    average: number;
    range: { min: number; max: number };
    totalSpent: number;
  } {
    const purchaseInteractions = interactions.filter(i => 
      i.interaction_type === "purchase" && i.value > 0
    );

    if (purchaseInteractions.length === 0) {
      return { average: 0, range: { min: 0, max: 0 }, totalSpent: 0 };
    }

    const prices = purchaseInteractions.map(i => parseFloat(i.value));
    const totalSpent = prices.reduce((sum, price) => sum + price, 0);
    const average = totalSpent / prices.length;

    return {
      average,
      range: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      totalSpent,
    };
  }

  /**
   * Analyze location preferences
   */
  private analyzeLocationPreferences(interactions: any[]): {
    cities: string[];
    venues: string[];
  } {
    const cityCounts: Map<string, number> = new Map();
    const venueCounts: Map<string, number> = new Map();

    interactions.forEach(interaction => {
      if (!interaction.events) return;

      const city = interaction.events.city;
      const venue = interaction.events.venue;

      if (city) {
        cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
      }
      if (venue) {
        venueCounts.set(venue, (venueCounts.get(venue) || 0) + 1);
      }
    });

    const cities = Array.from(cityCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([city]) => city);

    const venues = Array.from(venueCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([venue]) => venue);

    return { cities, venues };
  }

  /**
   * Analyze temporal patterns (seasonality, day of week)
   */
  private analyzeTemporalPatterns(interactions: any[]): {
    seasonality: { [month: string]: number };
    dayOfWeek: { [day: string]: number };
  } {
    const monthCounts: Map<string, number> = new Map();
    const dayOfWeekCounts: Map<string, number> = new Map();

    interactions.forEach(interaction => {
      const date = new Date(interaction.created_at);
      const month = date.toLocaleString('pt-BR', { month: 'long' });
      const dayOfWeek = date.toLocaleString('pt-BR', { weekday: 'long' });

      monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
      dayOfWeekCounts.set(dayOfWeek, (dayOfWeekCounts.get(dayOfWeek) || 0) + 1);
    });

    const seasonality: { [month: string]: number } = {};
    const dayOfWeek: { [day: string]: number } = {};

    monthCounts.forEach((count, month) => {
      seasonality[month] = count;
    });

    dayOfWeekCounts.forEach((count, day) => {
      dayOfWeek[day] = count;
    });

    return { seasonality, dayOfWeek };
  }

  /**
   * Analyze consumption profile from bar/concession data
   */
  private analyzeConsumptionProfile(consumptions: any[]): {
    averageBarSpend: number;
    favoriteItems: string[];
    spendingPattern: "premium" | "médio" | "econômico";
  } {
    if (consumptions.length === 0) {
      return {
        averageBarSpend: 0,
        favoriteItems: [],
        spendingPattern: "econômico",
      };
    }

    const totalBarSpend = consumptions.reduce((sum, c) => sum + parseFloat(c.totalvalue || 0), 0);
    const averageBarSpend = totalBarSpend / consumptions.length;

    // Count favorite items
    const itemCounts: Map<string, number> = new Map();
    consumptions.forEach(c => {
      itemCounts.set(c.item, (itemCounts.get(c.item) || 0) + c.quantity);
    });

    const favoriteItems = Array.from(itemCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([item]) => item);

    // Classify spending pattern
    let spendingPattern: "premium" | "médio" | "econômico";
    if (averageBarSpend > 50) {
      spendingPattern = "premium";
    } else if (averageBarSpend > 20) {
      spendingPattern = "médio";
    } else {
      spendingPattern = "econômico";
    }

    return {
      averageBarSpend,
      favoriteItems,
      spendingPattern,
    };
  }

  /**
   * Calculate frequency pattern
   */
  private calculateFrequencyPattern(interactions: any[]): "alta" | "média" | "baixa" {
    const purchases = interactions.filter(i => i.interaction_type === "purchase");
    const monthsActive = this.calculateMonthsActive(interactions);

    if (monthsActive === 0) return "baixa";

    const eventsPerMonth = purchases.length / monthsActive;

    if (eventsPerMonth >= 2) return "alta";
    if (eventsPerMonth >= 0.5) return "média";
    return "baixa";
  }

  /**
   * Calculate churn risk
   */
  private calculateChurnRisk(interactions: any[], customer: any): "baixo" | "médio" | "alto" {
    if (interactions.length === 0) return "alto";

    const lastInteraction = new Date(interactions[0].created_at);
    const daysSinceLastActivity = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);

    const purchases = interactions.filter(i => i.interaction_type === "purchase");
    const averageTimeBetweenPurchases = this.calculateAverageTimeBetweenPurchases(purchases);

    if (daysSinceLastActivity > averageTimeBetweenPurchases * 2) return "alto";
    if (daysSinceLastActivity > averageTimeBetweenPurchases * 1.5) return "médio";
    return "baixo";
  }

  /**
   * Calculate customer lifetime value
   */
  private calculateLifetimeValue(interactions: any[], consumptions: any[]): number {
    const ticketRevenue = interactions
      .filter(i => i.interaction_type === "purchase")
      .reduce((sum, i) => sum + (parseFloat(i.value) || 0), 0);

    const barRevenue = consumptions
      .reduce((sum, c) => sum + (parseFloat(c.totalvalue) || 0), 0);

    return ticketRevenue + barRevenue;
  }

  /**
   * Helper methods
   */
  private getInteractionWeight(interactionType: string): number {
    const weights: { [key: string]: number } = {
      "view": 1,
      "click": 2,
      "add_to_cart": 3,
      "purchase": 5,
    };
    return weights[interactionType] || 1;
  }

  private getRecencyBonus(createdAt: string): number {
    const daysSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince < 30) return 1.2;  // Recent bonus
    if (daysSince < 90) return 1.0;  // Normal weight
    if (daysSince < 180) return 0.8; // Slight decay
    return 0.6; // Older interactions
  }

  private calculateMonthsActive(interactions: any[]): number {
    if (interactions.length === 0) return 0;

    const dates = interactions.map(i => new Date(i.created_at));
    const earliest = Math.min(...dates.map(d => d.getTime()));
    const latest = Math.max(...dates.map(d => d.getTime()));

    return Math.max(1, (latest - earliest) / (1000 * 60 * 60 * 24 * 30));
  }

  private calculateAverageTimeBetweenPurchases(purchases: any[]): number {
    if (purchases.length <= 1) return 60; // Default 60 days

    const dates = purchases
      .map(p => new Date(p.created_at).getTime())
      .sort((a, b) => b - a);

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i-1] - dates[i]) / (1000 * 60 * 60 * 24));
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private calculateAverageGroupSize(interactions: any[]): number {
    // This would typically come from ticket purchase data
    // For now, estimate based on purchase amounts
    const purchases = interactions.filter(i => i.interaction_type === "purchase");
    
    if (purchases.length === 0) return 1;

    // Simple heuristic: higher value purchases likely indicate group tickets
    const averagePurchase = purchases.reduce((sum, p) => sum + parseFloat(p.value || 0), 0) / purchases.length;
    
    if (averagePurchase > 200) return 3; // Likely group purchase
    if (averagePurchase > 100) return 2; // Likely couple
    return 1; // Individual
  }
}