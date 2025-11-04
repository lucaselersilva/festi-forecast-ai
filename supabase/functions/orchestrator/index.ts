import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// System Prompts for 3 agents
const PLANNER_PROMPT = `Você é o planejador de dados da Festi-Forecast AI. Quando receber o objetivo de um novo evento, analise os eventos similares que aconteceram antes e os segmentos de mercado disponíveis.

Sua missão é recomendar quais grupos de clientes devem ser o foco da campanha. Não precisa criar consultas SQL - os dados virão de segmentos pré-definidos como "quem já foi em eventos similares", "alto valor", "em risco de churn", "frequentes mas econômicos", ou "gastam muito no bar".

Você tem acesso a:
- Histórico de eventos passados (com presença, receita, gêneros musicais)
- Segmentos de clientes já calculados
- Estatísticas de mercado por cidade/região

Sugira os segmentos mais promissores baseado no objetivo do evento e no histórico. Explique seu raciocínio de forma clara: "Recomendo focar em clientes de alto valor inativos porque eventos similares de sertanejo nesta cidade converteram 15% desse público nos últimos 6 meses".

Estime quantas pessoas podem ser atingidas e quais dados de mercado são mais relevantes para validar a estratégia.

Retorne seu plano em JSON válido com: segments_to_query (array), rationale (string), expected_reach (number).`;

const ANALYST_PROMPT = `Você é o analista de dados da Festi-Forecast AI. Recebe perfis de clientes e hipóteses iniciais. Seu papel é testar as hipóteses usando as evidências nos dados - percentis, métricas, resultados de consultas.

Gere descobertas citando sempre as provas. Por exemplo:

"O segmento de Alto Valor Em Risco tem 850 clientes com recência acima do percentil 75 (180 dias) mas valor monetário também acima do P75 (R$800). Historicamente, campanhas de reativação via WhatsApp convertem 12% desses clientes, gerando em média R$680 mil em receita recuperada."

Cada descoberta deve incluir:
- Identificador único da descoberta
- Título descritivo
- Evidências concretas (cite números, percentis, resultados de análises)
- Implicação prática (o que isso significa para o negócio)

Não crie estratégias ainda - apenas apresente os achados de forma clara e fundamentada. Seja objetivo mas inspirador ao mostrar as oportunidades escondidas nos dados.

Retorne suas descobertas em JSON válido como array dentro de um objeto findings.`;

const STRATEGIST_PROMPT = `Você é o estrategista de marketing da Festi-Forecast AI. Recebe descobertas fundamentadas em dados e cria estratégias acionáveis.

Cada estratégia deve ter pelo menos duas evidências das descobertas. Por exemplo:

"Campanha de WhatsApp para Alto Valor Inativos (850 clientes, recência > P75, valor > P75) com desconto de R$50 e mensagem personalizada mencionando o último evento que compareceram.

Evidência 1: Este segmento gastava R$800 em média (acima do P75 de R$600).
Evidência 2: Taxa histórica de reativação via WhatsApp é 12%, esperamos 15% com urgência e personalização.

Custo estimado: R$850 (R$1 por mensagem). Receita esperada: R$102 mil (128 conversões × R$800). ROI: 120x."

Cada estratégia precisa incluir:
- Canal de comunicação específico (WhatsApp, email, push, anúncios pagos)
- Público-alvo exato com tamanho e critérios
- Abordagem da mensagem (tom, conteúdo, personalização)
- Timing preciso (quando enviar, quantos toques)
- KPIs mensuráveis (taxa de abertura, conversão, receita)
- Raciocínio claro do porquê vai funcionar
- Verificação contra as restrições (orçamento, capacidade do evento, canais disponíveis)

Fale como um gerente de marketing apresentando ao time - confiante, claro e estratégico. Use apenas as descobertas fornecidas e respeite as restrições de orçamento e capacidade.

Retorne suas estratégias em JSON válido como array dentro de um objeto strategies.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabaseUser
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

    const tenantId = profile.tenant_id;
    
    const { action, payload } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`📊 Orchestrator action: ${action} for tenant: ${tenantId}`);

    switch (action) {
      case 'plan': {
        // Step 1: Planner generates data plan for NEW event
        const { newEvent, goal, constraints } = payload;
        
        // Create analysis run with new event context
        const { data: run, error: runError } = await supabase
          .from('analysis_runs')
          .insert({
            event_id: null,
            event_context_json: newEvent,
            goal,
            constraints_json: constraints,
            status: 'planning',
            tenant_id: tenantId
          })
          .select()
          .single();

        if (runError) throw runError;

        // Find analogous events based on genre and city
        const { data: analogEvents } = await supabase
          .from('vw_event_analogs')
          .select('*')
          .eq('genre', newEvent.genre)
          .eq('city', newEvent.city)
          .order('month_bucket', { ascending: false })
          .limit(10);

        console.log(`📊 Found ${analogEvents?.length || 0} analogous events for ${newEvent.genre} in ${newEvent.city}`);

        // Get market statistics
        const { data: marketStats } = await supabase
          .from('vw_segment_forecast')
          .select('*')
          .eq('genre', newEvent.genre)
          .eq('city', newEvent.city)
          .limit(5);

        const analogContext = analogEvents && analogEvents.length > 0 
          ? {
              count: analogEvents.length,
              avg_occupancy: analogEvents.reduce((acc, e) => acc + (e.occupancy_rate || 0), 0) / analogEvents.length,
              avg_revenue: analogEvents.reduce((acc, e) => acc + (e.revenue || 0), 0) / analogEvents.length,
              avg_price: analogEvents.reduce((acc, e) => acc + (e.avg_price || 0), 0) / analogEvents.length
            }
          : null;

        const enrichedContext = `
NEW EVENT:
- Artist: ${newEvent.artist}
- Genre: ${newEvent.genre}
- City: ${newEvent.city}
- Capacity: ${newEvent.capacity}
- Expected Avg Price: R$${newEvent.avgPrice || 'N/A'}

ANALOGOUS EVENTS (${analogEvents?.length || 0} found):
${analogContext ? `
- Avg Occupancy: ${(analogContext.avg_occupancy * 100).toFixed(1)}%
- Avg Revenue: R$${analogContext.avg_revenue.toFixed(0)}
- Avg Price: R$${analogContext.avg_price.toFixed(0)}
` : 'No sufficient data for this genre/city combination'}

MARKET SEGMENTS:
${marketStats?.map(s => `- ${s.segment}: ${s.customers} customers, avg spend R$${s.avg_monetary_total}`).join('\n') || 'No segment data'}

GOAL: ${goal}
CONSTRAINTS: ${JSON.stringify(constraints)}

Available segments to target:
- attended_similar: Customers who previously attended ${newEvent.genre} events
- high_value: Champions and Loyal customers (high RFM)
- at_risk: Customers needing reactivation (high recency, low frequency)
- high_bar_spenders: Premium consumption segment

Based on the goal and analogous data, which segments should we target?
`;

        // Call Planner LLM with enriched context
        const plannerResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: PLANNER_PROMPT },
              { role: 'user', content: enrichedContext }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        const plannerData = await plannerResponse.json();
        const parsedPlan = JSON.parse(plannerData.choices[0].message.content);
        
        // Extract inner 'plan' if it exists (avoiding double-nesting)
        const plan = parsedPlan.plan || parsedPlan;
        console.log('📋 Generated plan:', JSON.stringify(plan, null, 2));

        return new Response(JSON.stringify({ success: true, runId: run.id, plan }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'execute': {
        // Step 2: Execute prepared queries and compute DataProfile
        const { runId, plan } = payload;

        // Get event context from run
        const { data: run } = await supabase
          .from('analysis_runs')
          .select('event_context_json')
          .eq('id', runId)
          .single();

        const newEvent = run?.event_context_json;
        const targetGenre = newEvent?.genre;

        console.log(`🎯 Executing data collection for genre: ${targetGenre}`);

        // Query 1: Customers who attended similar genre events
        const { data: attendedSimilar } = await supabase
          .from('vw_multi_segment')
          .select('customer_id, name, email, city, preferred_genre, monetary_total, recency_days, frequency')
          .eq('preferred_genre', targetGenre)
          .order('monetary_total', { ascending: false })
          .limit(500);

        console.log(`✅ Found ${attendedSimilar?.length || 0} customers who attended ${targetGenre} events`);

        // Query 2: High-value customers (Champions, Loyal)
        const { data: highValue } = await supabase
          .from('vw_customer_rfm')
          .select('customer_id, segment, monetary_total, frequency, recency_days')
          .in('segment', ['Champions', 'Loyal', 'Potential Loyalist'])
          .order('monetary_total', { ascending: false })
          .limit(500);

        console.log(`✅ Found ${highValue?.length || 0} high-value customers`);

        // Query 3: At-risk customers needing reactivation
        const { data: atRisk } = await supabase
          .from('vw_customer_rfm')
          .select('customer_id, segment, recency_days, monetary_total, frequency')
          .in('segment', ['At Risk', 'Need Attention'])
          .gt('recency_days', 90)
          .order('monetary_total', { ascending: false })
          .limit(300);

        console.log(`✅ Found ${atRisk?.length || 0} at-risk customers`);

        // Query 4: High bar spenders
        const { data: highBarSpenders } = await supabase
          .from('vw_consumption_profile')
          .select('customer_id, consumption_segment, total_value, total_quantity')
          .in('consumption_segment', ['High Spender', 'Premium'])
          .order('total_value', { ascending: false })
          .limit(200);

        console.log(`✅ Found ${highBarSpenders?.length || 0} high bar spenders`);

        // Get analogous events data
        const { data: analogEvents } = await supabase
          .from('vw_event_analogs')
          .select('*')
          .eq('genre', targetGenre)
          .eq('city', newEvent?.city)
          .order('month_bucket', { ascending: false })
          .limit(10);

        const analogContext = analogEvents && analogEvents.length > 0 
          ? {
              count: analogEvents.length,
              avg_occupancy: analogEvents.reduce((acc, e) => acc + (e.occupancy_rate || 0), 0) / analogEvents.length,
              avg_revenue: analogEvents.reduce((acc, e) => acc + (e.revenue || 0), 0) / analogEvents.length,
              avg_price: analogEvents.reduce((acc, e) => acc + (e.avg_price || 0), 0) / analogEvents.length
            }
          : null;

        // Get RFM percentiles for context
        const { data: rfmData } = await supabase
          .from('vw_customer_rfm')
          .select('recency_days, frequency, monetary_total')
          .order('recency_days');

        const calculatePercentiles = (arr: number[]) => {
          const sorted = arr.sort((a, b) => a - b);
          return {
            p25: sorted[Math.floor(sorted.length * 0.25)],
            p50: sorted[Math.floor(sorted.length * 0.50)],
            p75: sorted[Math.floor(sorted.length * 0.75)]
          };
        };

        const rfmPercentiles = rfmData ? {
          R: calculatePercentiles(rfmData.map(r => r.recency_days || 0)),
          F: calculatePercentiles(rfmData.map(r => r.frequency || 0)),
          M: calculatePercentiles(rfmData.map(r => r.monetary_total || 0))
        } : null;

        // Build comprehensive DataProfile
        const dataProfile = {
          segments: {
            attended_similar: {
              count: attendedSimilar?.length || 0,
              avg_monetary: (attendedSimilar || []).reduce((acc, c) => acc + (c.monetary_total || 0), 0) / (attendedSimilar?.length || 1),
              avg_recency: (attendedSimilar || []).reduce((acc, c) => acc + (c.recency_days || 0), 0) / (attendedSimilar?.length || 1),
              top_customers: attendedSimilar?.slice(0, 10) || []
            },
            high_value: {
              count: highValue?.length || 0,
              avg_monetary: (highValue || []).reduce((acc, c) => acc + (c.monetary_total || 0), 0) / (highValue?.length || 1),
              segments_breakdown: (highValue || []).reduce((acc: any, c) => {
                acc[c.segment] = (acc[c.segment] || 0) + 1;
                return acc;
              }, {})
            },
            at_risk: {
              count: atRisk?.length || 0,
              avg_recency: (atRisk || []).reduce((acc, c) => acc + (c.recency_days || 0), 0) / (atRisk?.length || 1),
              avg_past_monetary: (atRisk || []).reduce((acc, c) => acc + (c.monetary_total || 0), 0) / (atRisk?.length || 1)
            },
            high_bar_spenders: {
              count: highBarSpenders?.length || 0,
              avg_spend: (highBarSpenders || []).reduce((acc, c) => acc + (c.total_value || 0), 0) / (highBarSpenders?.length || 1)
            }
          },
          analogous_events: analogContext ? {
            total_found: analogContext.count,
            avg_occupancy: analogContext.avg_occupancy,
            avg_revenue: analogContext.avg_revenue,
            avg_ticket_price: analogContext.avg_price
          } : null,
          rfm_percentiles: rfmPercentiles,
          population: {
            total_customers: rfmData?.length || 0,
            period_days: 365
          }
        };

        console.log(`📊 DataProfile built with ${Object.keys(dataProfile.segments).length} segments`);

        // Save DataProfile
        const { error: profileError } = await supabase
          .from('data_profiles')
          .insert({
            run_id: runId,
            payload_json: dataProfile
          });

        if (profileError) throw profileError;

        // Update run status
        await supabase
          .from('analysis_runs')
          .update({ status: 'data_ready' })
          .eq('id', runId);

        return new Response(JSON.stringify({ success: true, dataProfile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'hypotheses': {
        // Step 3: Analyst generates hypotheses
        const { runId, dataProfile } = payload;

        const hypothesesPrompt = `Based on this DataProfile, generate 5-7 testable hypotheses:
        
${JSON.stringify(dataProfile, null, 2)}

Return hypotheses as JSON array with: hypothesis, evidence_needed, priority (high/medium/low)`;

        const analystResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: ANALYST_PROMPT },
              { role: 'user', content: hypothesesPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        const analystData = await analystResponse.json();
        const hypotheses = JSON.parse(analystData.choices[0].message.content);

        return new Response(JSON.stringify({ success: true, hypotheses }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'test': {
        // Step 4: Test hypotheses and generate Findings
        const { runId, dataProfile, approvedHypotheses } = payload;

        const findingsPrompt = `Test these approved hypotheses and generate Findings:

DataProfile: ${JSON.stringify(dataProfile, null, 2)}
Approved Hypotheses: ${JSON.stringify(approvedHypotheses, null, 2)}

Generate detailed Findings with evidence.`;

        const analystResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: ANALYST_PROMPT },
              { role: 'user', content: findingsPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        const analystData = await analystResponse.json();
        const findings = JSON.parse(analystData.choices[0].message.content);

        // Save Findings
        const { error: findingsError } = await supabase
          .from('findings')
          .insert({
            run_id: runId,
            payload_json: findings
          });

        if (findingsError) throw findingsError;

        // Update run status
        await supabase
          .from('analysis_runs')
          .update({ status: 'findings_ready' })
          .eq('id', runId);

        return new Response(JSON.stringify({ success: true, findings }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'strategize': {
        // Step 5: Strategist generates strategies
        const { runId, findings, constraints } = payload;

        // Get benchmarks
        const { data: benchmarks } = await supabase
          .from('benchmarks')
          .select('*');

        const benchmarksObj = benchmarks?.reduce((acc: any, b: any) => {
          acc[b.key] = b.value;
          return acc;
        }, {});

        const strategiesPrompt = `Generate 3-5 actionable strategies based on these Findings:

Findings: ${JSON.stringify(findings, null, 2)}
Constraints: ${JSON.stringify(constraints, null, 2)}
Benchmarks: ${JSON.stringify(benchmarksObj, null, 2)}

Each strategy must cite evidence and be specific.`;

        const strategistResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: STRATEGIST_PROMPT },
              { role: 'user', content: strategiesPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        const strategistData = await strategistResponse.json();
        const strategiesResult = JSON.parse(strategistData.choices[0].message.content);

        // Save strategies
        for (const strategy of strategiesResult.strategies) {
          await supabase
            .from('strategies')
            .insert({
              run_id: runId,
              payload_json: strategy,
              status: 'draft'
            });
        }

        // Update run status
        await supabase
          .from('analysis_runs')
          .update({ status: 'strategies_ready' })
          .eq('id', runId);

        return new Response(JSON.stringify({ success: true, strategies: strategiesResult.strategies }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'validate': {
        // Step 6: Validate strategy
        const { strategyId, strategy, eventId, constraints } = payload;

        const reasons: string[] = [];
        let ok = true;

        // Get event capacity only if eventId is valid (not "temp" or null)
        let event = null;
        if (eventId && eventId !== "temp") {
          const { data } = await supabase
            .from('events')
            .select('capacity')
            .eq('id', eventId)
            .single();
          event = data;
        }

        // Check capacity
        if (strategy.target_segment && event) {
          const segmentSize = parseInt(strategy.target_segment.match(/\d+/)?.[0] || '0');
          if (segmentSize > event.capacity * 0.8) {
            ok = false;
            reasons.push(`Segment size (${segmentSize}) exceeds 80% of venue capacity (${event.capacity})`);
          }
        }

        // Check margin
        if (constraints.min_margin && strategy.offer?.value) {
          const discountMatch = strategy.offer.value.match(/R\$(\d+)/);
          if (discountMatch && parseInt(discountMatch[1]) > constraints.min_margin) {
            ok = false;
            reasons.push(`Discount exceeds minimum margin constraint`);
          }
        }

        // Check channels
        if (constraints.allowed_channels && strategy.channel) {
          const invalidChannels = strategy.channel.filter((c: string) => 
            !constraints.allowed_channels.includes(c)
          );
          if (invalidChannels.length > 0) {
            ok = false;
            reasons.push(`Channels not allowed: ${invalidChannels.join(', ')}`);
          }
        }

        // Save validation
        const { error: valError } = await supabase
          .from('strategy_validations')
          .insert({
            strategy_id: strategyId,
            ok,
            reasons_json: reasons
          });

        if (valError) throw valError;

        // Update strategy status
        if (ok) {
          await supabase
            .from('strategies')
            .update({ status: 'validated' })
            .eq('id', strategyId);
        }

        return new Response(JSON.stringify({ success: true, ok, reasons }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'save': {
        // Step 7: Mark strategies as saved
        const { runId } = payload;

        await supabase
          .from('strategies')
          .update({ status: 'saved' })
          .eq('run_id', runId)
          .eq('status', 'validated');

        await supabase
          .from('analysis_runs')
          .update({ status: 'completed' })
          .eq('id', runId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Orchestrator error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});