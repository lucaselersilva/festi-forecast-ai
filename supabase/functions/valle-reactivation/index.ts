import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
        let strategyData;
        
        if (openaiKey) {
          try {
            strategyData = await generateStrategyWithAI(cluster, openaiKey);
            console.log(`✅ AI strategy generated for ${cluster.cluster_comportamental}`);
          } catch (error) {
            console.error(`⚠️ AI failed for ${cluster.cluster_comportamental}, using default:`, error);
            strategyData = generateDefaultStrategy(cluster);
          }
        } else {
          console.log(`⚠️ No OpenAI key, using default strategy for ${cluster.cluster_comportamental}`);
          strategyData = generateDefaultStrategy(cluster);
        }
        
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

async function generateStrategyWithAI(cluster: any, openaiKey: string) {
  const prompt = `Você é um estrategista de CRM e fidelização para eventos musicais no Brasil.

Recebeu informações sobre um grupo de clientes:

**Cluster: ${cluster.cluster_comportamental}**
- Tamanho: ${cluster.total_clientes} clientes
- Consumo médio: R$ ${cluster.consumo_medio?.toFixed(2) || '0'}
- Presenças média: ${cluster.presencas_media?.toFixed(1) || '0'}
- Recência média: ${cluster.recencia_media?.toFixed(0) || '0'} dias
- Propensão média: ${(cluster.propensity_media * 100)?.toFixed(0) || '0'}%

Analise o perfil comportamental e crie uma estratégia de reativação personalizada.

Descubra o motivo provável da inatividade ou comportamento deste grupo e crie:

1. **Título da estratégia** (curto e inspirador)
2. **Descrição da estratégia** (como abordar este perfil especificamente)
3. **Template de mensagem** (texto completo, humanizado, com emojis, placeholders [Nome] e [link])
4. **Canal recomendado** (WhatsApp para urgência, Email para storytelling, Push para lembretes)
5. **Taxa de conversão esperada** (entre 0 e 1, realista para este perfil)
6. **Prioridade** (1=urgente, 2=importante, 3=moderado, 4=baixo)

Adapte o tom ao perfil:
- **VIPs/Alto Valor**: exclusivo, sofisticado, privilégios únicos
- **Frequentes**: próximo, "você é de casa", nostalgia
- **Econômicos**: claro, direto, benefício tangível
- **Inativos/Risco**: acolhedor, "sentimos sua falta", incentivo forte
- **Novatos**: entusiasta, descoberta, primeira experiência

Exemplo de mensagem humanizada:
"Faz tempo que não te vejo na pista! 👀 Tem um novo evento que é a sua cara — e um desconto especial até amanhã. Bora viver isso de novo? 🎉"

Retorne JSON válido.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em marketing de reativação para eventos. Responda sempre com JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResult = JSON.parse(data.choices[0].message.content);

  return {
    cluster_comportamental: cluster.cluster_comportamental,
    strategy_title: aiResult.strategy_title || aiResult.titulo || 'Estratégia de Reativação',
    strategy_description: aiResult.strategy_description || aiResult.descricao || aiResult.description || 'Reativar clientes do cluster',
    message_template: aiResult.message_template || aiResult.mensagem || aiResult.template || 'Olá [Nome]! Temos novidades para você.',
    recommended_channel: aiResult.recommended_channel || aiResult.canal || 'WhatsApp',
    expected_conversion_rate: aiResult.expected_conversion_rate || aiResult.conversao || 0.3,
    priority: aiResult.priority || aiResult.prioridade || 3,
  };
}

function generateDefaultStrategy(cluster: any) {
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
