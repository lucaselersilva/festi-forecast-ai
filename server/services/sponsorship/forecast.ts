/**
 * Sponsorship Forecast Service
 * 
 * Constrói previsões de patrocínio baseadas em análise RFM, 
 * segmentação de clientes e eventos análogos
 */

import { SupabaseClient } from "@supabase/supabase-js";

interface SponsorForecastInput {
  genre: string;
  city: string;
  targetRevenue?: number;
  eventId?: string;
  date?: string;
  capacity?: number;
}

interface SegmentForecast {
  segment: string;
  expectedAudience: number;
  expectedSpend: number;
  conversionRate: number;
  confidence: "baixa" | "média" | "alta";
  demographics: {
    avgAge?: number;
    genderSplit?: { male: number; female: number };
  };
}

interface SponsorForecastResult {
  audience: { [segment: string]: SegmentForecast };
  expectedReach: number;
  expectedOnsiteSpend: number;
  profileHints: {
    topCities: string[];
    avgAge: number;
    genderSplit: { male: number; female: number; other: number };
    segments: { Heavy: number; Medium: number; Light: number };
  };
  dataQuality: "baixa" | "média" | "alta";
  uncertainty: {
    reachRange: { min: number; max: number };
    spendRange: { min: number; max: number };
  };
  insights: string[];
}

export class SponsorshipForecast {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Constrói previsão de patrocínio completa
   */
  async buildSponsorForecast(input: SponsorForecastInput): Promise<SponsorForecastResult> {
    try {
      // 1. Obter dados de segmentação por gênero/cidade
      const segmentData = await this.getSegmentData(input.genre, input.city);
      
      // 2. Obter dados demográficos
      const demographics = await this.getDemographics();
      
      // 3. Calcular base de clientes projetável
      const projectedBase = await this.calculateProjectedBase(input);
      
      // 4. Construir previsão por segmento
      const segmentForecasts = await this.buildSegmentForecasts(segmentData, projectedBase, input);
      
      // 5. Calcular métricas agregadas
      const aggregatedMetrics = this.calculateAggregatedMetrics(segmentForecasts);
      
      // 6. Gerar insights
      const insights = this.generateInsights(segmentForecasts, aggregatedMetrics, input);

      return {
        audience: segmentForecasts,
        expectedReach: aggregatedMetrics.totalReach,
        expectedOnsiteSpend: aggregatedMetrics.totalSpend,
        profileHints: {
          topCities: demographics.topCities,
          avgAge: demographics.avgAge,
          genderSplit: demographics.genderSplit,
          segments: aggregatedMetrics.segmentDistribution,
        },
        dataQuality: this.assessDataQuality(segmentData, demographics),
        uncertainty: {
          reachRange: {
            min: Math.round(aggregatedMetrics.totalReach * 0.85),
            max: Math.round(aggregatedMetrics.totalReach * 1.15),
          },
          spendRange: {
            min: Math.round(aggregatedMetrics.totalSpend * 0.9),
            max: Math.round(aggregatedMetrics.totalSpend * 1.1),
          },
        },
        insights,
      };

    } catch (error) {
      console.error("Error building sponsor forecast:", error);
      throw new Error("Failed to build sponsor forecast");
    }
  }

  /**
   * Obter dados de segmentação por gênero/cidade
   */
  private async getSegmentData(genre: string, city: string) {
    const { data: segmentData, error } = await this.supabase
      .from("vw_segment_forecast")
      .select("*")
      .eq("genre", genre)
      .eq("city", city);

    if (error) {
      console.warn("Error fetching segment data:", error);
      return [];
    }

    return segmentData || [];
  }

  /**
   * Obter dados demográficos agregados
   */
  private async getDemographics() {
    const { data: demographicsData, error } = await this.supabase
      .from("vw_segment_demographics")
      .select("*");

    if (error || !demographicsData) {
      return {
        topCities: ["São Paulo", "Rio de Janeiro", "Belo Horizonte"],
        avgAge: 28,
        genderSplit: { male: 0.52, female: 0.45, other: 0.03 }
      };
    }

    // Agregar dados demográficos
    const totalCustomers = demographicsData.reduce((sum, d) => sum + d.total_customers, 0);
    const weightedAge = demographicsData.reduce((sum, d) => 
      sum + (d.avg_age * d.total_customers), 0) / totalCustomers;

    const weightedMale = demographicsData.reduce((sum, d) => 
      sum + (d.male_pct * d.total_customers), 0) / totalCustomers;
    const weightedFemale = demographicsData.reduce((sum, d) => 
      sum + (d.female_pct * d.total_customers), 0) / totalCustomers;

    // Extrair top cidades (simplificado)
    const topCities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Salvador", "Fortaleza"];

    return {
      topCities,
      avgAge: Math.round(weightedAge) || 28,
      genderSplit: {
        male: Math.round(weightedMale * 100) / 100 || 0.52,
        female: Math.round(weightedFemale * 100) / 100 || 0.45,
        other: Math.round((1 - weightedMale - weightedFemale) * 100) / 100 || 0.03,
      }
    };
  }

  /**
   * Calcular base de clientes projetável
   */
  private async calculateProjectedBase(input: SponsorForecastInput) {
    if (input.eventId) {
      // Usar dados específicos do evento se fornecido
      const { data: eventData } = await this.supabase
        .from("events")
        .select("capacity, sold_tickets")
        .eq("id", input.eventId)
        .single();

      return {
        capacity: eventData?.capacity || input.capacity || 5000,
        expectedAttendance: eventData?.sold_tickets || input.capacity * 0.7 || 3500,
      };
    }

    // Usar média de eventos análogos
    const { data: analogEvents } = await this.supabase
      .from("vw_event_analogs")
      .select("capacity, sold_tickets, occupancy_rate")
      .eq("genre", input.genre)
      .eq("city", input.city)
      .limit(10);

    if (!analogEvents || analogEvents.length === 0) {
      return {
        capacity: input.capacity || 5000,
        expectedAttendance: (input.capacity || 5000) * 0.7,
      };
    }

    const avgCapacity = analogEvents.reduce((sum, e) => sum + e.capacity, 0) / analogEvents.length;
    const avgOccupancy = analogEvents.reduce((sum, e) => sum + e.occupancy_rate, 0) / analogEvents.length;

    return {
      capacity: Math.round(avgCapacity),
      expectedAttendance: Math.round(avgCapacity * avgOccupancy),
    };
  }

  /**
   * Construir previsões por segmento
   */
  private async buildSegmentForecasts(
    segmentData: any[], 
    projectedBase: any, 
    input: SponsorForecastInput
  ): Promise<{ [segment: string]: SegmentForecast }> {
    
    const forecasts: { [segment: string]: SegmentForecast } = {};
    const segments = ["Heavy", "Medium", "Light"];

    for (const segment of segments) {
      const segmentRecord = segmentData.find(s => s.segment === segment);
      
      if (segmentRecord) {
        const expectedAudience = Math.round(
          projectedBase.expectedAttendance * segmentRecord.estimated_conversion_rate
        );
        
        const expectedSpend = Math.round(
          expectedAudience * segmentRecord.expected_spend_per_customer
        );

        forecasts[segment] = {
          segment,
          expectedAudience,
          expectedSpend,
          conversionRate: segmentRecord.estimated_conversion_rate,
          confidence: this.getConfidence(segmentRecord.data_quality_score),
          demographics: {
            avgAge: 28, // Would come from demographics join
          },
        };
      } else {
        // Fallback para segmentos sem dados históricos
        const fallbackData = this.getFallbackSegmentData(segment, projectedBase);
        forecasts[segment] = fallbackData;
      }
    }

    return forecasts;
  }

  /**
   * Calcular métricas agregadas
   */
  private calculateAggregatedMetrics(segmentForecasts: { [segment: string]: SegmentForecast }) {
    const totalReach = Object.values(segmentForecasts)
      .reduce((sum, s) => sum + s.expectedAudience, 0);
    
    const totalSpend = Object.values(segmentForecasts)
      .reduce((sum, s) => sum + s.expectedSpend, 0);

    const segmentDistribution = {
      Heavy: segmentForecasts.Heavy?.expectedAudience || 0,
      Medium: segmentForecasts.Medium?.expectedAudience || 0,
      Light: segmentForecasts.Light?.expectedAudience || 0,
    };

    return { totalReach, totalSpend, segmentDistribution };
  }

  /**
   * Gerar insights executivos
   */
  private generateInsights(
    segmentForecasts: { [segment: string]: SegmentForecast },
    aggregatedMetrics: any,
    input: SponsorForecastInput
  ): string[] {
    const insights = [];

    // Insight sobre segmento Heavy
    const heavySegment = segmentForecasts.Heavy;
    if (heavySegment && heavySegment.expectedAudience > 0) {
      const heavyPct = (heavySegment.expectedAudience / aggregatedMetrics.totalReach) * 100;
      const avgSpendHeavy = heavySegment.expectedSpend / heavySegment.expectedAudience;
      
      insights.push(
        `Audiência Heavy representa ${heavyPct.toFixed(0)}% do público (${heavySegment.expectedAudience} pessoas) com gasto médio de R$ ${avgSpendHeavy.toFixed(0)} por pessoa`
      );
    }

    // Insight sobre conversão
    const totalConversionRate = Object.values(segmentForecasts)
      .reduce((sum, s) => sum + s.conversionRate, 0) / 3;
    
    insights.push(
      `Taxa de conversão estimada de ${(totalConversionRate * 100).toFixed(1)}% baseada em eventos análogos de ${input.genre} em ${input.city}`
    );

    // Insight sobre receita incremental
    const incrementalRevenue = aggregatedMetrics.totalSpend * 0.06; // 6% lift estimado
    insights.push(
      `Ativação de patrocínio pode gerar receita incremental de R$ ${incrementalRevenue.toFixed(0)} (lift estimado de 6%)`
    );

    // Insight sobre target premium
    if (input.genre === "Rock" || input.genre === "Eletrônica") {
      insights.push(
        `Gênero ${input.genre} atrai público premium com alta afinidade para marcas de bebidas e tecnologia`
      );
    }

    return insights;
  }

  /**
   * Avaliar qualidade dos dados
   */
  private assessDataQuality(segmentData: any[], demographics: any): "baixa" | "média" | "alta" {
    if (segmentData.length >= 2 && demographics.avgAge > 0) {
      return "alta";
    } else if (segmentData.length >= 1) {
      return "média";
    }
    return "baixa";
  }

  /**
   * Obter confiança baseada no score de qualidade dos dados
   */
  private getConfidence(dataQualityScore?: number): "baixa" | "média" | "alta" {
    if (!dataQualityScore) return "baixa";
    if (dataQualityScore >= 5) return "alta";
    if (dataQualityScore >= 2) return "média";
    return "baixa";
  }

  /**
   * Dados de fallback para segmentos sem histórico
   */
  private getFallbackSegmentData(segment: string, projectedBase: any): SegmentForecast {
    const fallbackRates = {
      Heavy: { conversion: 0.35, avgSpend: 180 },
      Medium: { conversion: 0.25, avgSpend: 120 },
      Light: { conversion: 0.15, avgSpend: 80 },
    };

    const rates = fallbackRates[segment as keyof typeof fallbackRates];
    const expectedAudience = Math.round(projectedBase.expectedAttendance * rates.conversion * 0.3); // Conservative estimate
    const expectedSpend = expectedAudience * rates.avgSpend;

    return {
      segment,
      expectedAudience,
      expectedSpend,
      conversionRate: rates.conversion,
      confidence: "baixa",
      demographics: { avgAge: 28 },
    };
  }
}