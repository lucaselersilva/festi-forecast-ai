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
    const { genre, city, targetRevenue, capacity, date } = body

    console.log('Pricing request:', { genre, city, targetRevenue, capacity, date })

    // Query similar events for pricing benchmarks
    const { data: analogData, error: analogError } = await supabase
      .from('vw_event_analogs')
      .select('*')
      .eq('genre', genre)
      .eq('city', city)
      .order('capacity', { ascending: false })
      .limit(10)

    console.log('Found pricing analogs:', analogData?.length || 0)

    // Calculate pricing recommendations
    const basePrice = analogData?.reduce((sum: number, event: any) => sum + (event.avg_price || 0), 0) / (analogData?.length || 1) || 100
    const avgOccupancy = analogData?.reduce((sum: number, event: any) => sum + (event.occupancy_rate || 0), 0) / (analogData?.length || 1) || 0.7

    const recommendations = [
      {
        tier: 'Básico',
        price: Math.floor(basePrice * 0.8),
        expectedSales: Math.floor(capacity * avgOccupancy * 0.6),
        revenue: Math.floor(basePrice * 0.8 * capacity * avgOccupancy * 0.6),
        confidence: 0.8
      },
      {
        tier: 'Padrão',
        price: Math.floor(basePrice),
        expectedSales: Math.floor(capacity * avgOccupancy * 0.8),
        revenue: Math.floor(basePrice * capacity * avgOccupancy * 0.8),
        confidence: 0.9
      },
      {
        tier: 'Premium',
        price: Math.floor(basePrice * 1.3),
        expectedSales: Math.floor(capacity * avgOccupancy * 0.5),
        revenue: Math.floor(basePrice * 1.3 * capacity * avgOccupancy * 0.5),
        confidence: 0.6
      }
    ]

    const response = {
      success: true,
      recommendations,
      marketData: {
        averagePrice: Math.floor(basePrice),
        averageOccupancy: Math.floor(avgOccupancy * 100),
        competitorCount: analogData?.length || 0
      },
      timestamp: new Date().toISOString()
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in sponsorship pricing:', error)
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