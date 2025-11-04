import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventData {
  event_name: string;
  event_date: string;
  event_city: string;
  event_venue?: string;
  event_genre: string;
  target_audience: string;
  capacity: number;
  ticket_price: number;
  budget: number;
  description?: string;
}

interface ClusterData {
  cluster_comportamental: string;
  total_clientes: number;
  consumo_medio: number;
  presencas_media: number;
  recency_media: number;
  generos: string[];
  faixas_etarias: string[];
  com_app_ativo: number;
  propensity_media: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const eventData: EventData = await req.json();
    
    // Get user's tenant_id from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized: ' + (userError?.message || 'No user found'));
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Tenant not found for user');
    }

    const tenantId = profile.tenant_id;

    // Validar dados básicos
    if (!eventData.event_name || !eventData.event_date || !eventData.event_city) {
      throw new Error("Dados obrigatórios ausentes");
    }

    // 1. Verificar histórico de eventos na cidade
    const { data: cityEvents, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq('tenant_id', tenantId)
      .ilike("city", eventData.event_city)
      .limit(10);

    if (eventsError) {
      console.error("Erro ao buscar eventos:", eventsError);
    }

    // 2. Buscar clusters se houver histórico
    let clusterData: ClusterData[] = [];
    if (cityEvents && cityEvents.length > 0) {
      const { data: clusters, error: clustersError } = await supabase
        .from("vw_valle_cluster_analysis")
        .select("*")
        .eq('tenant_id', tenantId);

      if (!clustersError && clusters) {
        clusterData = clusters as ClusterData[];
      }
    }

    // 3. Calcular dias até o evento
    const eventDate = new Date(eventData.event_date);
    const today = new Date();
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 4. Montar prompt contextualizado
    const systemPrompt = `Você é um estrategista de marketing especializado em eventos musicais e entretenimento noturno no Brasil. Seu trabalho é criar planos completos e realistas que inspirem ação.

Quando receber informações sobre um evento - nome, data, cidade, gênero musical, histórico de vendas, clusters de clientes ou orçamento - use o que estiver disponível. Se algum dado faltar, não invente nada. Apenas explique naturalmente, por exemplo: "não temos informação sobre o orçamento, mas baseado no restante dos dados...".

Seu plano deve fluir como uma conversa entre consultor e cliente. Organize em partes naturais:
- Visão geral inspiradora do evento (1 frase que capture a essência)
- Fases do plano (pré-lançamento, lançamento, engajamento, último chamado) com datas aproximadas quando houver
- Ações recomendadas e por quê funcionam
- Canais ideais e tom de comunicação apropriado
- Distribuição de orçamento quando disponível
- Mensagem central da campanha

Mantenha o tom humano, otimista e estratégico. Evite jargões técnicos - transforme números e scores em ações compreensíveis. Considere o contexto cultural brasileiro, público jovem/adulto, comunicação leve e inteligente.

Seu objetivo final é transformar dados em insights aplicáveis e inspiradores para o dono do evento executar o plano com confiança.`;

    let userPrompt = `Vou te passar as informações disponíveis sobre este evento. Use o que tiver para criar o melhor plano possível.

O evento se chama "${eventData.event_name}" e acontecerá em ${eventData.event_date} na cidade de ${eventData.event_city}${eventData.event_venue ? `, no local ${eventData.event_venue}` : ''}.

${eventData.capacity ? `Esperamos cerca de ${eventData.capacity} pessoas.` : 'Ainda não temos estimativa de público.'}

${eventData.event_genre ? `O gênero musical é ${eventData.event_genre}.` : ''}

${eventData.budget ? `O orçamento de marketing disponível é de R$ ${eventData.budget}.` : 'Não temos orçamento definido ainda, mas sugira uma distribuição ideal.'}

${daysUntil <= 15 ? `⚠️ Atenção: faltam apenas ${daysUntil} dias! O plano precisa focar em conversão urgente através de WhatsApp e Push, criar senso de urgência (medo de ficar de fora), e ativar o público que já demonstrou interesse.` : 
  daysUntil <= 30 ? `Temos ${daysUntil} dias - um prazo moderado. Há tempo para construir desejo mas também precisamos de conversão.` : 
  `Temos ${daysUntil} dias - tempo suficiente para uma campanha completa com antecipação e construção de expectativa.`}
${eventData.description ? `\n\nSobre o evento: ${eventData.description}` : ''}`;

    // Adicionar informações históricas da cidade se houver
    if (cityEvents && cityEvents.length > 0) {
      const avgOccupancy = cityEvents.reduce((acc, e) => acc + ((e.tickets_sold || 0) / (e.capacity || 1)), 0) / cityEvents.length;
      userPrompt += `\n\nSobre a cidade ${eventData.event_city}: já realizamos ${cityEvents.length} eventos similares aqui, com ocupação média de ${(avgOccupancy * 100).toFixed(0)}%. Use esse histórico para entender o comportamento do público local e adaptar a estratégia.`;
    }

    // Adicionar informações de clusters se houver
    if (clusterData.length > 0) {
      userPrompt += `\n\nSobre os clientes que já temos na base:\n`;
      
      clusterData.forEach(cluster => {
        userPrompt += `\n• **${cluster.cluster_comportamental}** (${cluster.total_clientes} pessoas): gastam em média R$ ${cluster.consumo_medio?.toFixed(2)}, comparecem a ${cluster.presencas_media?.toFixed(1)} eventos, última visita há ${cluster.recency_media?.toFixed(0)} dias. ${cluster.com_app_ativo > 0 ? `${cluster.com_app_ativo} têm o app ativo.` : ''}`;
      });
      
      userPrompt += `\n\nUse esses perfis para personalizar as mensagens e escolher os canais certos para cada grupo.`;
    }

    userPrompt += `\n\nAgora crie um plano de marketing que seja inspirador, prático e focado em resultados reais.`;

    // 5. Chamar OpenAI com tool calling
    const tools = [{
      type: "function",
      function: {
        name: "create_marketing_plan",
        description: "Estrutura um plano de marketing completo",
        parameters: {
          type: "object",
          properties: {
            general_strategy: {
              type: "object",
              properties: {
                overview: { type: "string" },
                key_messages: { type: "array", items: { type: "string" } },
                channels: { type: "array", items: { type: "string" } },
                budget_allocation: { type: "object", additionalProperties: { type: "number" } }
              },
              required: ["overview", "key_messages", "channels", "budget_allocation"]
            },
            phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase_number: { type: "integer" },
                  phase_name: { type: "string" },
                  start_date: { type: "string" },
                  end_date: { type: "string" },
                  objective: { type: "string" },
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        channel: { type: "string" },
                        message: { type: "string" },
                        timing: { type: "string" },
                        kpi: { type: "string" }
                      },
                      required: ["action", "channel", "message", "timing", "kpi"]
                    }
                  }
                },
                required: ["phase_number", "phase_name", "start_date", "end_date", "objective", "actions"]
              }
            }
          },
          required: ["general_strategy", "phases"]
        }
      }
    }];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools,
        tool_choice: { type: "function", function: { name: "create_marketing_plan" } },
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const toolCall = result.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("Nenhum plano foi gerado");
    }

    const plan = JSON.parse(toolCall.function.arguments);

    // 6. Gerar estratégias por cluster se houver
    let clusterStrategies = null;
    if (clusterData.length > 0) {
      const clusterPrompt = `Com base no plano geral de marketing, crie estratégias PERSONALIZADAS para cada cluster:

CLUSTERS:
${clusterData.map(c => `- ${c.cluster_comportamental}: ${c.total_clientes} clientes`).join('\n')}

Para CADA cluster, retorne um objeto com:
- cluster_name: nome do cluster
- cluster_size: número de clientes
- personalized_messages: array com 3-5 mensagens personalizadas
- recommended_channels: array com canais prioritários
- emotional_triggers: array com gatilhos emocionais específicos
- expected_conversion: número (porcentagem esperada)`;

      const clusterResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: clusterPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        }),
      });

      if (clusterResponse.ok) {
        const clusterResult = await clusterResponse.json();
        const content = clusterResult.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          clusterStrategies = parsed.clusters || parsed.cluster_strategies || [];
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...plan,
          cluster_strategies: clusterStrategies,
          has_city_history: cityEvents && cityEvents.length > 0,
          days_until_event: daysUntil
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao gerar plano de marketing";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
