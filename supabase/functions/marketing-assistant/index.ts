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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const eventData: EventData = await req.json();

    // Validar dados básicos
    if (!eventData.event_name || !eventData.event_date || !eventData.event_city) {
      throw new Error("Dados obrigatórios ausentes");
    }

    // 1. Verificar histórico de eventos na cidade
    const { data: cityEvents, error: eventsError } = await supabase
      .from("events")
      .select("*")
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
        .select("*");

      if (!clustersError && clusters) {
        clusterData = clusters as ClusterData[];
      }
    }

    // 3. Calcular dias até o evento
    const eventDate = new Date(eventData.event_date);
    const today = new Date();
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 4. Montar prompt contextualizado
    const systemPrompt = `Você é um especialista em marketing para eventos de entretenimento no Brasil, com profundo conhecimento em:

1. Funil de Vendas para Eventos: awareness → interest → desire → action
2. Storytelling Emocional: criar narrativas que conectam emocionalmente
3. Gatilhos Psicológicos: escassez, urgência, prova social, autoridade, reciprocidade
4. Segmentação Comportamental: adaptar mensagens por perfil de cliente
5. Marketing Digital: Instagram, WhatsApp, Facebook, Google Ads
6. Otimização de Orçamento: ROI, CAC, LTV

Sua missão é criar planos de marketing personalizados, práticos e executáveis que maximizem vendas de ingressos.

DIRETRIZES:
- Linguagem envolvente e criativa
- Mensagens curtas com emojis sutis (1-2 por mensagem)
- Foco em ação e urgência
- KPIs mensuráveis e realistas
- Considere o contexto brasileiro (feriados, payday, comportamento local)`;

    let userPrompt = `Crie um plano de marketing completo para:

INFORMAÇÕES DO EVENTO:
- Nome: ${eventData.event_name}
- Data: ${eventData.event_date} (faltam ${daysUntil} dias)
- Cidade: ${eventData.event_city}
- Local: ${eventData.event_venue || 'A definir'}
- Gênero Musical: ${eventData.event_genre}
- Público-Alvo: ${eventData.target_audience}
- Capacidade: ${eventData.capacity} pessoas
- Preço Médio: R$ ${eventData.ticket_price}
- Orçamento Marketing: R$ ${eventData.budget}
${eventData.description ? `\nDESCRIÇÃO: ${eventData.description}` : ''}`;

    // Adicionar informações de clusters
    if (clusterData.length > 0) {
      userPrompt += `\n\n🎯 ANÁLISE DE PÚBLICO (Baseada em eventos anteriores na cidade):\n`;
      
      clusterData.forEach(cluster => {
        userPrompt += `\n**${cluster.cluster_comportamental}** - ${cluster.total_clientes} clientes
- Consumo médio: R$ ${cluster.consumo_medio?.toFixed(2)}
- Presença média: ${cluster.presencas_media} eventos
- Recency: ${cluster.recency_media} dias desde última visita
- Gêneros preferidos: ${cluster.generos?.join(', ') || 'Variados'}
- Faixas etárias: ${cluster.faixas_etarias?.join(', ') || 'Diversas'}
- Com app ativo: ${cluster.com_app_ativo} clientes
- Propensity score médio: ${cluster.propensity_media?.toFixed(2)}
`;
      });
      
      userPrompt += `\n✅ IMPORTANTE: Crie estratégias personalizadas para cada cluster acima.`;
    }

    // Adicionar urgência se necessário
    if (daysUntil < 14) {
      userPrompt += `\n\n⚠️ URGÊNCIA: Evento em menos de 2 semanas! 
- Compacte as fases do plano
- Enfatize escassez e urgência em TODAS as mensagens
- Priorize canais de resposta rápida (WhatsApp, Stories)
- Ações devem ser executáveis IMEDIATAMENTE`;
    } else if (daysUntil > 60) {
      userPrompt += `\n\n📅 PLANEJAMENTO EXTENSO: Mais de 2 meses até o evento
- Crie mais fases (5-7 fases)
- Inclua fase de "Antecipação" e "Teasers"
- Construa storytelling progressivo
- Trabalhe awareness e interesse antes da conversão`;
    }

    userPrompt += `\n\nESTRUTURE O PLANO COM:

1. **Estratégia Geral:**
   - Overview executivo (2-3 parágrafos)
   - 5-7 mensagens-chave do evento
   - Canais prioritários
   - Alocação de orçamento por canal (%)

2. **Fases do Plano (Timeline):**
   - Divida em ${daysUntil < 14 ? '3-4' : daysUntil < 30 ? '4-5' : '5-7'} fases
   - Cada fase com nome criativo, período, objetivo e ações específicas`;

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
