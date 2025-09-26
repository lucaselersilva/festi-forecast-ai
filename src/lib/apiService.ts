// API Service - Centralized API calls and configuration
// This file can be easily modified to adjust API endpoints and keys

interface ApiConfig {
  openaiApiKey?: string
  mlServiceUrl?: string
  timeout?: number
}

class ApiService {
  private config: ApiConfig

  constructor() {
    this.config = {
      mlServiceUrl: 'http://localhost:8000', // Default ML service URL
      timeout: 30000
    }
  }

  // Update API configuration
  updateConfig(newConfig: Partial<ApiConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  // Set OpenAI API Key (will be loaded from environment)
  setOpenAIKey(apiKey: string) {
    this.config.openaiApiKey = apiKey
  }

  // Get OpenAI API Key from environment
  private getOpenAIKey(): string | undefined {
    return process.env.OPENAI_API_KEY
  }

  // Set ML Service URL
  setMLServiceUrl(url: string) {
    this.config.mlServiceUrl = url
  }

  // Generic API call method
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.mlServiceUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // ML Service Health Check
  async healthCheck() {
    try {
      return await this.makeRequest('/healthz')
    } catch (error) {
      console.error('ML Service health check failed:', error)
      return { status: 'error', message: 'ML Service unavailable' }
    }
  }

  // Segmentation API Call
  async runSegmentation(data: any) {
    return this.makeRequest('/segment', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Pricing API Call
  async runPricing(data: any) {
    return this.makeRequest('/pricing', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Recommendations API Call
  async runRecommendations(data: any) {
    return this.makeRequest('/recommendations', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Churn Prediction API Call
  async runChurnPrediction(data: any) {
    return this.makeRequest('/churn', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Briefing Target Analysis API Call
  async runBriefingAnalysis(data: any) {
    return this.makeRequest('/briefing_target', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // OpenAI API Call (for enhanced text processing)
  async callOpenAI(prompt: string, model: string = 'gpt-4o-mini') {
    const apiKey = this.getOpenAIKey()
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add your API key in the settings.')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an expert in event marketing and audience analysis for the Brazilian market.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }
}

export const apiService = new ApiService()
export type { ApiConfig }