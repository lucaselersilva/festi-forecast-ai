import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json()
    const { genre, city, targetRevenue, capacity, date, sponsorBudget } = body

    console.log('Revenue analysis request:', { genre, city, targetRevenue, capacity, date, sponsorBudget })

    // Query historical event data for pricing analysis
    const { data: historicalEvents, error: historyError } = await supabase
      .from('vw_event_analogs')
      .select('*')
      .eq('genre', genre)
      .eq('city', city)
      .order('revenue', { ascending: false })
      .limit(20)

    console.log('Historical events found:', historicalEvents?.length || 0)

    // Query segment consumption data
    const { data: segmentData, error: segmentError } = await supabase
      .from('vw_segment_consumption')
      .select('*')
      .eq('genre', genre)
      .eq('city', city)

    console.log('Segment data found:', segmentData?.length || 0)

    // Query customer RFM data for pricing elasticity
    const { data: rfmData, error: rfmError } = await supabase
      .from('vw_customer_rfm')
      .select('*')
      .order('monetary_total', { ascending: false })
      .limit(100)

    console.log('RFM data found:', rfmData?.length || 0)

    // Calculate pricing tiers based on historical data
    const avgPrice = historicalEvents?.reduce((sum: number, event: any) => sum + (event.avg_price || 0), 0) / (historicalEvents?.length || 1) || 100
    const avgOccupancy = historicalEvents?.reduce((sum: number, event: any) => sum + (event.occupancy_rate || 0), 0) / (historicalEvents?.length || 1) || 0.75
    const avgRevenue = historicalEvents?.reduce((sum: number, event: any) => sum + (event.revenue || 0), 0) / (historicalEvents?.length || 1) || targetRevenue * 0.8

    // Pricing strategy analysis
    const pricingTiers = [
      {
        tier: "VIP",
        percentage: 10,
        priceMultiplier: 2.5,
        expectedConversion: 0.15,
        segmentTarget: "Champions"
      },
      {
        tier: "Premium", 
        percentage: 20,
        priceMultiplier: 1.8,
        expectedConversion: 0.25,
        segmentTarget: "Loyal"
      },
      {
        tier: "Standard",
        percentage: 50,
        priceMultiplier: 1.0,
        expectedConversion: 0.45,
        segmentTarget: "Potential"
      },
      {
        tier: "Early Bird",
        percentage: 20,
        priceMultiplier: 0.7,
        expectedConversion: 0.65,
        segmentTarget: "New"
      }
    ]

    // Calculate revenue projections for each tier
    const revenueProjections = pricingTiers.map(tier => {
      const tierCapacity = Math.floor(capacity * tier.percentage / 100)
      const tierPrice = avgPrice * tier.priceMultiplier
      const expectedSales = Math.floor(tierCapacity * tier.expectedConversion)
      const tierRevenue = expectedSales * tierPrice
      
      return {
        ...tier,
        capacity: tierCapacity,
        price: Math.round(tierPrice),
        expectedSales,
        revenue: Math.round(tierRevenue),
        conversionRate: tier.expectedConversion
      }
    })

    const totalProjectedRevenue = revenueProjections.reduce((sum, tier) => sum + tier.revenue, 0)
    const totalExpectedSales = revenueProjections.reduce((sum, tier) => sum + tier.expectedSales, 0)

    // Price elasticity analysis
    const elasticityScenarios = [
      {
        scenario: "Conservative",
        priceAdjustment: 0.9,
        demandImpact: 1.15,
        description: "Preços 10% abaixo da média para maximizar ocupação"
      },
      {
        scenario: "Aggressive", 
        priceAdjustment: 1.2,
        demandImpact: 0.8,
        description: "Preços 20% acima da média para maximizar receita por ingresso"
      },
      {
        scenario: "Optimal",
        priceAdjustment: 1.05,
        demandImpact: 0.95,
        description: "Preços otimizados para melhor relação receita/ocupação"
      }
    ]

    const scenarioAnalysis = elasticityScenarios.map(scenario => {
      const adjustedProjections = revenueProjections.map(tier => ({
        ...tier,
        adjustedPrice: Math.round(tier.price * scenario.priceAdjustment),
        adjustedSales: Math.floor(tier.expectedSales * scenario.demandImpact),
        adjustedRevenue: Math.round(tier.price * scenario.priceAdjustment * tier.expectedSales * scenario.demandImpact)
      }))

      const totalRevenue = adjustedProjections.reduce((sum, tier) => sum + tier.adjustedRevenue, 0)
      const totalSales = adjustedProjections.reduce((sum, tier) => sum + tier.adjustedSales, 0)
      const occupancyRate = totalSales / capacity

      return {
        ...scenario,
        projections: adjustedProjections,
        totalRevenue: Math.round(totalRevenue),
        totalSales,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        avgTicketPrice: Math.round(totalRevenue / totalSales),
        revenuePerSeat: Math.round(totalRevenue / capacity)
      }
    })

    // Competitive analysis
    const competitiveInsights = {
      marketPosition: avgRevenue > 0 ? (totalProjectedRevenue / avgRevenue > 1.1 ? "Premium" : totalProjectedRevenue / avgRevenue < 0.9 ? "Value" : "Market Rate") : "Market Rate",
      priceAdvantage: avgPrice > 0 ? Math.round(((avgPrice - (totalProjectedRevenue / totalExpectedSales)) / avgPrice) * 100) : 0,
      occupancyBenchmark: avgOccupancy > 0 ? Math.round(((totalExpectedSales / capacity) / avgOccupancy) * 100) : 100,
      competitorCount: historicalEvents?.length || 0
    }

    // Revenue optimization recommendations
    const recommendations = [
      `Preço médio recomendado: R$ ${Math.round(totalProjectedRevenue / totalExpectedSales).toLocaleString()}`,
      `Meta de ocupação: ${Math.round((totalExpectedSales / capacity) * 100)}% (${totalExpectedSales.toLocaleString()} ingressos)`,
      `Receita projetada: R$ ${totalProjectedRevenue.toLocaleString()}`,
      competitiveInsights.marketPosition === "Premium" ? "Posicionamento premium identificado - considere experiências exclusivas" :
      competitiveInsights.marketPosition === "Value" ? "Oportunidade de preços competitivos - foque em volume" :
      "Preços alinhados com mercado - otimize mix de produtos",
      scenarioAnalysis[2].occupancyRate > 0.8 ? "Demanda forte detectada - considere preços premium" : 
      scenarioAnalysis[2].occupancyRate < 0.6 ? "Demanda moderada - implemente early bird e promoções" :
      "Demanda equilibrada - mantenha estratégia atual"
    ]

    // Marketing budget optimization
    const marketingROI = {
      recommendedBudget: Math.round(totalProjectedRevenue * 0.15), // 15% of projected revenue
      channelMix: {
        digital: 60,
        traditional: 25, 
        influencers: 15
      },
      expectedCPA: Math.round((totalProjectedRevenue * 0.15) / totalExpectedSales),
      breakeven: Math.round(totalExpectedSales * 0.7) // 70% of projected sales to break even
    }

    const response = {
      success: true,
      revenueProjection: {
        totalRevenue: totalProjectedRevenue,
        totalSales: totalExpectedSales,
        avgTicketPrice: Math.round(totalProjectedRevenue / totalExpectedSales),
        occupancyRate: Math.round((totalExpectedSales / capacity) * 100) / 100,
        revenuePerSeat: Math.round(totalProjectedRevenue / capacity)
      },
      pricingTiers: revenueProjections,
      scenarioAnalysis,
      competitiveInsights,
      recommendations,
      marketingROI,
      dataQuality: {
        historicalEvents: historicalEvents?.length || 0,
        segments: segmentData?.length || 0,
        confidence: (historicalEvents?.length || 0) > 5 ? "Alta" : (historicalEvents?.length || 0) > 2 ? "Média" : "Baixa"
      },
      timestamp: new Date().toISOString()
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in revenue analysis:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})