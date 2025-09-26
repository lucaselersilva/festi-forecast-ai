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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { genre, city, targetRevenue, capacity, date, sponsorBudget } = body

    console.log('Forecast request:', { genre, city, targetRevenue, capacity, date, sponsorBudget })

    // Query segment forecast data
    const { data: segmentData, error: segmentError } = await supabase
      .from('vw_segment_forecast')
      .select('*')
      .eq('genre', genre)
      .eq('city', city)
      .single()

    if (segmentError) {
      console.log('No segment data found, using defaults')
    }

    // Query event analogs for similar events
    const { data: analogData, error: analogError } = await supabase
      .from('vw_event_analogs')
      .select('*')
      .eq('genre', genre)
      .eq('city', city)
      .order('capacity', { ascending: false })
      .limit(5)

    console.log('Found analog events:', analogData?.length || 0)

    // Calculate predictions based on available data
    const baseConversion = segmentData?.estimated_conversion_rate || 0.15
    const avgSpend = segmentData?.expected_spend_per_customer || 150
    const analogAvgRevenue = analogData?.reduce((sum: number, event: any) => sum + (event.revenue || 0), 0) / (analogData?.length || 1) || targetRevenue * 0.7

    const predictions = {
      expectedAttendance: Math.min(capacity, Math.floor(targetRevenue / avgSpend * baseConversion)),
      revenueConfidence: (analogData?.length || 0) > 2 ? 0.8 : 0.6,
      marketingEfficiency: sponsorBudget > 0 ? targetRevenue / sponsorBudget : 0,
      competitivePosition: analogAvgRevenue > 0 ? targetRevenue / analogAvgRevenue : 1,
      riskFactors: [
        ...((analogData?.length || 0) < 2 ? ['Limited historical data'] : []),
        ...(baseConversion < 0.1 ? ['Low conversion rate'] : []),
        ...(capacity < 1000 ? ['Small venue capacity'] : [])
      ]
    }

    const insights = {
      marketOverview: `Analysis for ${genre} events in ${city}`,
      audienceProfile: segmentData ? {
        segment: 'Champions',
        avgSpend: segmentData.avg_ticket_spend || 100,
        frequency: 3.2,
        totalCustomers: segmentData.customers || 1000
      } : {
        segment: 'Mixed',
        avgSpend: 100,
        frequency: 2.5,
        totalCustomers: 500
      },
      recommendations: [
        `Target marketing budget: R$ ${Math.floor(sponsorBudget * 0.7).toLocaleString()}`,
        `Expected attendance: ${predictions.expectedAttendance} people`,
        `Revenue confidence: ${(predictions.revenueConfidence * 100).toFixed(0)}%`,
        ...(predictions.riskFactors.length > 0 ? [`Risk factors: ${predictions.riskFactors.join(', ')}`] : [])
      ]
    }

    // Also include revenue insights for integrated analysis
    const avgTicketPrice = analogData?.reduce((sum: number, event: any) => sum + (event.avg_price || 0), 0) / (analogData?.length || 1) || 100
    const revenueInsights = {
      recommendedTicketPrice: Math.round(avgTicketPrice),
      projectedTicketRevenue: predictions.expectedAttendance * avgTicketPrice,
      totalEventRevenue: (predictions.expectedAttendance * avgTicketPrice) + (sponsorBudget || 0),
      sponsorshipPercentage: sponsorBudget > 0 ? Math.round((sponsorBudget / ((predictions.expectedAttendance * avgTicketPrice) + sponsorBudget)) * 100) : 0
    }

    const response = {
      success: true,
      predictions,
      insights,
      revenueInsights,
      timestamp: new Date().toISOString()
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in sponsorship forecast:', error)
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