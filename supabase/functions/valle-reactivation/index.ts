import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    if (action === 'generate_strategies') {
      // Get cluster analysis
      const { data: clusters, error: clustersError } = await supabase
        .from('vw_valle_cluster_analysis')
        .select('*');

      if (clustersError) throw clustersError;

      console.log(`📊 Generating strategies for ${clusters.length} clusters`);

      const strategies = [];

      for (const cluster of clusters) {
        const strategyData = generateStrategyForCluster(cluster);
        strategies.push(strategyData);
      }

      // Delete existing strategies
      await supabase.from('valle_reactivation_strategies').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert new strategies
      const { error: insertError } = await supabase
        .from('valle_reactivation_strategies')
        .insert(strategies);

      if (insertError) throw insertError;

      console.log(`✅ Created ${strategies.length} reactivation strategies`);

      return new Response(
        JSON.stringify({
          success: true,
          strategies_created: strategies.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in valle-reactivation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateStrategyForCluster(cluster: any) {
  const clusterName = cluster.cluster_comportamental;
  const avgConsumption = cluster.consumo_medio;
  const avgPresences = cluster.presencas_media;
  const propensityScore = cluster.propensity_media;

  const strategies: Record<string, any> = {
    'VIPs / High Rollers': {
      strategy_title: 'Programa VIP Exclusivo',
      strategy_description: 'Oferecer experiências premium e acesso antecipado a eventos especiais para manter o alto engajamento',
      message_template: `🌟 Olá, [Nome]!

Como nosso cliente VIP, temos uma oferta exclusiva para você:

✨ Acesso prioritário ao próximo evento
🎁 Desconto de 20% em consumação
👥 Convites para amigos

Sua presença é especial para nós!

Reserve agora: [link]`,
      recommended_channel: 'WhatsApp',
      expected_conversion_rate: 0.75,
      priority: 1,
    },
    'Frequentes Econômicos': {
      strategy_title: 'Upgrade para Premium',
      strategy_description: 'Incentivar aumento de ticket médio com combos e pacotes especiais',
      message_template: `🎯 Ei, [Nome]!

Notamos que você é um frequentador assíduo! 

Que tal aproveitar nosso combo especial?
🍻 2 bebidas + 1 petisco = R$ [valor]
💰 Economia de 30%

Válido para os próximos 3 eventos!

Ativar combo: [link]`,
      recommended_channel: 'Push',
      expected_conversion_rate: 0.45,
      priority: 2,
    },
    'Ocasional Premium': {
      strategy_title: 'Eventos Premium Selecionados',
      strategy_description: 'Curadoria de eventos especiais que correspondem ao perfil de alto consumo',
      message_template: `💎 [Nome], evento especial só para você!

Sabemos que você aprecia experiências únicas.

🎭 [Nome do Evento]
📅 [Data]
⭐ Line-up premium
🍾 Open bar incluído

Vagas limitadas - garanta a sua!

Reservar: [link]`,
      recommended_channel: 'Email',
      expected_conversion_rate: 0.60,
      priority: 3,
    },
    'Dormientes / Risco de churn': {
      strategy_title: 'Campanha Volte Para Casa',
      strategy_description: 'Reativação urgente com benefícios especiais e abordagem emocional',
      message_template: `❤️ Sentimos sua falta, [Nome]!

Faz tempo que você não nos visita...

🎁 PRESENTE ESPECIAL DE VOLTA:
• Entrada gratuita no próximo evento
• Drink de cortesia
• Desconto de 50% na consumação

A casa não é a mesma sem você!

Resgatar presente: [link]`,
      recommended_channel: 'WhatsApp',
      expected_conversion_rate: 0.25,
      priority: 1,
    },
    'Novatos': {
      strategy_title: 'Programa de Boas-Vindas',
      strategy_description: 'Onboarding personalizado para converter novos visitantes em clientes recorrentes',
      message_template: `🎉 Bem-vindo(a), [Nome]!

Foi ótimo te receber! Para sua próxima visita:

🎁 20% de desconto
📱 Baixe nosso app e ganhe mais 10%
🎵 Escolha seu estilo musical favorito

Seus próximos eventos recomendados:
[Lista de eventos]

Ver eventos: [link]`,
      recommended_channel: 'Email',
      expected_conversion_rate: 0.55,
      priority: 2,
    },
    'Ocasional Regular': {
      strategy_title: 'Programa de Fidelidade',
      strategy_description: 'Gamificação e recompensas para aumentar frequência de visitas',
      message_template: `🎮 [Nome], você está quase no próximo nível!

Faltam apenas [X] presenças para desbloquear:
⭐ Desconto permanente de 15%
🎁 Brindes exclusivos
👥 Convites para amigos

Seu progresso: [barra]

Próximos eventos: [link]`,
      recommended_channel: 'Push',
      expected_conversion_rate: 0.50,
      priority: 3,
    },
  };

  const defaultStrategy = {
    strategy_title: 'Engajamento Padrão',
    strategy_description: 'Estratégia de manutenção de relacionamento',
    message_template: 'Olá [Nome], confira nossos próximos eventos!',
    recommended_channel: 'Email',
    expected_conversion_rate: 0.30,
    priority: 4,
  };

  const strategy = strategies[clusterName] || defaultStrategy;

  return {
    cluster_comportamental: clusterName,
    ...strategy,
  };
}
