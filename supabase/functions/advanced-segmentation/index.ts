import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { genre, city, capacity, customFactors } = await req.json();
    
    console.log('Advanced segmentation request:', { genre, city, capacity, customFactors });

    // Query RFM data and consumption patterns
    const { data: rfmData, error: rfmError } = await supabaseClient
      .from('vw_customer_rfm')
      .select('*')
      .limit(1000);

    if (rfmError) {
      console.error('RFM query error:', rfmError);
    }

    const { data: consumptionData, error: consumptionError } = await supabaseClient
      .from('vw_segment_consumption')
      .select('*')
      .eq('genre', genre)
      .eq('city', city);

    if (consumptionError) {
      console.error('Consumption query error:', consumptionError);
    }

    // Generate dynamic segments based on custom factors
    const segments = generateDynamicSegments(rfmData || [], customFactors);
    
    // Create consumption projections per segment
    const segmentProjections = segments.map(segment => {
      const baseConsumption = consumptionData?.[0] || getDefaultConsumption();
      
      return {
        ...segment,
        projectedAttendance: Math.floor(capacity * segment.marketShare),
        avgTicketSpend: segment.priceSensitivity * baseConsumption.avg_ticket_spend || 120,
        avgBarSpend: segment.consumptionIndex * baseConsumption.avg_bar_spend || 80,
        conversionRate: segment.conversionRate,
        marketingChannels: getOptimalChannels(segment),
        messaging: getSegmentMessaging(segment),
      };
    });

    return new Response(JSON.stringify({
      success: true,
      segments: segmentProjections,
      summary: {
        totalSegments: segments.length,
        projectedAttendance: segmentProjections.reduce((sum, s) => sum + s.projectedAttendance, 0),
        avgTicketPrice: segmentProjections.reduce((sum, s) => sum + s.avgTicketSpend, 0) / segments.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Advanced segmentation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateDynamicSegments(rfmData: any[], customFactors: any = {}) {
  const { 
    ageGroups = true, 
    frequencyTiers = true, 
    consumptionLevels = true,
    genderSegments = false 
  } = customFactors;

  const baseSegments = [
    {
      id: 'champions',
      name: 'Champions',
      description: 'Frequent, high-value customers',
      marketShare: 0.15,
      priceSensitivity: 1.3,
      consumptionIndex: 1.5,
      conversionRate: 0.85,
      characteristics: ['High frequency', 'High value', 'Low churn risk']
    },
    {
      id: 'loyal',
      name: 'Loyal Customers',
      description: 'Regular attendees with good value',
      marketShare: 0.25,
      priceSensitivity: 1.1,
      consumptionIndex: 1.2,
      conversionRate: 0.75,
      characteristics: ['Regular attendance', 'Stable spending', 'Brand loyal']
    },
    {
      id: 'potential',
      name: 'Potential Loyalists',
      description: 'Recent customers with growth potential',
      marketShare: 0.30,
      priceSensitivity: 0.9,
      consumptionIndex: 1.0,
      conversionRate: 0.60,
      characteristics: ['Recent customers', 'Growing engagement', 'Price sensitive']
    },
    {
      id: 'new',
      name: 'New Customers',
      description: 'First-time attendees',
      marketShare: 0.30,
      priceSensitivity: 0.7,
      consumptionIndex: 0.8,
      conversionRate: 0.45,
      characteristics: ['First-time buyers', 'Need nurturing', 'High potential']
    }
  ];

  // Apply custom factor modulations
  if (ageGroups) {
    return baseSegments.flatMap(segment => [
      {
        ...segment,
        id: segment.id + '_young',
        name: segment.name + ' (18-25)',
        marketShare: segment.marketShare * 0.4,
        priceSensitivity: segment.priceSensitivity * 0.8,
        consumptionIndex: segment.consumptionIndex * 1.1,
        characteristics: [...segment.characteristics, 'Social media active', 'Group-oriented']
      },
      {
        ...segment,
        id: segment.id + '_adult',
        name: segment.name + ' (26-40)',
        marketShare: segment.marketShare * 0.6,
        priceSensitivity: segment.priceSensitivity * 1.1,
        consumptionIndex: segment.consumptionIndex * 1.0,
        characteristics: [...segment.characteristics, 'Quality focused', 'Experience seekers']
      }
    ]);
  }

  return baseSegments;
}

function getDefaultConsumption() {
  return {
    avg_ticket_spend: 120,
    avg_bar_spend: 80,
    avg_frequency: 2.5
  };
}

function getOptimalChannels(segment: any) {
  const channelMix: { [key: string]: number } = {};
  
  if (segment.id.includes('young')) {
    channelMix.instagram = 40;
    channelMix.tiktok = 30;
    channelMix.whatsapp = 20;
    channelMix.email = 10;
  } else {
    channelMix.facebook = 30;
    channelMix.email = 25;
    channelMix.whatsapp = 25;
    channelMix.instagram = 20;
  }

  return channelMix;
}

function getSegmentMessaging(segment: any) {
  const messages: { [key: string]: string[] } = {
    champions: [
      "Experiência VIP exclusiva",
      "Acesso antecipado e benefícios especiais",
      "Reconhecimento como fã verdadeiro"
    ],
    loyal: [
      "Sua marca favorita está de volta",
      "Desconto especial para fãs fiéis",
      "Reserve seu lugar garantido"
    ],
    potential: [
      "Descubra por que tantos fãs amam",
      "Primeira vez? Oferta especial",
      "Junte-se à comunidade"
    ],
    new: [
      "Bem-vindo à experiência única",
      "Desconto de estreia",
      "Descubra o que está perdendo"
    ]
  };

  const baseKey = segment.id.replace('_young', '').replace('_adult', '');
  return messages[baseKey] || messages.new;
}