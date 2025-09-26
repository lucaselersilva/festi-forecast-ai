// ML Service - Separate module for AI/ML operations
// This file can be easily modified to adjust ML logic and API endpoints

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
      baseUrl: 'http://localhost:8000', // Default FastAPI URL - change as needed
      timeout: 30000,
      ...config
    }
  }

  // Update configuration (API keys, endpoints, etc.)
  updateConfig(newConfig: Partial<MLConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  // Segmentation Analysis
  async runSegmentation(input: SegmentationInput): Promise<SegmentationOutput> {
    try {
      // For now, return enhanced mock data based on real input
      // TODO: Replace with actual ML API call
      return this.mockSegmentation(input)
    } catch (error) {
      console.error('Segmentation error:', error)
      throw new Error('Failed to run segmentation analysis')
    }
  }

  // Dynamic Pricing
  async runPricing(input: PricingInput): Promise<PricingOutput> {
    try {
      // For MVP, return mock pricing based on simple rules
      // Replace this with actual ML API call when ready
      return this.mockPricing(input)
    } catch (error) {
      console.error('Pricing error:', error)
      throw new Error('Failed to run pricing analysis')
    }
  }

  // Churn Prediction
  async runChurnPrediction(input: ChurnInput): Promise<ChurnOutput> {
    try {
      // For MVP, return mock churn prediction
      // Replace this with actual ML API call when ready
      return this.mockChurnPrediction(input)
    } catch (error) {
      console.error('Churn prediction error:', error)
      throw new Error('Failed to run churn prediction')
    }
  }

  // Target Audience Analysis for Campaigns/Sponsorships
  async runTargetAudienceAnalysis(input: TargetAudienceInput): Promise<TargetAudienceOutput> {
    try {
      // Call OpenAI for enhanced target audience analysis
      const prompt = `Analyze this event for target audience and sponsorship recommendations:

Event: ${input.eventDescription}
Genre: ${input.genre}
Average Price: R$ ${input.averagePrice}
Region: ${input.region}

Existing Customer Clusters: ${input.existingClusters.map(c => c.name).join(', ')}

Provide a JSON response with:
- idealProfile: {ageRange, gender, location, favoriteDrink, spendingProfile}
- audienceSize: {potential, withinDatabase, percentage}
- sponsorAffinity: [{category, affinity, description}]
- recommendations: [{sponsor, argument, audienceMatch}]

Focus on Brazilian market and realistic sponsor categories.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert in Brazilian event marketing and audience analysis. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }),
      })

      if (!response.ok) {
        console.warn('OpenAI API failed, using fallback analysis')
        return this.mockTargetAudienceAnalysis(input)
      }

      const data = await response.json()
      const aiResponse = JSON.parse(data.choices[0].message.content)
      
      return {
        objective: 'Recomendar o público mais adequado para campanhas e patrocínios',
        dataUsed: ['Descrição do evento', 'Gênero musical', 'Preço médio', 'Região', 'Clusters existentes'],
        idealProfile: aiResponse.idealProfile || {
          ageRange: '18-35 anos',
          gender: 'Misto',
          location: [input.region],
          favoriteDrink: 'Cerveja',
          spendingProfile: 'Médio'
        },
        audienceSize: aiResponse.audienceSize || {
          potential: 45000,
          withinDatabase: 15000,
          percentage: 33
        },
        sponsorAffinity: aiResponse.sponsorAffinity || [
          { category: 'Bebidas', affinity: 85, description: 'Alta afinidade com marcas de cerveja e energéticos' }
        ],
        analysis: aiResponse.analysis || ['Análise baseada em dados históricos de eventos similares'],
        recommendations: aiResponse.recommendations || [
          { sponsor: 'Marca de Cerveja Premium', argument: '65% do público consome cerveja em eventos do gênero', audienceMatch: '85% match' }
        ]
      }
    } catch (error) {
      console.error('Target audience analysis error:', error)
      // Fallback to mock analysis
      return this.mockTargetAudienceAnalysis(input)
    }
  }

  // New Recommendation Engine
  async runRecommendationEngine(input: RecommendationInput): Promise<RecommendationOutput> {
    try {
      // For MVP, return mock recommendations based on customer data
      return this.mockRecommendationEngine(input)
    } catch (error) {
      console.error('Recommendation engine error:', error)
      throw new Error('Failed to run recommendation analysis')
    }
  }

  // Mock implementations for MVP (replace with actual ML calls)
  private mockSegmentation(input: SegmentationInput): SegmentationOutput {
    const totalCustomers = input.customerData.length
    
    const segments = [
      {
        id: 'frequentes_alto_gasto',
        name: 'Frequentes de Alto Gasto',
        description: 'Clientes que frequentam regularmente eventos e gastam acima da média no bar',
        size: Math.floor(totalCustomers * 0.18),
        percentage: 18,
        dominantCharacteristics: {
          ageRange: '25-40 anos',
          avgSpending: 250,
          favoriteDrink: 'Whisky Premium',
          frequency: '2-3 eventos/mês'
        },
        marketingInsights: [
          'Oferecer combo VIP + open bar premium',
          'Programa de fidelidade exclusivo',
          'Convites antecipados para eventos especiais'
        ]
      },
      {
        id: 'universitarios_open_bar',
        name: 'Universitários Open Bar',
        description: 'Jovens universitários que preferem eventos com open bar e preços acessíveis',
        size: Math.floor(totalCustomers * 0.35),
        percentage: 35,
        dominantCharacteristics: {
          ageRange: '18-25 anos',
          avgSpending: 85,
          favoriteDrink: 'Cerveja/Caipirinha',
          frequency: '1-2 eventos/mês'
        },
        marketingInsights: [
          'Promoções de meia-entrada',
          'Pacotes para grupos de amigos',
          'Marketing focado em redes sociais'
        ]
      },
      {
        id: 'premium_vip',
        name: 'Premium VIP',
        description: 'Clientes que buscam experiências exclusivas e não se importam com preço alto',
        size: Math.floor(totalCustomers * 0.12),
        percentage: 12,
        dominantCharacteristics: {
          ageRange: '30-50 anos',
          avgSpending: 400,
          favoriteDrink: 'Champagne/Gin Premium',
          frequency: '1 evento/mês'
        },
        marketingInsights: [
          'Camarotes exclusivos com serviço personalizado',
          'Experiências gastronômicas especiais',
          'Acesso a artistas e backstage'
        ]
      }
    ]

    return {
      objective: 'Criar segmentos de clientes a partir de dados demográficos, socioeconômicos e comportamentais',
      dataUsed: ['Idade', 'Gênero', 'Cidade/Estado', 'Visitas anteriores', 'Lifetime value', 'Ticket médio no bar', 'Bebidas consumidas', 'Histórico de check-ins'],
      segments,
      analysis: [
        `Segmento Premium VIP representa apenas 12% da base mas contribui com 35% da receita do bar`,
        `Universitários representam maior volume (35%) mas menor ticket médio`,
        `Frequentes de Alto Gasto são o público ideal para campanhas de fidelização`
      ],
      recommendations: [
        'Criar programa de pontuação específico para Frequentes de Alto Gasto',
        'Desenvolver eventos temáticos para atrair mais Premium VIP',
        'Implementar estratégia de upgrade de Universitários para categoria superior'
      ]
    }
  }

  private mockPricing(input: PricingInput): PricingOutput {
    const isWeekend = ['Friday', 'Saturday', 'Sunday'].includes(input.event.dayOfWeek)
    const isPremiumCity = ['São Paulo', 'Rio de Janeiro'].includes(input.event.city)
    const isPremiumGenre = ['Eletrônica', 'Rock', 'Indie'].includes(input.event.genre)
    
    const basePrice = 80
    let multiplier = 1.0
    
    if (isWeekend) multiplier += 0.25
    if (isPremiumCity) multiplier += 0.30
    if (isPremiumGenre) multiplier += 0.20
    if (input.event.weather?.precipitation > 5) multiplier += 0.15 // Chuva aumenta demanda
    
    const pistaPrice = Math.round(basePrice * multiplier)
    
    return {
      objective: 'Sugerir ajustes de preço para maximizar receita e ocupação',
      dataUsed: ['Vendas históricas', 'Curva de demanda', 'Tipo de ingresso', 'Capacidade', 'Data', 'Dia da semana', 'Clima', 'Eventos concorrentes'],
      recommendedPrices: {
        pista: { min: Math.round(pistaPrice * 0.8), max: Math.round(pistaPrice * 1.2), optimal: pistaPrice },
        vip: { min: Math.round(pistaPrice * 1.4), max: Math.round(pistaPrice * 1.8), optimal: Math.round(pistaPrice * 1.6) },
        camarote: { min: Math.round(pistaPrice * 2.2), max: Math.round(pistaPrice * 3.0), optimal: Math.round(pistaPrice * 2.5) }
      },
      confidence: isWeekend && isPremiumCity ? 'alta' : isPremiumCity ? 'média' : 'baixa',
      analysis: [
        {
          factor: 'Dia da semana',
          impact: isWeekend ? '+25%' : '0%',
          justification: isWeekend ? 'Finais de semana têm demanda 25% maior' : 'Dias úteis mantêm preço base'
        },
        {
          factor: 'Localização',
          impact: isPremiumCity ? '+30%' : '0%',
          justification: isPremiumCity ? 'Cidades premium suportam preços mais altos' : 'Mercado regional com sensibilidade a preço'
        },
        {
          factor: 'Gênero musical',
          impact: isPremiumGenre ? '+20%' : '0%',
          justification: isPremiumGenre ? 'Gênero com público disposto a pagar mais' : 'Gênero mainstream com preço competitivo'
        }
      ],
      demandCurve: [
        { ticketType: 'pista', price: pistaPrice * 0.8, estimatedDemand: input.event.capacity * 0.95 },
        { ticketType: 'pista', price: pistaPrice, estimatedDemand: input.event.capacity * 0.80 },
        { ticketType: 'pista', price: pistaPrice * 1.2, estimatedDemand: input.event.capacity * 0.60 }
      ],
      recommendations: [
        'Iniciar vendas com preço premium e reduzir gradualmente se necessário',
        'Monitorar taxa de conversão nas primeiras 48h',
        'Criar promoções early bird para acelerar vendas iniciais'
      ]
    }
  }

  private mockChurnPrediction(input: ChurnInput): ChurnOutput {
    const daysSinceLastEvent = Math.floor((Date.now() - new Date(input.lastEventDate).getTime()) / (1000 * 60 * 60 * 24))
    const churnScore = Math.min(daysSinceLastEvent / 365, 1) // Simple time-based score

    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (churnScore > 0.7) riskLevel = 'high'
    else if (churnScore > 0.4) riskLevel = 'medium'

    return {
      customerId: input.customerId,
      churnProbability: churnScore,
      riskLevel,
      recommendations: [
        riskLevel === 'high' ? 'Send personalized discount offer' : 'Maintain regular communication',
        'Invite to exclusive pre-sale events',
        'Survey for preferences and feedback'
      ]
    }
  }

  private mockTargetAudienceAnalysis(input: TargetAudienceInput): TargetAudienceOutput {
    const keywords = input.eventDescription.toLowerCase()
    const isPremium = keywords.includes('premium') || keywords.includes('vip') || input.averagePrice > 150
    
    return {
      objective: 'Recomendar o público mais adequado para um evento ou briefing de marketing',
      dataUsed: ['Descrição do evento', 'Gênero musical', 'Preço médio', 'Região', 'Clusters existentes'],
      idealProfile: {
        ageRange: isPremium ? '25-40 anos' : '18-30 anos',
        gender: 'Misto (55% feminino, 45% masculino)',
        location: [input.region, 'Região metropolitana'],
        favoriteDrink: isPremium ? 'Gin Tônica/Whisky' : 'Cerveja/Caipirinha',
        spendingProfile: isPremium ? 'Alto' : 'Médio'
      },
      audienceSize: {
        potential: Math.floor(Math.random() * 80000) + 30000,
        withinDatabase: Math.floor(Math.random() * 25000) + 8000,
        percentage: Math.floor(Math.random() * 40) + 20
      },
      sponsorAffinity: [
        { category: 'Bebidas Alcoólicas', affinity: 85, description: '65% do público consome cerveja premium durante eventos' },
        { category: 'Energéticos', affinity: 72, description: '45% consome energéticos em eventos eletrônicos' },
        { category: 'Moda/Lifestyle', affinity: 68, description: '60% segue marcas de moda no Instagram' }
      ],
      analysis: [
        'Público majoritariamente jovem com alto engajamento digital',
        'Preferência por experiências compartilháveis nas redes sociais',
        'Alta propensão ao consumo de bebidas premium durante eventos'
      ],
      recommendations: [
        {
          sponsor: 'Marca de Cerveja Premium',
          argument: '65% do público consome cerveja premium em eventos do gênero',
          audienceMatch: '85% match com perfil desejado'
        },
        {
          sponsor: 'Marca de Energético',
          argument: 'Gênero musical atrai 45% de consumidores regulares de energético',
          audienceMatch: '72% match com target jovem ativo'
        }
      ]
    }
  }

  private mockRecommendationEngine(input: RecommendationInput): RecommendationOutput {
    const genres = input.eventHistory.map(e => e.genre)
    const avgSpent = input.eventHistory.reduce((sum, e) => sum + e.spent, 0) / input.eventHistory.length
    const preferredProducts = input.consumptionHistory.slice(0, 3).map(c => c.product)

    return {
      objective: 'Analisar histórico de consumo e navegação para recomendar eventos, produtos ou bebidas',
      dataUsed: ['Eventos frequentados', 'Bebidas compradas', 'Consumo médio', 'Padrões de navegação'],
      eventRecommendations: [
        {
          eventId: 'future_event_1',
          title: 'Festival de Eletrônica Premium',
          genre: genres[0] || 'Eletrônica',
          conversionProbability: avgSpent > 150 ? 'alta' : 'média',
          reasons: ['Histórico em eventos similares', 'Perfil de gasto compatível', 'Gênero de preferência']
        },
        {
          eventId: 'future_event_2', 
          title: 'Noite Temática Rock',
          genre: 'Rock',
          conversionProbability: 'média',
          reasons: ['Diversificação de gêneros', 'Preço acessível', 'Venue familiar']
        }
      ],
      productRecommendations: [
        {
          product: 'Combo Gin Premium',
          category: 'Bebidas Premium',
          combo: 'Gin + Energético + Porção',
          conversionProbability: avgSpent > 100 ? 'alta' : 'baixa',
          expectedValue: 85
        },
        {
          product: 'Open Bar Cerveja',
          category: 'Bebidas Standard',
          conversionProbability: 'alta',
          expectedValue: 60
        }
      ],
      analysis: [
        `Cliente tem gasto médio de R$ ${avgSpent.toFixed(0)} por evento`,
        `Preferência clara por ${genres[0] || 'eventos diversos'}`,
        `Produtos mais consumidos: ${preferredProducts.join(', ')}`
      ],
      crossSellInsights: [
        {
          fromCluster: 'Universitários',
          toProduct: 'Camarote com Desconto',
          strategy: 'Desconto progressivo baseado em frequência',
          expectedUplift: 25
        },
        {
          fromCluster: 'Frequentes Alto Gasto',
          toProduct: 'Experiência VIP Completa',
          strategy: 'Upgrade automático para clientes fiéis',
          expectedUplift: 40
        }
      ],
      recommendations: [
        'Enviar recomendações personalizadas 15 dias antes de eventos compatíveis',
        'Oferecer combos baseados no histórico de consumo',
        'Implementar programa de cashback para produtos frequentemente consumidos'
      ]
    }
  }
}

export const mlService = new MLService()
export type { 
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