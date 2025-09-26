/**
 * Item Factors Analysis for Recommendation Engine
 * 
 * Analyzes event characteristics, popularity metrics, and contextual factors
 * to create detailed item profiles for matching with user preferences.
 */

import { SupabaseClient } from "@supabase/supabase-js";

interface ItemProfile {
  eventId: string;
  genre: string;
  artist: string;
  city: string;
  venue: string;
  venueType: string;
  capacity: number;
  date: string;
  dayOfWeek: string;
  timeToEvent: number; // days
  ticketPriceRange: { min: number; max: number; average: number };
  popularityScore: number;
  trendingScore: number;
  demographicFit: {
    ageGroups: string[];
    genderDistribution: { male: number; female: number; other: number };
    priceSegment: "econômico" | "médio" | "premium";
  };
  similarEvents: string[];
  conversionRate: number;
  competitiveLandscape: {
    sameGenreEvents: number;
    sameDateEvents: number;
    competitionLevel: "baixa" | "média" | "alta";
  };
  externalSignals: {
    weather: any;
    trends: number;
    socialMentions: number;
    isHoliday: boolean;
  };
  salesVelocity: number;
  stockUrgency: "baixa" | "média" | "alta";
}

export class ItemFactors {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Calculate comprehensive item profile for an event
   */
  async calculateItemProfile(eventId: string, eventData: any): Promise<ItemProfile> {
    // Get ticket types for price analysis
    const { data: ticketTypes } = await this.supabase
      .from("ticket_types")
      .select("*")
      .eq("event_id", eventId);

    // Get interaction history for this event
    const { data: interactions } = await this.supabase
      .from("interactions")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(100);

    // Get external signals
    const { data: signals } = await this.supabase
      .from("signals")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Calculate various factors
    const priceAnalysis = this.analyzePriceRange(ticketTypes || []);
    const popularityMetrics = await this.calculatePopularityMetrics(eventData, interactions || []);
    const demographicProfile = await this.analyzeDemographicFit(eventData, interactions || []);
    const competitionAnalysis = await this.analyzeCompetition(eventData);
    const salesMetrics = this.analyzeSalesMetrics(ticketTypes || [], interactions || []);

    const timeToEvent = Math.ceil((new Date(eventData.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      eventId,
      genre: eventData.genre,
      artist: eventData.artist,
      city: eventData.city,
      venue: eventData.venue,
      venueType: this.classifyVenueType(eventData.venue, eventData.capacity),
      capacity: eventData.capacity,
      date: eventData.date,
      dayOfWeek: eventData.day_of_week,
      timeToEvent,
      ticketPriceRange: priceAnalysis,
      popularityScore: popularityMetrics.popularityScore,
      trendingScore: popularityMetrics.trendingScore,
      demographicFit: demographicProfile,
      similarEvents: await this.findSimilarEvents(eventData),
      conversionRate: this.calculateConversionRate(interactions || []),
      competitiveLandscape: competitionAnalysis,
      externalSignals: {
        weather: signals,
        trends: eventData.google_trends_genre || 0,
        socialMentions: eventData.instagram_mentions || 0,
        isHoliday: eventData.is_holiday_brazil_hint === 1,
      },
      salesVelocity: salesMetrics.velocity,
      stockUrgency: salesMetrics.urgency,
    };
  }

  /**
   * Analyze ticket price range and segments
   */
  private analyzePriceRange(ticketTypes: any[]): { min: number; max: number; average: number } {
    if (ticketTypes.length === 0) {
      return { min: 0, max: 0, average: 0 };
    }

    const prices = ticketTypes.map(tt => parseFloat(tt.current_price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return { min, max, average };
  }

  /**
   * Calculate popularity and trending metrics
   */
  private async calculatePopularityMetrics(eventData: any, interactions: any[]): Promise<{
    popularityScore: number;
    trendingScore: number;
  }> {
    // Base popularity from interactions
    const viewCount = interactions.filter(i => i.interaction_type === "view").length;
    const clickCount = interactions.filter(i => i.interaction_type === "click").length;
    const purchaseCount = interactions.filter(i => i.interaction_type === "purchase").length;

    const interactionScore = (viewCount * 1) + (clickCount * 2) + (purchaseCount * 5);

    // Genre popularity (get average for genre)
    const { data: genreEvents } = await this.supabase
      .from("events")
      .select("instagram_mentions, google_trends_genre")
      .eq("genre", eventData.genre)
      .limit(50);

    const genreAvgSocial = genreEvents?.reduce((sum, e) => sum + (e.instagram_mentions || 0), 0) / (genreEvents?.length || 1) || 0;
    const genreAvgTrends = genreEvents?.reduce((sum, e) => sum + (e.google_trends_genre || 0), 0) / (genreEvents?.length || 1) || 0;

    // Normalize scores (0-100)
    const socialScore = Math.min(100, ((eventData.instagram_mentions || 0) / Math.max(1, genreAvgSocial)) * 50);
    const trendsScore = Math.min(100, ((eventData.google_trends_genre || 0) / Math.max(1, genreAvgTrends)) * 50);

    const popularityScore = Math.min(100, (interactionScore / 10) + (socialScore * 0.3) + (trendsScore * 0.2));
    const trendingScore = Math.min(100, trendsScore + (socialScore * 0.5));

    return {
      popularityScore: Math.round(popularityScore * 100) / 100,
      trendingScore: Math.round(trendingScore * 100) / 100,
    };
  }

  /**
   * Analyze demographic fit
   */
  private async analyzeDemographicFit(eventData: any, interactions: any[]): Promise<{
    ageGroups: string[];
    genderDistribution: { male: number; female: number; other: number };
    priceSegment: "econômico" | "médio" | "premium";
  }> {
    // Get customer demographics for this event
    const customerIds = interactions
      .filter(i => i.interaction_type === "purchase")
      .map(i => i.customer_id);

    let genderDistribution = { male: 0.5, female: 0.5, other: 0 };
    let ageGroups = ["25-34"];

    if (customerIds.length > 0) {
      const { data: customers } = await this.supabase
        .from("customers")
        .select("gender, birthdate")
        .in("id", customerIds);

      if (customers && customers.length > 0) {
        // Analyze gender distribution
        const genderCounts = { male: 0, female: 0, other: 0 };
        customers.forEach(c => {
          if (c.gender === "M") genderCounts.male++;
          else if (c.gender === "F") genderCounts.female++;
          else genderCounts.other++;
        });

        const total = customers.length;
        genderDistribution = {
          male: genderCounts.male / total,
          female: genderCounts.female / total,
          other: genderCounts.other / total,
        };

        // Analyze age groups
        const ageGroupCounts: { [key: string]: number } = {};
        customers.forEach(c => {
          if (c.birthdate) {
            const age = new Date().getFullYear() - new Date(c.birthdate).getFullYear();
            const ageGroup = this.getAgeGroup(age);
            ageGroupCounts[ageGroup] = (ageGroupCounts[ageGroup] || 0) + 1;
          }
        });

        ageGroups = Object.entries(ageGroupCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 2)
          .map(([group]) => group);
      }
    }

    // Determine price segment based on genre and average ticket price
    const averagePrice = (eventData.ticket_price || 0);
    let priceSegment: "econômico" | "médio" | "premium";

    if (averagePrice < 50) priceSegment = "econômico";
    else if (averagePrice < 150) priceSegment = "médio";
    else priceSegment = "premium";

    // Adjust based on genre expectations
    const premiumGenres = ["Rock", "Eletrônica", "Indie"];
    if (premiumGenres.includes(eventData.genre) && priceSegment === "econômico") {
      priceSegment = "médio";
    }

    return {
      ageGroups: ageGroups.length > 0 ? ageGroups : ["25-34"],
      genderDistribution,
      priceSegment,
    };
  }

  /**
   * Analyze competition in the same timeframe and location
   */
  private async analyzeCompetition(eventData: any): Promise<{
    sameGenreEvents: number;
    sameDateEvents: number;
    competitionLevel: "baixa" | "média" | "alta";
  }> {
    const eventDate = new Date(eventData.date);
    const weekStart = new Date(eventDate);
    weekStart.setDate(eventDate.getDate() - 3);
    const weekEnd = new Date(eventDate);
    weekEnd.setDate(eventDate.getDate() + 3);

    // Get competing events
    const { data: competingEvents } = await this.supabase
      .from("events")
      .select("*")
      .gte("date", weekStart.toISOString().split("T")[0])
      .lte("date", weekEnd.toISOString().split("T")[0])
      .neq("id", eventData.id);

    const sameGenreEvents = competingEvents?.filter(e => e.genre === eventData.genre).length || 0;
    const sameCityEvents = competingEvents?.filter(e => e.city === eventData.city).length || 0;
    const sameDateEvents = competingEvents?.filter(e => e.date === eventData.date).length || 0;

    // Determine competition level
    let competitionLevel: "baixa" | "média" | "alta";
    if (sameDateEvents > 2 || (sameGenreEvents > 3 && sameCityEvents > 2)) {
      competitionLevel = "alta";
    } else if (sameDateEvents > 0 || sameGenreEvents > 1) {
      competitionLevel = "média";
    } else {
      competitionLevel = "baixa";
    }

    return {
      sameGenreEvents,
      sameDateEvents,
      competitionLevel,
    };
  }

  /**
   * Calculate conversion rate from interactions
   */
  private calculateConversionRate(interactions: any[]): number {
    const views = interactions.filter(i => i.interaction_type === "view").length;
    const purchases = interactions.filter(i => i.interaction_type === "purchase").length;

    if (views === 0) return 0;
    return purchases / views;
  }

  /**
   * Find similar events based on genre, artist, and venue
   */
  private async findSimilarEvents(eventData: any): Promise<string[]> {
    const { data: similarEvents } = await this.supabase
      .from("events")
      .select("id")
      .or(`genre.eq.${eventData.genre},artist.ilike.%${eventData.artist}%,venue.eq.${eventData.venue}`)
      .neq("id", eventData.id)
      .limit(5);

    return similarEvents?.map(e => e.id) || [];
  }

  /**
   * Analyze sales metrics and stock urgency
   */
  private analyzeSalesMetrics(ticketTypes: any[], interactions: any[]): {
    velocity: number;
    urgency: "baixa" | "média" | "alta";
  } {
    if (ticketTypes.length === 0) {
      return { velocity: 0, urgency: "baixa" };
    }

    // Calculate sales velocity (sales per day)
    const purchases = interactions.filter(i => i.interaction_type === "purchase");
    const daysActive = Math.max(1, this.calculateDaysActive(interactions));
    const velocity = purchases.length / daysActive;

    // Calculate stock urgency
    const totalCapacity = ticketTypes.reduce((sum, tt) => sum + tt.capacity, 0);
    const totalAvailable = ticketTypes.reduce((sum, tt) => sum + tt.available, 0);
    const stockRatio = totalAvailable / totalCapacity;

    let urgency: "baixa" | "média" | "alta";
    if (stockRatio < 0.2) urgency = "alta";
    else if (stockRatio < 0.5) urgency = "média";
    else urgency = "baixa";

    return { velocity, urgency };
  }

  /**
   * Helper methods
   */
  private classifyVenueType(venue: string, capacity: number): string {
    const venueName = venue.toLowerCase();

    if (venueName.includes("arena") || venueName.includes("estádio")) return "arena";
    if (venueName.includes("teatro") || venueName.includes("auditório")) return "teatro";
    if (venueName.includes("club") || venueName.includes("house")) return "casa_noturna";
    if (venueName.includes("hall") || venueName.includes("centro")) return "centro_eventos";
    if (capacity > 20000) return "estádio";
    if (capacity > 5000) return "arena";
    if (capacity > 1000) return "teatro";
    return "casa_noturna";
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return "menor_18";
    if (age < 25) return "18-24";
    if (age < 35) return "25-34";
    if (age < 45) return "35-44";
    if (age < 55) return "45-54";
    return "55+";
  }

  private calculateDaysActive(interactions: any[]): number {
    if (interactions.length === 0) return 1;

    const dates = interactions.map(i => new Date(i.created_at).getTime());
    const earliest = Math.min(...dates);
    const latest = Math.max(...dates);

    return Math.max(1, (latest - earliest) / (1000 * 60 * 60 * 24));
  }
}