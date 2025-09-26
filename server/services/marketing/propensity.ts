/**
 * Propensity Scoring Model for Marketing
 * 
 * Implements a logistic regression-style model for calculating customer
 * propensity to purchase tickets, with RFM analysis and behavioral scoring.
 */

import { SupabaseClient } from "@supabase/supabase-js";

interface PropensityFeatures {
  recency: number;      // Days since last purchase
  frequency: number;    // Number of purchases in last 12 months
  monetary: number;     // Total spent in last 12 months
  genreAffinity: number; // Affinity score for event genre
  priceToleranceMatch: number; // How well event price matches user's tolerance
  locationPreference: number;  // Preference for event location
  timePreference: number;      // Preference for event timing
  socialSignals: number;       // External social media signals
  seasonality: number;         // Seasonal purchase behavior match
  competitionImpact: number;   // Impact of competing events
}

interface PropensityResult {
  score: number;           // 0-1 propensity score
  segment: string;         // Customer segment
  features: PropensityFeatures;
  predictedLTV: number;    // Predicted lifetime value
  confidence: "baixa" | "média" | "alta";
  recommendations: string[];
}

export class PropensityModel {
  private supabase: SupabaseClient;
  
  // Model coefficients (would be learned from historical data)
  private coefficients = {
    recency: -0.15,        // More recent = higher propensity
    frequency: 0.25,       // More frequent = higher propensity
    monetary: 0.20,        // Higher spend = higher propensity
    genreAffinity: 0.30,   // Genre match = higher propensity
    priceToleranceMatch: 0.18,
    locationPreference: 0.12,
    timePreference: 0.08,
    socialSignals: 0.10,
    seasonality: 0.15,
    competitionImpact: -0.08,
    intercept: -1.2,       // Base intercept
  };

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Calculate propensity score for a customer
   */
  async calculatePropensity(
    customer: any,
    interactions: any[],
    consumptions: any[],
    eventData?: any
  ): Promise<PropensityResult> {
    
    // Extract features
    const features = await this.extractFeatures(customer, interactions, consumptions, eventData);
    
    // Calculate propensity score using logistic regression
    const logitScore = this.calculateLogitScore(features);
    const propensityScore = this.sigmoid(logitScore);
    
    // Determine segment
    const segment = this.determineSegment(propensityScore, features);
    
    // Calculate predicted LTV
    const predictedLTV = this.calculatePredictedLTV(features, propensityScore);
    
    // Determine confidence level
    const confidence = this.calculateConfidence(interactions, consumptions);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(propensityScore, features, segment);

    return {
      score: propensityScore,
      segment,
      features,
      predictedLTV,
      confidence,
      recommendations,
    };
  }

  /**
   * Extract features for propensity calculation
   */
  private async extractFeatures(
    customer: any,
    interactions: any[],
    consumptions: any[],
    eventData?: any
  ): Promise<PropensityFeatures> {
    
    // RFM Analysis
    const rfmAnalysis = this.calculateRFM(interactions, consumptions);
    
    // Genre affinity
    const genreAffinity = eventData ? 
      await this.calculateGenreAffinity(customer.id, eventData.genre) : 0.5;
    
    // Price tolerance match
    const priceToleranceMatch = eventData ? 
      this.calculatePriceToleranceMatch(interactions, eventData) : 0.5;
    
    // Location preference
    const locationPreference = eventData ? 
      this.calculateLocationPreference(interactions, eventData.city) : 0.5;
    
    // Time preference
    const timePreference = eventData ? 
      this.calculateTimePreference(interactions, eventData) : 0.5;
    
    // Social signals
    const socialSignals = eventData ? 
      this.calculateSocialSignals(eventData) : 0.5;
    
    // Seasonality
    const seasonality = this.calculateSeasonality(interactions, eventData);
    
    // Competition impact
    const competitionImpact = eventData ? 
      await this.calculateCompetitionImpact(eventData) : 0;

    return {
      recency: rfmAnalysis.recency,
      frequency: rfmAnalysis.frequency,
      monetary: rfmAnalysis.monetary,
      genreAffinity,
      priceToleranceMatch,
      locationPreference,
      timePreference,
      socialSignals,
      seasonality,
      competitionImpact,
    };
  }

  /**
   * Calculate RFM (Recency, Frequency, Monetary) metrics
   */
  private calculateRFM(interactions: any[], consumptions: any[]): {
    recency: number;
    frequency: number;
    monetary: number;
  } {
    
    const purchases = interactions.filter(i => i.interaction_type === "purchase");
    
    // Recency (normalized to 0-1, where 0 = very recent, 1 = very old)
    let recency = 1.0; // Default for no purchases
    if (purchases.length > 0) {
      const lastPurchaseDate = new Date(purchases[0].created_at);
      const daysSinceLastPurchase = (Date.now() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24);
      recency = Math.min(1, daysSinceLastPurchase / 365); // Normalize to max 1 year
    }

    // Frequency (purchases in last 12 months, normalized)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const recentPurchases = purchases.filter(p => 
      new Date(p.created_at) >= oneYearAgo
    );
    const frequency = Math.min(1, recentPurchases.length / 12); // Normalize to max 1 per month

    // Monetary (total spent in last 12 months, normalized)
    const ticketSpend = recentPurchases.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
    const barSpend = consumptions
      .filter(c => new Date(c.timestamp) >= oneYearAgo)
      .reduce((sum, c) => sum + (parseFloat(c.totalvalue) || 0), 0);
    
    const totalSpend = ticketSpend + barSpend;
    const monetary = Math.min(1, totalSpend / 2000); // Normalize to max R$2000

    return { recency, frequency, monetary };
  }

  /**
   * Calculate genre affinity
   */
  private async calculateGenreAffinity(customerId: string, eventGenre: string): Promise<number> {
    const { data: customerInteractions } = await this.supabase
      .from("interactions")
      .select("*, events(genre)")
      .eq("customer_id", customerId)
      .eq("interaction_type", "purchase")
      .limit(20);

    if (!customerInteractions || customerInteractions.length === 0) {
      return 0.5; // Neutral for new customers
    }

    const genreCount = customerInteractions.filter(i => 
      i.events?.genre === eventGenre
    ).length;

    return Math.min(1, genreCount / customerInteractions.length * 2); // Boost genre match
  }

  /**
   * Calculate price tolerance match
   */
  private calculatePriceToleranceMatch(interactions: any[], eventData: any): number {
    const purchases = interactions.filter(i => i.interaction_type === "purchase" && i.value > 0);
    
    if (purchases.length === 0) return 0.5;

    const averageUserSpend = purchases.reduce((sum, p) => sum + parseFloat(p.value), 0) / purchases.length;
    const eventPrice = eventData.ticket_price || 100;

    // Calculate how close event price is to user's average spend
    const priceRatio = Math.min(eventPrice, averageUserSpend) / Math.max(eventPrice, averageUserSpend);
    
    return priceRatio; // 1.0 = perfect match, lower = worse match
  }

  /**
   * Calculate location preference
   */
  private calculateLocationPreference(interactions: any[], eventCity: string): number {
    const eventInteractions = interactions.filter(i => i.events?.city);
    
    if (eventInteractions.length === 0) return 0.5;

    const cityCount = eventInteractions.filter(i => i.events.city === eventCity).length;
    return Math.min(1, cityCount / eventInteractions.length * 2); // Boost city match
  }

  /**
   * Calculate time preference (day of week, season)
   */
  private calculateTimePreference(interactions: any[], eventData: any): number {
    const eventDate = new Date(eventData.date);
    const eventDay = eventDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const eventMonth = eventDate.getMonth();

    const userInteractionsByDay: { [key: string]: number } = {};
    const userInteractionsByMonth: { [key: number]: number } = {};

    interactions.forEach(i => {
      const interactionDate = new Date(i.created_at);
      const day = interactionDate.toLocaleDateString('pt-BR', { weekday: 'long' });
      const month = interactionDate.getMonth();

      userInteractionsByDay[day] = (userInteractionsByDay[day] || 0) + 1;
      userInteractionsByMonth[month] = (userInteractionsByMonth[month] || 0) + 1;
    });

    const totalInteractions = interactions.length;
    if (totalInteractions === 0) return 0.5;

    const dayPreference = (userInteractionsByDay[eventDay] || 0) / totalInteractions;
    const monthPreference = (userInteractionsByMonth[eventMonth] || 0) / totalInteractions;

    return (dayPreference + monthPreference) / 2;
  }

  /**
   * Calculate social signals impact
   */
  private calculateSocialSignals(eventData: any): number {
    const trendsScore = (eventData.google_trends_genre || 50) / 100;
    const socialScore = Math.min(1, (eventData.instagram_mentions || 0) / 500);
    
    return (trendsScore + socialScore) / 2;
  }

  /**
   * Calculate seasonality match
   */
  private calculateSeasonality(interactions: any[], eventData?: any): number {
    if (!eventData) return 0.5;

    const eventMonth = new Date(eventData.date).getMonth();
    const userMonthlyActivity: { [key: number]: number } = {};

    interactions.forEach(i => {
      const month = new Date(i.created_at).getMonth();
      userMonthlyActivity[month] = (userMonthlyActivity[month] || 0) + 1;
    });

    const totalActivity = interactions.length;
    if (totalActivity === 0) return 0.5;

    const eventMonthActivity = (userMonthlyActivity[eventMonth] || 0) / totalActivity;
    return Math.min(1, eventMonthActivity * 12); // Amplify seasonal preferences
  }

  /**
   * Calculate competition impact
   */
  private async calculateCompetitionImpact(eventData: any): Promise<number> {
    const eventDate = new Date(eventData.date);
    const weekStart = new Date(eventDate);
    weekStart.setDate(eventDate.getDate() - 3);
    const weekEnd = new Date(eventDate);
    weekEnd.setDate(eventDate.getDate() + 3);

    const { data: competingEvents } = await this.supabase
      .from("events")
      .select("id")
      .gte("date", weekStart.toISOString().split("T")[0])
      .lte("date", weekEnd.toISOString().split("T")[0])
      .eq("city", eventData.city)
      .neq("id", eventData.id);

    const competitionCount = competingEvents?.length || 0;
    return Math.min(1, competitionCount / 5); // Normalize to max 5 competing events
  }

  /**
   * Calculate logistic score
   */
  private calculateLogitScore(features: PropensityFeatures): number {
    let score = this.coefficients.intercept;
    
    score += features.recency * this.coefficients.recency;
    score += features.frequency * this.coefficients.frequency;
    score += features.monetary * this.coefficients.monetary;
    score += features.genreAffinity * this.coefficients.genreAffinity;
    score += features.priceToleranceMatch * this.coefficients.priceToleranceMatch;
    score += features.locationPreference * this.coefficients.locationPreference;
    score += features.timePreference * this.coefficients.timePreference;
    score += features.socialSignals * this.coefficients.socialSignals;
    score += features.seasonality * this.coefficients.seasonality;
    score += features.competitionImpact * this.coefficients.competitionImpact;

    return score;
  }

  /**
   * Sigmoid function to convert logit to probability
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Determine customer segment
   */
  private determineSegment(propensityScore: number, features: PropensityFeatures): string {
    if (propensityScore >= 0.7) {
      return features.monetary > 0.6 ? "alta_propensao_premium" : "alta_propensao";
    } else if (propensityScore >= 0.4) {
      return features.frequency > 0.5 ? "media_propensao_frequente" : "media_propensao";
    } else {
      return features.recency < 0.3 ? "baixa_propensao_recente" : "baixa_propensao";
    }
  }

  /**
   * Calculate predicted lifetime value
   */
  private calculatePredictedLTV(features: PropensityFeatures, propensityScore: number): number {
    // Simple LTV model: (frequency * monetary * propensity) * time_factor
    const baseLTV = features.frequency * features.monetary * 2000; // Scale by max monetary
    const propensityMultiplier = 1 + (propensityScore * 0.5); // Boost by propensity
    const loyaltyBonus = features.frequency > 0.7 ? 1.2 : 1.0; // Loyalty bonus

    return Math.round(baseLTV * propensityMultiplier * loyaltyBonus);
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(interactions: any[], consumptions: any[]): "baixa" | "média" | "alta" {
    const totalDataPoints = interactions.length + consumptions.length;
    
    if (totalDataPoints >= 20) return "alta";
    if (totalDataPoints >= 8) return "média";
    return "baixa";
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    propensityScore: number, 
    features: PropensityFeatures, 
    segment: string
  ): string[] {
    const recommendations = [];

    if (propensityScore >= 0.7) {
      recommendations.push("Cliente com alta propensão - priorize em campanhas premium");
      recommendations.push("Ofereça experiências VIP ou early access");
    } else if (propensityScore >= 0.4) {
      recommendations.push("Propensão moderada - use incentivos personalizados");
      if (features.genreAffinity > 0.6) {
        recommendations.push("Foque em eventos do gênero preferido do cliente");
      }
    } else {
      recommendations.push("Baixa propensão - considere campanhas de reativação");
      if (features.recency < 0.2) {
        recommendations.push("Cliente recente - trabalhe fidelização");
      }
    }

    if (features.priceToleranceMatch < 0.4) {
      recommendations.push("Considere desconto ou promoção para ajustar ao perfil de preço");
    }

    if (features.locationPreference > 0.7) {
      recommendations.push("Forte preferência de localização - destaque a venue");
    }

    if (features.frequency > 0.6) {
      recommendations.push("Cliente frequente - ofereça programa de fidelidade");
    }

    return recommendations.slice(0, 4); // Return top 4 recommendations
  }

  /**
   * Update model coefficients based on feedback
   */
  updateModel(trainingData: { features: PropensityFeatures; actualPurchase: boolean }[]): void {
    // This is a simplified update mechanism
    // In production, you'd use proper gradient descent or other optimization methods
    
    const learningRate = 0.01;
    
    trainingData.forEach(data => {
      const predicted = this.sigmoid(this.calculateLogitScore(data.features));
      const error = (data.actualPurchase ? 1 : 0) - predicted;
      
      // Update coefficients (simplified gradient descent)
      this.coefficients.recency += learningRate * error * data.features.recency;
      this.coefficients.frequency += learningRate * error * data.features.frequency;
      this.coefficients.monetary += learningRate * error * data.features.monetary;
      // ... update other coefficients similarly
    });
  }

  /**
   * Get model performance metrics
   */
  getModelStats(): any {
    return {
      coefficients: { ...this.coefficients },
      version: "1.0",
      lastUpdated: new Date().toISOString(),
    };
  }
}