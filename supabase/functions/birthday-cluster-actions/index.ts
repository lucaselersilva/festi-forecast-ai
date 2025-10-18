import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BirthdayCustomer {
  customer_id: string;
  nome: string;
  email: string;
  telefone: string;
  aniversario: string;
  idade: number;
  consumo: number;
  presencas: number;
  recency_days: number;
  ultima_visita: string;
  cluster_comportamental: string;
  cluster_valor: string;
  faixa_etaria: string;
  propensity_score: number;
  genero: string;
  aplicativo_ativo: boolean;
  frequency: number;
  monetary: number;
}

interface Action {
  title: string;
  description: string;
  channel: string;
  timing: string;
  message_template: string;
  offer?: string;
  expected_conversion: number;
  cost_estimate?: string;
}

interface ClusterActions {
  overview: string;
  actions: Action[];
  key_insights: string[];
  recommended_offer: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { month, year } = await req.json();

    if (!month || !year) {
      throw new Error('Month and year are required');
    }

    // 1. Fetch birthday customers for the month
    const { data: customers, error: customersError } = await supabaseClient
      .rpc('get_birthday_customers_unified', {
        target_month: month,
        cluster_filter: null,
        age_range_filter: null
      });

    if (customersError) {
      throw customersError;
    }

    if (!customers || customers.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No birthday customers found for this month',
          clusters: [],
          actions: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Group customers by cluster or auto-cluster
    const clusters = groupByCluster(customers);

    // 3. Generate actions for each cluster using AI
    const allActions = [];
    for (const [clusterName, members] of Object.entries(clusters)) {
      const clusterAnalysis = analyzeCluster(clusterName, members, month, year);
      const actions = await generateActionsWithAI(clusterName, clusterAnalysis);
      
      // Save to database
      const { error: saveError } = await supabaseClient
        .from('birthday_cluster_actions')
        .upsert({
          month,
          year,
          cluster_name: clusterName,
          cluster_size: members.length,
          actions
        }, {
          onConflict: 'month,year,cluster_name'
        });

      if (saveError) {
        console.error('Error saving actions:', saveError);
      }

      allActions.push({
        cluster_name: clusterName,
        cluster_size: members.length,
        analysis: clusterAnalysis,
        actions
      });
    }

    return new Response(
      JSON.stringify({ 
        clusters,
        actions: allActions,
        total_customers: customers.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function groupByCluster(customers: BirthdayCustomer[]): Record<string, BirthdayCustomer[]> {
  const clusters: Record<string, BirthdayCustomer[]> = {};
  
  // Check if customers have pre-defined clusters
  const hasClusterInfo = customers.some(c => c.cluster_comportamental);
  
  if (hasClusterInfo) {
    // Group by existing clusters
    customers.forEach(customer => {
      const cluster = customer.cluster_comportamental || 'Sem Cluster';
      if (!clusters[cluster]) {
        clusters[cluster] = [];
      }
      clusters[cluster].push(customer);
    });
  } else {
    // Simple auto-clustering based on RFM characteristics
    customers.forEach(customer => {
      let clusterName = 'Potencial';
      
      if (customer.consumo > 1000 && customer.recency_days < 90) {
        clusterName = 'Alto Valor';
      } else if (customer.presencas >= 5 && customer.recency_days < 180) {
        clusterName = 'Fidelizados';
      } else if (customer.recency_days > 180) {
        clusterName = 'Inativos';
      }
      
      if (!clusters[clusterName]) {
        clusters[clusterName] = [];
      }
      clusters[clusterName].push(customer);
    });
  }
  
  return clusters;
}

function analyzeCluster(clusterName: string, members: BirthdayCustomer[], month: number, year: number) {
  const size = members.length;
  const avgSpending = members.reduce((sum, c) => sum + (c.consumo || 0), 0) / size;
  const avgRecency = members.reduce((sum, c) => sum + (c.recency_days || 0), 0) / size;
  const avgFrequency = members.reduce((sum, c) => sum + (c.presencas || 0), 0) / size;
  
  // Age distribution
  const ageGroups = members.reduce((acc, c) => {
    const age = c.faixa_etaria || 'Não informado';
    acc[age] = (acc[age] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const dominantAge = Object.entries(ageGroups).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Não informado';
  
  // Gender distribution
  const genderGroups = members.reduce((acc, c) => {
    const gender = c.genero || 'Não informado';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const dominantGender = Object.entries(genderGroups).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Não informado';
  
  // Active app %
  const activeAppCount = members.filter(c => c.aplicativo_ativo).length;
  const activeAppPercent = (activeAppCount / size) * 100;
  
  return {
    month,
    year,
    size,
    avgSpending,
    avgRecency,
    avgFrequency,
    dominantAge,
    dominantGender,
    activeAppPercent,
    clusterName
  };
}

async function generateActionsWithAI(clusterName: string, analysis: any): Promise<ClusterActions> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.warn('OpenAI API key not found, returning default actions');
    return generateDefaultActions(clusterName, analysis);
  }

  const prompt = `Você é um especialista em marketing de relacionamento para eventos e entretenimento.

CONTEXTO:
Estamos planejando campanhas de aniversário para o mês ${analysis.month}/${analysis.year}.

CLUSTER: ${clusterName}
- Tamanho: ${analysis.size} clientes
- Consumo médio: R$ ${analysis.avgSpending.toFixed(2)}
- Recência média: ${analysis.avgRecency.toFixed(0)} dias
- Presenças médias: ${analysis.avgFrequency.toFixed(1)}
- Faixa etária predominante: ${analysis.dominantAge}
- Gênero predominante: ${analysis.dominantGender}
- Com app ativo: ${analysis.activeAppPercent.toFixed(1)}%

OBJETIVO:
Gerar 5-7 ações específicas e criativas para reativar/engajar esses aniversariantes, aumentando a conversão e o ticket médio.

ESTRUTURE as ações considerando:
1. Canal de comunicação (WhatsApp, Email, SMS, Push, Presencial)
2. Timing (quando enviar em relação à data de aniversário)
3. Mensagem personalizada (use gatilhos emocionais adequados ao perfil)
4. Oferta/benefício (desconto, brinde, upgrade, acesso VIP, etc.)
5. Taxa de conversão esperada (%)

DIRETRIZES:
- Seja criativo e específico para o perfil do cluster
- Use linguagem adequada à faixa etária
- Considere o nível de engajamento (recência)
- Para inativos: ênfase em reativação e escassez
- Para fidelizados: exclusividade e gratidão
- Para alto valor: experiências premium
- Inclua mensagens prontas para copiar
- Considere custo-benefício das ações`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Você é um especialista em marketing de relacionamento.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_birthday_actions',
            description: 'Gera ações de marketing para aniversariantes de um cluster',
            parameters: {
              type: 'object',
              properties: {
                overview: { 
                  type: 'string',
                  description: 'Visão geral da estratégia para o cluster'
                },
                actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      channel: { 
                        type: 'string',
                        enum: ['WhatsApp', 'Email', 'SMS', 'Push Notification', 'Presencial', 'Redes Sociais']
                      },
                      timing: { type: 'string' },
                      message_template: { type: 'string' },
                      offer: { type: 'string' },
                      expected_conversion: { type: 'number' },
                      cost_estimate: { type: 'string' }
                    },
                    required: ['title', 'description', 'channel', 'timing', 'message_template', 'expected_conversion']
                  }
                },
                key_insights: {
                  type: 'array',
                  items: { type: 'string' }
                },
                recommended_offer: { type: 'string' }
              },
              required: ['overview', 'actions', 'key_insights']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_birthday_actions' } }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (toolCall && toolCall.function.name === 'create_birthday_actions') {
      return JSON.parse(toolCall.function.arguments);
    }

    return generateDefaultActions(clusterName, analysis);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return generateDefaultActions(clusterName, analysis);
  }
}

function generateDefaultActions(clusterName: string, analysis: any): ClusterActions {
  // Fallback default actions based on cluster characteristics
  const baseActions: Action[] = [
    {
      title: 'Email de Aniversário Personalizado',
      description: 'Enviar email comemorativo com oferta especial',
      channel: 'Email',
      timing: '7 dias antes',
      message_template: `Olá {nome}! 🎉\n\nSeu aniversário está chegando e preparamos algo especial para você!\n\nComemore conosco e ganhe benefícios exclusivos.\n\nAté breve!`,
      offer: 'Desconto de 20% em ingressos',
      expected_conversion: 15,
      cost_estimate: 'Baixo'
    },
    {
      title: 'WhatsApp no Dia',
      description: 'Mensagem de felicitações no dia do aniversário',
      channel: 'WhatsApp',
      timing: 'No dia do aniversário',
      message_template: `🎂 Feliz Aniversário, {nome}!\n\nQueremos celebrar esse dia especial com você!\n\nVenha nos visitar e receba um brinde especial! 🎁`,
      expected_conversion: 25,
      cost_estimate: 'Baixo'
    }
  ];

  return {
    overview: `Estratégia para o cluster ${clusterName} com ${analysis.size} clientes. Foco em engajamento e conversão.`,
    actions: baseActions,
    key_insights: [
      `Consumo médio: R$ ${analysis.avgSpending.toFixed(2)}`,
      `Recência média: ${analysis.avgRecency.toFixed(0)} dias`,
      `${analysis.activeAppPercent.toFixed(1)}% com app ativo`
    ],
    recommended_offer: 'Desconto progressivo baseado no histórico'
  };
}