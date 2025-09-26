// ML Service - Separate module for AI/ML operations
// This file can be easily modified to adjust ML logic and API endpoints

interface MLConfig {
  apiKey?: string
  baseUrl?: string
  timeout?: number
}

interface SegmentationInput {
  events: Array<{
    event_id: number
    genre: string
    ticket_price: number
    marketing_spend: number
    sold_tickets?: number
    revenue?: number
    capacity: number
    city: string
  }>
}

interface SegmentationOutput {
  segments: Array<{
    id: string
    name: string
    description: string
    size: number
    avgTicketPrice: number
    avgRevenue: number
    topGenres: string[]
    topCities: string[]
    characteristics: string[]
  }>
  insights: string[]
}

interface PricingInput {
  event: {
    genre: string
    city: string
    venue: string
    capacity: number
    date: string
    marketing_spend: number
  }
  historicalData: Array<{
    ticket_price: number
    sold_tickets: number
    revenue: number
    genre: string
    city: string
    capacity: number
  }>
}

interface PricingOutput {
  suggestedPrices: {
    basic: number
    premium: number
    vip: number
  }
  demandForecast: {
    expectedSales: number
    confidence: number
  }
  insights: string[]
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

interface BriefingInput {
  eventDescription: string
  genre: string
  city: string
  targetAudience?: string
  budget?: number
}

interface BriefingOutput {
  targetSegments: string[]
  recommendedChannels: string[]
  estimatedReach: number
  insights: string[]
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
      // For MVP, return mock segmentation based on simple rules
      // Replace this with actual ML API call when ready
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

  // Briefing Target Analysis
  async runBriefingAnalysis(input: BriefingInput): Promise<BriefingOutput> {
    try {
      // For MVP, return mock briefing analysis
      // Replace this with actual ML API call when ready
      return this.mockBriefingAnalysis(input)
    } catch (error) {
      console.error('Briefing analysis error:', error)
      throw new Error('Failed to run briefing analysis')
    }
  }

  // Mock implementations for MVP (replace with actual ML calls)
  private mockSegmentation(input: SegmentationInput): SegmentationOutput {
    const segments = [
      {
        id: 'premium_seekers',
        name: 'Premium Seekers',
        description: 'High-value customers who prefer premium experiences',
        size: Math.floor(input.events.length * 0.15),
        avgTicketPrice: 180,
        avgRevenue: 25000,
        topGenres: ['Eletrônica', 'Rock'],
        topCities: ['São Paulo', 'Rio de Janeiro'],
        characteristics: ['High ticket price tolerance', 'Quality conscious', 'Brand loyal']
      },
      {
        id: 'mainstream_audience',
        name: 'Mainstream Audience',
        description: 'General audience with diverse preferences',
        size: Math.floor(input.events.length * 0.60),
        avgTicketPrice: 90,
        avgRevenue: 15000,
        topGenres: ['Pop', 'Sertanejo', 'MPB'],
        topCities: ['São Paulo', 'Belo Horizonte', 'Brasília'],
        characteristics: ['Price sensitive', 'Genre diverse', 'Social influenced']
      },
      {
        id: 'budget_conscious',
        name: 'Budget Conscious',
        description: 'Price-sensitive audience looking for value',
        size: Math.floor(input.events.length * 0.25),
        avgTicketPrice: 50,
        avgRevenue: 8000,
        topGenres: ['Forró', 'Funk', 'Pagode'],
        topCities: ['Salvador', 'Fortaleza', 'Recife'],
        characteristics: ['Price sensitive', 'Local preference', 'Group buyers']
      }
    ]

    return {
      segments,
      insights: [
        'Premium segment shows 40% higher lifetime value',
        'Mainstream audience responds well to social media marketing',
        'Budget conscious segment prefers group discounts'
      ]
    }
  }

  private mockPricing(input: PricingInput): PricingOutput {
    const basePrice = input.historicalData.length > 0 
      ? input.historicalData.reduce((sum, event) => sum + event.ticket_price, 0) / input.historicalData.length
      : 100

    const cityMultiplier = ['São Paulo', 'Rio de Janeiro'].includes(input.event.city) ? 1.3 : 1.0
    const genreMultiplier = ['Eletrônica', 'Rock'].includes(input.event.genre) ? 1.2 : 1.0
    
    const adjustedBase = basePrice * cityMultiplier * genreMultiplier

    return {
      suggestedPrices: {
        basic: Math.round(adjustedBase * 0.8),
        premium: Math.round(adjustedBase),
        vip: Math.round(adjustedBase * 1.5)
      },
      demandForecast: {
        expectedSales: Math.floor(input.event.capacity * 0.75),
        confidence: 0.8
      },
      insights: [
        `City factor: ${input.event.city} adds ${((cityMultiplier - 1) * 100).toFixed(0)}% premium`,
        `Genre factor: ${input.event.genre} adds ${((genreMultiplier - 1) * 100).toFixed(0)}% premium`,
        'Recommended to test premium pricing first'
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

  private mockBriefingAnalysis(input: BriefingInput): BriefingOutput {
    const keywords = input.eventDescription.toLowerCase()
    
    let targetSegments = ['mainstream_audience']
    if (keywords.includes('premium') || keywords.includes('vip')) {
      targetSegments = ['premium_seekers']
    }
    if (keywords.includes('jovem') || keywords.includes('festa')) {
      targetSegments.push('budget_conscious')
    }

    return {
      targetSegments,
      recommendedChannels: ['Instagram', 'Facebook', 'WhatsApp Groups'],
      estimatedReach: Math.floor(Math.random() * 50000) + 10000,
      insights: [
        `Primary target: ${targetSegments[0].replace('_', ' ')}`,
        `Recommended budget allocation: 60% digital, 40% traditional`,
        'Start campaign 30 days before event'
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
  BriefingInput,
  BriefingOutput
}