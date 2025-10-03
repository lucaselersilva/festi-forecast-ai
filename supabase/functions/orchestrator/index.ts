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
const PLANNER_PROMPT = `You are a DATA PLANNER for event marketing analysis. When given a goal and event context:

1. DO NOT generate SQL queries - data will be collected from pre-defined segments.
2. Analyze the analogous events data and market segments provided.
3. Suggest which customer segments to target based on the goal.
4. Return a structured plan with segment recommendations.

Output JSON format:
{
  "segments_to_query": ["attended_similar", "high_value", "at_risk", "high_bar_spenders"],
  "rationale": "Based on analogous events showing 82% occupancy and goal to boost revenue, focus on customers who attended similar genre events and high-value segments",
  "expected_reach": 1000
}`;

const ANALYST_PROMPT = `You are a DATA ANALYST for event marketing. Given DataProfile and initial hypotheses:

1. Test hypotheses using data evidence (percentiles, metrics, SQL results).
2. Generate Findings with cited evidence.
3. DO NOT create strategies yet.

Output JSON format:
{
  "findings": {
    "key_segments": [
      {
        "name": "High-Value At-Risk",
        "size": 850,
        "rfm": {"R": 7, "F": 8, "M": 9},
        "evidence": ["Recency > P75 (180 days)", "Monetary > P75 (R$800)"]
      }
    ],
    "opportunities": [
      {
        "hypothesis": "Win-back campaign can reactivate 15% of dormant high-value customers",
        "evidence": ["Historical reactivation rate: 12%", "Segment size: 850 customers"],
        "est_impact": "R$102,000 revenue (850 * 0.15 * R$800)"
      }
    ],
    "risks": []
  }
}`;

const STRATEGIST_PROMPT = `You are a MARKETING STRATEGIST. Given Findings with evidence:

1. Generate 3-5 specific, actionable strategies.
2. Each strategy MUST cite at least 2 pieces of evidence from Findings.
3. Include channel, target, offer, timing, KPI, rationale.

Output JSON format:
{
  "strategies": [
    {
      "title": "WhatsApp Win-Back para Alto Valor Inativos",
      "target_segment": "High-Value At-Risk (850 customers, R > P75, M > P75)",
      "channel": ["whatsapp", "email"],
      "offer": {
        "type": "discount_code",
        "value": "R$50 off em ingressos R$100+"
      },
      "timing": {
        "start_rule": "Immediately for customers inactive > 180 days",
        "cadence": "WhatsApp D0, Email follow-up D5"
      },
      "kpi": {
        "metric": "reactivation_rate",
        "goal": "15% (127 customers)",
        "timebox_days": 30
      },
      "rationale": [
        "Evidence: Segment has R > P75 (180 days), M > P75 (R$800)",
        "Evidence: Historical win-back rate: 12%, targeting 15% with urgency"
      ],
      "constraints_check": {
        "capacity_ok": true,
        "margin_ok": true
      },
      "predicted_uplift": {
        "method": "benchmark",
        "value_pct": 15
      }
    }
  ]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`📊 Orchestrator action: ${action}`);

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
            status: 'planning'
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

        // Get event capacity
        const { data: event } = await supabase
          .from('events')
          .select('capacity')
          .eq('id', eventId)
          .single();

        const reasons: string[] = [];
        let ok = true;

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