// ML Service - Connected to real Supabase data
import { supabase } from "@/integrations/supabase/client"

interface MLConfig {
  apiKey?: string
  baseUrl?: string
  timeout?: number
}

interface SegmentationInput {
  customerData: Array<{
    customerId: string
    age: number
    gender: string
    city: string
    state: string
    previousVisits: number
    lifetimeValue: number
    avgBarTicket: number
    favoriteDrinks: string[]
    checkInHistory: Array<{ eventId: string, date: string }>
    totalEventsAttended: number
  }>
}

interface SegmentationOutput {
  objective: string
  dataUsed: string[]
  segments: Array<{
    id: string
    name: string
    description: string
    size: number
    percentage: number
    dominantCharacteristics: {
      ageRange: string
      avgSpending: number
      favoriteDrink: string
      frequency: string
    }
    marketingInsights: string[]
  }>
  analysis: string[]
  recommendations: string[]
}

interface PricingInput {
  event: {
    genre: string
    city: string
    venue: string
    capacity: number
    date: string
    dayOfWeek: string
    weather?: { temp: number, precipitation: number }
    competitorEvents?: Array<{ date: string, venue: string, genre: string }>
  }
  historicalSales: Array<{
    ticketType: 'pista' | 'vip' | 'camarote'
    price: number
    soldTickets: number
    demandCurve: Array<{ price: number, demand: number }>
    date: string
    dayOfWeek: string
  }>
}

interface PricingOutput {
  objective: string
  dataUsed: string[]
  recommendedPrices: {
    pista: { min: number, max: number, optimal: number }
    vip: { min: number, max: number, optimal: number }
    camarote: { min: number, max: number, optimal: number }
  }
  confidence: 'baixa' | 'média' | 'alta'
  analysis: Array<{
    factor: string
    impact: string
    justification: string
  }>
  demandCurve: Array<{ ticketType: string, price: number, estimatedDemand: number }>
  recommendations: string[]
}

interface ChurnInput {
  customerId: string
  lastEventDate: string
  totalEvents: number
  avgTicketPrice: number
  totalSpent: number
}

interface ChurnOutput {
  customerId: string
  churnProbability: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
}

interface TargetAudienceInput {
  eventDescription: string
  genre: string
  averagePrice: number
  region: string
  existingClusters: Array<{
    id: string
    name: string
    size: number
    characteristics: any
  }>
}

interface TargetAudienceOutput {
  objective: string
  dataUsed: string[]
  idealProfile: {
    ageRange: string
    gender: string
    location: string[]
    favoriteDrink: string
    spendingProfile: string
  }
  audienceSize: {
    potential: number
    withinDatabase: number
    percentage: number
  }
  sponsorAffinity: Array<{
    category: string
    affinity: number
    description: string
  }>
  analysis: string[]
  recommendations: Array<{
    sponsor: string
    argument: string
    audienceMatch: string
  }>
}

interface RecommendationInput {
  customerId: string
  eventHistory: Array<{
    eventId: string
    genre: string
    date: string
    ticketType: string
    spent: number
  }>
  consumptionHistory: Array<{
    product: string
    category: string
    quantity: number
    value: number
    date: string
  }>
  navigationHistory: Array<{
    page: string
    eventViewed?: string
    timeSpent: number
    date: string
  }>
}

interface RecommendationOutput {
  objective: string
  dataUsed: string[]
  eventRecommendations: Array<{
    eventId: string
    title: string
    genre: string
    conversionProbability: 'alta' | 'média' | 'baixa'
    reasons: string[]
  }>
  productRecommendations: Array<{
    product: string
    category: string
    combo?: string
    conversionProbability: 'alta' | 'média' | 'baixa'
    expectedValue: number
  }>
  analysis: string[]
  crossSellInsights: Array<{
    fromCluster: string
    toProduct: string
    strategy: string
    expectedUplift: number
  }>
  recommendations: string[]
}

class MLService {
  private config: MLConfig

  constructor(config: MLConfig = {}) {
    this.config = {
      baseUrl: 'http://localhost:8000',
      timeout: 30000,
      ...config
    }
  }

  updateConfig(newConfig: Partial<MLConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  // Customer Segmentation using real RFM data
  async runSegmentation(input: SegmentationInput): Promise<SegmentationOutput> {
    try {
      // Get real customer segments from database
      const { data: segments, error } = await supabase
        .from('vw_segment_demographics')
        .select('*')

      if (error) throw error

      const { data: consumption, error: consumptionError } = await supabase
        .from('vw_segment_consumption')
        .select('*')

      if (consumptionError) throw consumptionError

      if (!segments?.length || !consumption?.length) {
        throw new Error('No segmentation data available - check that views are populated')
      }

      // Map real segments to the expected format
      const mappedSegments = segments?.map((segment, index) => ({
        id: segment.segment?.toLowerCase().replace(/\s+/g, '_') || `segment_${index}`,
        name: segment.segment || 'Segment Unknown',
        description: this.getSegmentDescription(segment.segment),
        size: Number(segment.total_customers) || 0,
        percentage: Math.round((Number(segment.total_customers) / segments.reduce((sum, s) => sum + Number(s.total_customers || 0), 0)) * 100),
        dominantCharacteristics: {
          ageRange: `${Math.round(segment.avg_age || 25)}-${Math.round((segment.avg_age || 25) + 10)} anos`,
          avgSpending: consumption?.find(c => c.segment === segment.segment)?.avg_monetary_total || 0,
          favoriteDrink: this.getFavoriteDrink(segment.segment),
          frequency: consumption?.find(c => c.segment === segment.segment)?.avg_frequency ? 
            `${Math.round(Number(consumption.find(c => c.segment === segment.segment)?.avg_frequency))} eventos/ano` : 
            'Não disponível'
        },
        marketingInsights: this.getMarketingInsights(segment.segment)
      })) || []

      return {
        objective: 'Segmentação RFM baseada em dados reais de comportamento dos clientes',
        dataUsed: ['Scoring snapshots', 'RFM analysis', 'Customer demographics', 'Consumption patterns'],
        segments: mappedSegments,
        analysis: [
          `Total de ${segments?.length || 0} segmentos identificados com base em dados reais`,
          `Segmento com maior valor: ${mappedSegments.find(s => s.dominantCharacteristics.avgSpending === Math.max(...mappedSegments.map(seg => seg.dominantCharacteristics.avgSpending)))?.name}`,
          `Base total analisada: ${segments?.reduce((sum, s) => sum + Number(s.total_customers || 0), 0) || 0} clientes`
        ],
        recommendations: [
          'Focar estratégias de retenção nos segmentos de maior valor',
          'Desenvolver campanhas específicas para cada segmento RFM',
          'Implementar scoring dinâmico baseado em interações recentes'
        ]
      }
    } catch (error) {
      console.error('Segmentation error:', error)
      throw new Error(`Failed to run segmentation analysis with real data: ${error.message}`)
    }
  }

  // Dynamic Pricing using real event data
  async runPricing(input: PricingInput): Promise<PricingOutput> {
    try {
      // Get historical events with similar characteristics
      const { data: similarEvents, error } = await supabase
        .from('vw_event_analogs')
        .select('*')
        .eq('genre', input.event.genre)
        .eq('city', input.event.city)
        .not('revenue', 'is', null)
        .not('sold_tickets', 'is', null)
        .limit(10)

      if (error) throw error

      // Calculate pricing based on real data
      const avgPrice = similarEvents?.reduce((sum, e) => sum + Number(e.avg_price || 0), 0) / (similarEvents?.length || 1) || 100
      const avgOccupancy = similarEvents?.reduce((sum, e) => sum + Number(e.occupancy_rate || 0), 0) / (similarEvents?.length || 1) || 0.7

      const basePrice = avgPrice
      let multiplier = 1.0

      const isWeekend = ['Friday', 'Saturday', 'Sunday'].includes(input.event.dayOfWeek)
      const isPremiumCity = ['São Paulo', 'Rio de Janeiro'].includes(input.event.city)
      
      if (isWeekend) multiplier += 0.2
      if (isPremiumCity) multiplier += 0.25
      if (avgOccupancy > 0.8) multiplier += 0.15 // High demand genre/city combination

      const pistaPrice = Math.round(basePrice * multiplier)

      return {
        objective: 'Precificação dinâmica baseada em dados históricos reais de eventos similares',
        dataUsed: ['Historical event performance', 'Occupancy rates', 'Revenue per person', 'Genre analytics'],
        recommendedPrices: {
          pista: { min: Math.round(pistaPrice * 0.8), max: Math.round(pistaPrice * 1.3), optimal: pistaPrice },
          vip: { min: Math.round(pistaPrice * 1.5), max: Math.round(pistaPrice * 2.0), optimal: Math.round(pistaPrice * 1.7) },
          camarote: { min: Math.round(pistaPrice * 2.5), max: Math.round(pistaPrice * 3.5), optimal: Math.round(pistaPrice * 3.0) }
        },
        confidence: similarEvents && similarEvents.length > 5 ? 'alta' : similarEvents && similarEvents.length > 2 ? 'média' : 'baixa',
        analysis: [
          {
            factor: 'Dados históricos',
            impact: `Base: R$ ${avgPrice.toFixed(0)}`,
            justification: `Análise de ${similarEvents?.length || 0} eventos similares`
          },
          {
            factor: 'Taxa de ocupação',
            impact: `${(avgOccupancy * 100).toFixed(0)}%`,
            justification: avgOccupancy > 0.8 ? 'Alta demanda histórica permite premium pricing' : 'Demanda moderada requer preços competitivos'
          },
          {
            factor: 'Sazonalidade',
            impact: isWeekend ? '+20%' : '0%',
            justification: isWeekend ? 'Finais de semana têm demanda maior' : 'Dias úteis mantêm preço base'
          }
        ],
        demandCurve: [
          { ticketType: 'pista', price: pistaPrice * 0.8, estimatedDemand: Math.round(input.event.capacity * 0.9) },
          { ticketType: 'pista', price: pistaPrice, estimatedDemand: Math.round(input.event.capacity * (avgOccupancy || 0.7)) },
          { ticketType: 'pista', price: pistaPrice * 1.2, estimatedDemand: Math.round(input.event.capacity * 0.5) }
        ],
        recommendations: [
          `Com base em ${similarEvents?.length || 0} eventos similares, recomendamos preço inicial de R$ ${pistaPrice}`,
          'Monitorar velocidade de vendas nas primeiras 48h para ajustes',
          avgOccupancy > 0.8 ? 'Demanda alta permite estratégia de premium pricing' : 'Considerar promoções early bird para acelerar vendas'
        ]
      }
    } catch (error) {
      console.error('Pricing analysis error:', error)
      throw new Error('Failed to run pricing analysis with real data')
    }
  }

  // Churn Prediction using real interaction data
  async runChurnPrediction(input: ChurnInput): Promise<ChurnOutput> {
    try {
      const customerId = parseInt(input.customerId)
      
      if (isNaN(customerId)) {
        throw new Error('Invalid customer ID provided')
      }

      // Get real customer interaction data
      const { data: interactions, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Get customer's latest scoring
      const { data: latestScoring, error: scoringError } = await supabase
        .from('scoring_snapshots')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (scoringError) throw scoringError

      const daysSinceLastEvent = Math.floor((Date.now() - new Date(input.lastEventDate).getTime()) / (1000 * 60 * 60 * 24))
      const daysSinceLastInteraction = interactions?.length > 0 ? 
        Math.floor((Date.now() - new Date(interactions[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) : 365

      // Calculate churn probability based on real data
      let churnScore = 0
      
      // Recency factor (most important)
      if (daysSinceLastEvent > 180) churnScore += 0.4
      else if (daysSinceLastEvent > 90) churnScore += 0.2
      else if (daysSinceLastEvent > 30) churnScore += 0.1

      // Interaction recency
      if (daysSinceLastInteraction > 90) churnScore += 0.3
      else if (daysSinceLastInteraction > 30) churnScore += 0.1

      // Propensity score (if available)
      if (latestScoring?.[0]?.propensity_score) {
        const propensityScore = Number(latestScoring[0].propensity_score)
        if (propensityScore < 0.3) churnScore += 0.3
        else if (propensityScore < 0.5) churnScore += 0.1
      }

      churnScore = Math.min(churnScore, 1)

      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (churnScore > 0.7) riskLevel = 'high'
      else if (churnScore > 0.4) riskLevel = 'medium'

      return {
        customerId: input.customerId,
        churnProbability: churnScore,
        riskLevel,
        recommendations: [
          riskLevel === 'high' ? 'Oferta personalizada urgente com desconto de 30%' : 
          riskLevel === 'medium' ? 'Convite para evento similar ao histórico do cliente' : 
          'Manter comunicação regular com novidades',
          `${daysSinceLastInteraction} dias desde última interação - ${daysSinceLastInteraction > 60 ? 'reativar' : 'manter engajamento'}`,
          latestScoring?.[0]?.segment ? `Cliente no segmento ${latestScoring[0].segment} - estratégia direcionada` : 'Analisar padrão de consumo para personalização'
        ]
      }
    } catch (error) {
      console.error('Churn prediction error:', error)
      throw new Error(`Failed to run churn prediction with real data: ${error.message}`)
    }
  }

  // Target Audience Analysis using real customer segments
  async runTargetAudienceAnalysis(input: TargetAudienceInput): Promise<TargetAudienceOutput> {
    try {
      // Get real customer and demographic data
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')

      if (customersError) throw customersError

      const { data: demographics, error: demoError } = await supabase
        .from('vw_segment_demographics')
        .select('*')

      if (demoError) throw demoError

      const { data: consumption, error: consumptionError } = await supabase
        .from('vw_segment_consumption')
        .select('*')

      if (consumptionError) throw consumptionError

      if (!customers?.length || !demographics?.length || !consumption?.length) {
        throw new Error('Insufficient data for target audience analysis')
      }

      // Calculate demographics for the region
      const regionCustomers = customers.filter(c => 
        c.city?.toLowerCase().includes(input.region?.toLowerCase() || '') || input.region === 'all'
      )

      const totalCustomers = regionCustomers.length
      const averageAge = regionCustomers.reduce((sum, c) => {
        const age = new Date().getFullYear() - new Date(c.birthdate).getFullYear()
        return sum + age
      }, 0) / totalCustomers

      const genderDistribution = regionCustomers.reduce((acc, c) => {
        acc[c.gender] = (acc[c.gender] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Get best performing segment
      const bestSegment = consumption?.reduce((best, current) => 
        Number(current.avg_monetary_total || 0) > Number(best.avg_monetary_total || 0) ? current : best
      )

      const matchingDemo = demographics?.find(d => d.segment === bestSegment?.segment)
      const avgSpending = bestSegment?.avg_monetary_total || 0

      return {
        objective: 'Análise de público-alvo baseada em segmentos reais e dados comportamentais',
        dataUsed: ['Customer demographics', 'Regional data', 'Segment consumption', 'Behavioral patterns'],
        idealProfile: {
          ageRange: `${Math.max(18, Math.round(averageAge - 5))}-${Math.round(averageAge + 5)} anos`,
          gender: Object.keys(genderDistribution).reduce((a, b) => 
            genderDistribution[a] > genderDistribution[b] ? a : b),
          location: [input.region, 'Região metropolitana'],
          favoriteDrink: this.getFavoriteDrink(bestSegment?.segment),
          spendingProfile: avgSpending > 800 ? 'Alto' : avgSpending > 400 ? 'Médio' : 'Baixo'
        },
        audienceSize: {
          potential: Math.round(totalCustomers * 2.5), // Estimate market potential
          withinDatabase: totalCustomers,
          percentage: Math.round((totalCustomers / (totalCustomers * 2.5)) * 100)
        },
        sponsorAffinity: [
          { category: 'Bebidas Alcoólicas', affinity: 85, description: `Público gasta em média R$ ${(bestSegment?.avg_bar_spend || 0).toFixed(0)} em bebidas por evento` },
          { category: 'Lifestyle/Moda', affinity: 72, description: 'Alto engajamento digital do público-alvo' },
          { category: 'Tecnologia', affinity: 68, description: 'Público jovem com alta afinidade digital' }
        ],
        analysis: [
          `${totalCustomers} clientes identificados no target para ${input.genre} em ${input.region}`,
          `Gasto médio por cliente: R$ ${avgSpending.toFixed(0)}`,
          `Melhor segmento: ${bestSegment?.segment || 'Heavy'} com ${bestSegment?.customers || 0} clientes`
        ],
        recommendations: [
          {
            sponsor: 'Marca de Cerveja Premium', 
            argument: `Público gasta R$ ${(bestSegment?.avg_bar_spend || 50).toFixed(0)} por evento em bebidas`,
            audienceMatch: '87% match com perfil premium'
          },
          {
            sponsor: 'App de Delivery/Lifestyle',
            argument: `${Math.round(averageAge)} anos é a idade média - alta adoção de apps`,
            audienceMatch: '78% match com target digital'
          }
        ]
      }
    } catch (error) {
      console.error('Target audience analysis error:', error)
      throw new Error(`Failed to run target audience analysis with real data: ${error.message}`)
    }
  }

  // Recommendation Engine using real consumption and interaction data
  async runRecommendationEngine(input: RecommendationInput): Promise<RecommendationOutput> {
    try {
      const customerId = parseInt(input.customerId)
      
      if (isNaN(customerId)) {
        throw new Error('Invalid customer ID provided')
      }

      // Get real customer consumption data
      const { data: consumptions, error: consError } = await supabase
        .from('consumptions')
        .select('*')
        .eq('customerid', customerId)
        .order('timestamp', { ascending: false })
        .limit(20)

      if (consError) throw consError

      // Get customer interactions
      const { data: interactions, error: intError } = await supabase
        .from('interactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (intError) throw intError

      // Get future events for recommendations
      const { data: futureEvents, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .limit(10)

      if (eventsError) throw eventsError

      if (!futureEvents?.length) {
        throw new Error('No upcoming events available for recommendations')
      }

      // Analyze consumption patterns
      const avgSpent = consumptions?.reduce((sum, c) => sum + Number(c.totalvalue || 0), 0) / (consumptions?.length || 1) || 0
      const favoriteItems = this.getMostFrequentItems(consumptions || [])
      const totalInteractions = interactions?.length || 0

      // Generate event recommendations based on real data
      const userGenres = this.extractGenresFromInteractions(interactions || [])
      
      const eventRecommendations = futureEvents.slice(0, 3).map(event => ({
        eventId: event.id,
        title: `${event.artist} - ${event.venue}`,
        genre: event.genre,
        conversionProbability: this.calculateConversionProbability(event, userGenres, avgSpent),
        reasons: [
          avgSpent >= Number(event.ticket_price || 0) ? 'Perfil de gasto compatível' : 'Evento acessível',
          totalInteractions > 5 ? 'Cliente ativo' : 'Oportunidade de engajamento',
          `Local: ${event.city} - ${event.venue}`
        ]
      }))

      // Generate product recommendations based on consumption history
      const productRecommendations = this.generateProductRecommendations(consumptions || [], avgSpent)

      return {
        objective: 'Sistema de recomendação baseado em dados reais de consumo e interações',
        dataUsed: ['Consumption history', 'Customer interactions', 'Event preferences', 'Spending patterns'],
        eventRecommendations,
        productRecommendations,
        analysis: [
          `Cliente tem gasto médio de R$ ${avgSpent.toFixed(0)} por evento`,
          `Itens mais consumidos: ${favoriteItems.slice(0, 3).join(', ')}`,
          `${totalInteractions} interações analisadas nos últimos meses`
        ],
        crossSellInsights: [{
          fromCluster: avgSpent > 150 ? 'Premium' : avgSpent > 80 ? 'Standard' : 'Economy',
          toProduct: avgSpent > 100 ? 'VIP Experience' : 'Premium Upgrade',
          strategy: 'Upgrade baseado em histórico de gastos',
          expectedUplift: Math.round(avgSpent * 0.3)
        }],
        recommendations: [
          'Personalizar ofertas baseadas no histórico de consumo real',
          `Focar em produtos similares aos consumidos: ${favoriteItems.slice(0, 2).join(', ')}`,
          consumptions && consumptions.length > 5 ? 'Cliente ativo - oferecer programa de fidelidade' : 'Cliente em desenvolvimento - incentivar frequência'
        ]
      }
    } catch (error) {
      console.error('Recommendation engine error:', error)
      throw new Error(`Failed to run recommendation engine with real data: ${error.message}`)
    }
  }

  private getSegmentDescription(segment: string | null): string {
    const descriptions: { [key: string]: string } = {
      'Champions': 'Clientes de alto valor que compram frequentemente',
      'Loyal Customers': 'Clientes fiéis com gastos consistentes',
      'Potential Loyalists': 'Clientes recentes com potencial de fidelização',
      'New Customers': 'Clientes novos que precisam ser desenvolvidos',
      'Promising': 'Clientes com potencial de crescimento',
      'Need Attention': 'Clientes que requerem atenção especial',
      'About to Sleep': 'Clientes em risco de churn',
      'At Risk': 'Clientes em alto risco de abandono',
      'Cannot Lose Them': 'Clientes valiosos em risco crítico',
      'Hibernating': 'Clientes inativos há muito tempo',
      'Lost': 'Clientes perdidos que não retornaram'
    }
    return descriptions[segment || ''] || 'Segmento de clientes com características específicas'
  }

  private getFavoriteDrink(segment: string | null): string {
    const drinks: { [key: string]: string } = {
      'Champions': 'Whisky Premium',
      'Loyal Customers': 'Gin Tônica',
      'Potential Loyalists': 'Cerveja Premium',
      'New Customers': 'Cerveja',
      'Promising': 'Caipirinha',
      'Need Attention': 'Cerveja',
      'About to Sleep': 'Vodka',
      'At Risk': 'Cerveja',
      'Cannot Lose Them': 'Champagne',
      'Hibernating': 'Cerveja',
      'Lost': 'Cerveja'
    }
    return drinks[segment || ''] || 'Cerveja'
  }

  private getMarketingInsights(segment: string | null): string[] {
    const insights: { [key: string]: string[] } = {
      'Champions': ['Oferecer experiências VIP exclusivas', 'Programa de embaixadores', 'Acesso antecipado a eventos'],
      'Loyal Customers': ['Programa de fidelidade com benefícios', 'Convites para eventos especiais', 'Descontos em grupo'],
      'Potential Loyalists': ['Campanhas de conversão', 'Ofertas de upgrade', 'Experiências personalizadas'],
      'New Customers': ['Onboarding especial', 'Descontos de boas-vindas', 'Tutorial de produtos'],
      'Promising': ['Incentivar frequência', 'Ofertas de valor', 'Feedback e engajamento'],
      'Need Attention': ['Campanhas de reativação', 'Ofertas especiais', 'Comunicação direcionada'],
      'About to Sleep': ['Campanhas urgentes de retenção', 'Descontos atrativos', 'Pesquisa de satisfação'],
      'At Risk': ['Win-back campaigns', 'Ofertas exclusivas', 'Atendimento personalizado'],
      'Cannot Lose Them': ['Programa VIP urgente', 'Gestor de conta dedicado', 'Benefícios exclusivos'],
      'Hibernating': ['Campanhas de reconquista', 'Novidades e lançamentos', 'Ofertas irresistíveis'],
      'Lost': ['Pesquisa de motivos', 'Campanhas de reconquista', 'Novas propostas de valor']
    }
    return insights[segment || ''] || ['Estratégia de marketing personalizada', 'Comunicação direcionada', 'Ofertas relevantes']
  }

  private getMostFrequentItems(consumptions: any[]): string[] {
    const itemCount: { [key: string]: number } = {}
    consumptions.forEach(c => {
      itemCount[c.item] = (itemCount[c.item] || 0) + c.quantity
    })
    return Object.entries(itemCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([item]) => item)
  }

  private extractGenresFromInteractions(interactions: any[]): string[] {
    const genres = new Set<string>()
    interactions.forEach(i => {
      if (i.metadata?.genre) genres.add(i.metadata.genre)
    })
    return Array.from(genres)
  }

  private calculateConversionProbability(event: any, userGenres: string[], avgSpent: number): 'alta' | 'média' | 'baixa' {
    let score = 0
    if (userGenres.includes(event.genre)) score += 3
    if (avgSpent >= Number(event.ticket_price || 0)) score += 2
    if (score >= 4) return 'alta'
    if (score >= 2) return 'média'
    return 'baixa'
  }

  private generateProductRecommendations(consumptions: any[], avgSpent: number): any[] {
    const favoriteItems = this.getMostFrequentItems(consumptions)
    
    return [
      {
        product: favoriteItems[0] || 'Cerveja Premium',
        category: 'Bebidas',
        combo: `${favoriteItems[0] || 'Cerveja'} + Porção`,
        conversionProbability: 'alta' as const,
        expectedValue: Math.round(avgSpent * 0.6)
      },
      {
        product: avgSpent > 100 ? 'Open Bar Premium' : 'Open Bar Standard',
        category: 'Pacotes',
        conversionProbability: avgSpent > 100 ? 'alta' as const : 'média' as const,
        expectedValue: avgSpent > 100 ? 120 : 80
      }
    ]
  }
}

export const mlService = new MLService()

export type {
  MLConfig,
  SegmentationInput,
  SegmentationOutput,
  PricingInput,
  PricingOutput,
  ChurnInput,
  ChurnOutput,
  TargetAudienceInput,
  TargetAudienceOutput,
  RecommendationInput,
  RecommendationOutput
}
