/**
 * Recommendation Ranker
 * 
 * Combines user and item factors to generate personalized recommendation scores
 * and explanations for why events are recommended.
 */

import { SupabaseClient } from "@supabase/supabase-js";

interface RankingWeights {
  genreMatch: number;
  priceCompatibility: number;
  locationPreference: number;
  temporalAlignment: number;
  popularityBoost: number;
  trendingBonus: number;
  demographicFit: number;
  conversionProbability: number;
}

export class Ranker {
  private supabase: SupabaseClient;
  private weights: RankingWeights;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    
    // Initialize default ranking weights
    this.weights = {
      genreMatch: 0.25,        // 25% - Most important factor
      priceCompatibility: 0.20, // 20% - Price fit with user's budget
      locationPreference: 0.15, // 15% - Location preference
      temporalAlignment: 0.10,  // 10% - Day/time preferences
      popularityBoost: 0.10,    // 10% - Event popularity
      trendingBonus: 0.08,      // 8% - Trending events
      demographicFit: 0.07,     // 7% - Demographic alignment
      conversionProbability: 0.05, // 5% - Historical conversion rate
    };
  }

  /**
   * Calculate personalized recommendation score
   */
  async calculateRecommendationScore(
    userProfile: any,
    itemProfile: any,
    eventData: any
  ): Promise<number> {
    
    const scores = {
      genreMatch: this.calculateGenreMatch(userProfile, itemProfile),
      priceCompatibility: this.calculatePriceCompatibility(userProfile, itemProfile),
      locationPreference: this.calculateLocationPreference(userProfile, itemProfile),
      temporalAlignment: this.calculateTemporalAlignment(userProfile, itemProfile),
      popularityBoost: this.calculatePopularityScore(itemProfile),
      trendingBonus: this.calculateTrendingBonus(itemProfile),
      demographicFit: this.calculateDemographicFit(userProfile, itemProfile),
      conversionProbability: this.calculateConversionProbability(itemProfile),
    };

    // Calculate weighted average
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(scores).forEach(([factor, score]) => {
      const weight = this.weights[factor as keyof RankingWeights];
      totalScore += score * weight;
      totalWeight += weight;
    });

    // Apply contextual bonuses/penalties
    const contextualScore = this.applyContextualAdjustments(
      totalScore / totalWeight,
      userProfile,
      itemProfile,
      eventData
    );

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, contextualScore));
  }

  /**
   * Generate human-readable reasons for the recommendation
   */
  generateRecommendationReasons(
    userProfile: any,
    itemProfile: any,
    eventData: any
  ): string[] {
    const reasons = [];

    // Genre match
    const topGenre = userProfile.favoriteGenres[0];
    if (topGenre && topGenre.genre === itemProfile.genre) {
      reasons.push(`Você gosta de ${itemProfile.genre} (${Math.round(topGenre.score)} pontos de afinidade)`);
    }

    // Price compatibility
    const priceCompatibility = this.calculatePriceCompatibility(userProfile, itemProfile);
    if (priceCompatibility > 0.7) {
      reasons.push(`Preço alinhado com seu perfil (R$ ${itemProfile.ticketPriceRange.average.toFixed(0)})`);
    } else if (priceCompatibility < 0.3) {
      reasons.push(`Oportunidade premium - evento exclusivo`);
    }

    // Location preference
    if (userProfile.preferredCities.includes(itemProfile.city)) {
      reasons.push(`Em ${itemProfile.city}, uma de suas cidades favoritas`);
    }

    // Trending/popularity
    if (itemProfile.trendingScore > 70) {
      reasons.push(`Em alta - ${itemProfile.externalSignals.socialMentions} menções nas redes`);
    }

    if (itemProfile.popularityScore > 80) {
      reasons.push(`Evento popular com alta demanda`);
    }

    // Temporal alignment
    const userFavoriteDays = Object.entries(userProfile.dayOfWeekPreference)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([day]) => day);

    if (userFavoriteDays.includes(itemProfile.dayOfWeek)) {
      reasons.push(`${itemProfile.dayOfWeek} é um dos seus dias preferidos para eventos`);
    }

    // Stock urgency
    if (itemProfile.stockUrgency === "alta") {
      reasons.push(`Últimos ingressos disponíveis - garanta já!`);
    }

    // Similar events
    if (itemProfile.similarEvents.length > 0) {
      reasons.push(`Similar a outros eventos que você curtiu`);
    }

    // Venue preference
    if (userProfile.preferredVenues.includes(itemProfile.venue)) {
      reasons.push(`No ${itemProfile.venue}, um de seus locais favoritos`);
    }

    // Consumption pattern match
    if (userProfile.consumptionProfile.spendingPattern === itemProfile.demographicFit.priceSegment) {
      reasons.push(`Alinhado com seu perfil de consumo (${itemProfile.demographicFit.priceSegment})`);
    }

    // External signals
    if (itemProfile.externalSignals.isHoliday) {
      reasons.push(`Evento especial de feriado`);
    }

    // Return top 4 most relevant reasons
    return reasons.slice(0, 4);
  }

  /**
   * Individual scoring functions
   */
  private calculateGenreMatch(userProfile: any, itemProfile: any): number {
    const userGenres = userProfile.favoriteGenres || [];
    const eventGenre = itemProfile.genre;

    const genreMatch = userGenres.find((g: any) => g.genre === eventGenre);
    if (genreMatch) {
      // Normalize genre score (assuming max score is around 20)
      return Math.min(1, genreMatch.score / 20);
    }

    return 0.1; // Small base score for new genres
  }

  private calculatePriceCompatibility(userProfile: any, itemProfile: any): number {
    const userAvgPrice = userProfile.averageTicketPrice || 50;
    const userPriceRange = userProfile.priceRange || { min: 20, max: 200 };
    const eventAvgPrice = itemProfile.ticketPriceRange.average;

    // Perfect match if within user's typical range
    if (eventAvgPrice >= userPriceRange.min && eventAvgPrice <= userPriceRange.max) {
      return 1.0;
    }

    // Calculate distance from user's average price
    const priceDistance = Math.abs(eventAvgPrice - userAvgPrice) / userAvgPrice;
    
    // Exponential decay for price compatibility
    return Math.exp(-priceDistance);
  }

  private calculateLocationPreference(userProfile: any, itemProfile: any): number {
    const userCities = userProfile.preferredCities || [];
    const eventCity = itemProfile.city;

    if (userCities.includes(eventCity)) {
      return 1.0;
    }

    // Partial credit for same region (simplified)
    const sameRegionCities = this.getSameRegionCities(eventCity);
    const regionMatch = userCities.some((city: string) => sameRegionCities.includes(city));
    
    return regionMatch ? 0.6 : 0.3; // Base score for new cities
  }

  private calculateTemporalAlignment(userProfile: any, itemProfile: any): number {
    const userDayPrefs = userProfile.dayOfWeekPreference || {};
    const eventDay = itemProfile.dayOfWeek;

    const userDayScore = userDayPrefs[eventDay] || 0;
    const maxUserDayScore = Math.max(...Object.values(userDayPrefs));

    if (maxUserDayScore === 0) return 0.5; // Neutral if no data

    return userDayScore / maxUserDayScore;
  }

  private calculatePopularityScore(itemProfile: any): number {
    return Math.min(1, itemProfile.popularityScore / 100);
  }

  private calculateTrendingBonus(itemProfile: any): number {
    return Math.min(1, itemProfile.trendingScore / 100);
  }

  private calculateDemographicFit(userProfile: any, itemProfile: any): number {
    // This is a simplified calculation
    // In a real system, you'd have more detailed demographic data
    
    const userSpendingPattern = userProfile.consumptionProfile?.spendingPattern || "médio";
    const eventPriceSegment = itemProfile.demographicFit.priceSegment;

    if (userSpendingPattern === eventPriceSegment) {
      return 1.0;
    }

    // Partial compatibility between segments
    const compatibilityMatrix: { [key: string]: { [key: string]: number } } = {
      "econômico": { "médio": 0.7, "premium": 0.3 },
      "médio": { "econômico": 0.8, "premium": 0.8 },
      "premium": { "médio": 0.9, "econômico": 0.4 },
    };

    return compatibilityMatrix[userSpendingPattern]?.[eventPriceSegment] || 0.5;
  }

  private calculateConversionProbability(itemProfile: any): number {
    return Math.min(1, itemProfile.conversionRate * 10); // Scale up conversion rate
  }

  /**
   * Apply contextual adjustments
   */
  private applyContextualAdjustments(
    baseScore: number,
    userProfile: any,
    itemProfile: any,
    eventData: any
  ): number {
    let adjustedScore = baseScore;

    // Churn risk penalty
    if (userProfile.churnRisk === "alto") {
      adjustedScore *= 0.9; // Slightly lower scores for high churn risk users
    }

    // Time to event urgency
    if (itemProfile.timeToEvent < 7) {
      adjustedScore *= 1.1; // Boost events happening soon
    }

    // Stock urgency boost
    if (itemProfile.stockUrgency === "alta") {
      adjustedScore *= 1.15; // Strong boost for low stock events
    }

    // Competition penalty
    if (itemProfile.competitiveLandscape.competitionLevel === "alta") {
      adjustedScore *= 0.95; // Slight penalty for high competition
    }

    // New user bonus (encourage exploration)
    if (userProfile.totalEvents < 3) {
      adjustedScore *= 1.05; // Small boost for new users
    }

    // High-value user bonus
    if (userProfile.lifetimeValue > 1000) {
      adjustedScore *= 1.08; // Boost for valuable customers
    }

    // Frequency pattern adjustment
    if (userProfile.frequencyPattern === "alta" && itemProfile.timeToEvent > 30) {
      adjustedScore *= 1.1; // Frequent users get early recommendations
    }

    return adjustedScore;
  }

  /**
   * Helper functions
   */
  private getSameRegionCities(city: string): string[] {
    // Simplified region mapping - in a real system, this would be more comprehensive
    const regions: { [key: string]: string[] } = {
      "sudeste": ["São Paulo", "Rio de Janeiro", "Belo Horizonte"],
      "nordeste": ["Salvador", "Fortaleza", "Recife"],
      "sul": ["Porto Alegre", "Florianópolis", "Curitiba"],
      "centro-oeste": ["Brasília", "Goiânia"],
    };

    for (const [region, cities] of Object.entries(regions)) {
      if (cities.includes(city)) {
        return cities;
      }
    }

    return [city]; // Return just the city if no region found
  }

  /**
   * Update ranking weights based on performance feedback
   */
  updateWeights(performanceData: { [factor: string]: number }): void {
    // Simple learning mechanism - in production, you'd use more sophisticated methods
    Object.entries(performanceData).forEach(([factor, performance]) => {
      if (factor in this.weights) {
        const currentWeight = this.weights[factor as keyof RankingWeights];
        const adjustment = (performance - 0.5) * 0.01; // Small adjustments
        this.weights[factor as keyof RankingWeights] = Math.max(0.01, Math.min(0.5, currentWeight + adjustment));
      }
    });

    // Normalize weights to sum to 1
    const totalWeight = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(this.weights).forEach(factor => {
      this.weights[factor as keyof RankingWeights] /= totalWeight;
    });
  }

  /**
   * Get current ranking weights for monitoring
   */
  getWeights(): RankingWeights {
    return { ...this.weights };
  }
}