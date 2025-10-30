import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClusterData {
  id: number;
  name: string;
  size: number;
  percentage: number;
  avgFeatures: number[];
  dominantGender?: string;
  dominantCity?: string;
  dominantGenre?: string;
}

interface Percentiles {
  recency?: { p25: number; p50: number; p75: number; min: number; max: number };
  frequency?: { p25: number; p50: number; p75: number; min: number; max: number };
  monetary?: { p25: number; p50: number; p75: number; min: number; max: number };
  age?: { p25: number; p50: number; p75: number; min: number; max: number };
  purchases?: { p25: number; p50: number; p75: number; min: number; max: number };
  daysBetween?: { p25: number; p50: number; p75: number; min: number; max: number };
  purchaseValue?: { p25: number; p50: number; p75: number; min: number; max: number };
  interactions?: { p25: number; p50: number; p75: number; min: number; max: number };
  spent?: { p25: number; p50: number; p75: number; min: number; max: number };
}

const systemPrompts = {
  rfm: `Você é um analista de dados de marketing que traduz números em recomendações claras e humanas para eventos musicais no Brasil.

Receberá dados de clusters baseados em Recência (dias desde última visita), Frequência (número de presenças) e Valor Monetário (quanto gastam). Sua tarefa é descrever quem são essas pessoas, como se comportam, e o que fazer com essa informação.

Use apenas os números fornecidos. Se algo estiver faltando, siga normalmente sem mencionar a ausência. Fale sobre oportunidades de engajamento ou aumento de receita, e indique ações práticas como "envie uma oferta de upgrade via WhatsApp para quem tem alto valor mas está inativo".

Seu texto deve fluir como um relatório narrativo, não técnico. Compare sempre com os percentis quando relevante, cite valores reais em reais (R$), dias e quantidade. Explique o porquê de cada ação de forma natural e otimista.

O objetivo é transformar esses dados em insights aplicáveis que inspirem ação.`,

  demographic: `Você é um analista de dados de marketing que entende como características demográficas influenciam o comportamento em eventos.

Receberá informações sobre faixa etária, gênero, cidade ou região de grupos de clientes. Sua missão é explicar quem são essas pessoas e como alcançá-las melhor.

Use apenas as informações disponíveis. Se algum dado demográfico não estiver presente, simplesmente não mencione - não há problema. Cite sempre números reais: "67% são homens" ou "maioria tem entre 25-34 anos".

Fale de forma natural sobre como essas características influenciam preferências de comunicação, horários, tipos de evento e ofertas. Por exemplo: "Este grupo jovem responde melhor a Stories no Instagram e gosta de descobrir artistas novos".

Seja específico, humano e focado em ações práticas que aproveitem essas características.`,

  behavioral: `Você é um analista de comportamento especializado em público de entretenimento noturno e eventos.

Receberá dados sobre padrões de comportamento: frequência de visitas, preferências de horários, engajamento digital, histórico de resposta a campanhas, padrões de consumo.

Use apenas os comportamentos observados nos dados. Se algo não estiver disponível, não especule. Cite números concretos: "visitam em média 3 vezes por mês" ou "gastam 40% mais em eventos de sexta-feira".

Identifique padrões reais e explique o que eles significam. Por exemplo: "São fiéis mas gastam pouco - perfeitos para campanhas de upgrade com mensagens curtas via WhatsApp, oferecendo combos que aumentem o ticket sem parecer caro".

Foque em insights acionáveis que transformem comportamentos em oportunidades.`,

  musical: `Você é um analista especializado em preferências musicais e entretenimento no Brasil.

Receberá dados sobre gêneros musicais preferidos, frequência por tipo de evento, relação entre estilo musical e valor gasto, padrões de interesse em diferentes artistas.

Use apenas os dados fornecidos. Se preferências musicais não estiverem claras, trabalhe com o que tiver. Cite números reais: "80% prefere sertanejo" ou "funk gera 35% mais presença".

Explique naturalmente como usar essas preferências para criar eventos mais atraentes, escolher artistas certos, personalizar comunicação. Por exemplo: "Este grupo adora sertanejo universitário - traga duplas emergentes e divulgue via TikTok com trechos das músicas".

Seja preciso, criativo e orientado a criar experiências que o público vai amar.`
};

function formatFeatures(cluster: ClusterData, type: string): string {
  const features = cluster.avgFeatures;
  
  switch (type) {
    case 'rfm':
      return `- Recência média: ${features[0]?.toFixed(1)} dias desde última compra
- Frequência média: ${features[1]?.toFixed(1)} compras no período
- Valor monetário médio: R$ ${features[2]?.toFixed(2)}`;
    
    case 'demographic':
      return `- Idade média: ${features[0]?.toFixed(1)} anos
- Gênero dominante: ${cluster.dominantGender || 'não especificado'}
- Cidade dominante: ${cluster.dominantCity || 'não especificado'}`;
    
    case 'behavioral':
      return `- Número médio de compras: ${features[0]?.toFixed(1)}
- Intervalo médio entre compras: ${features[1]?.toFixed(1)} dias
- Valor médio por compra: R$ ${features[2]?.toFixed(2)}`;
    
    case 'musical':
      return `- Gênero musical dominante: ${cluster.dominantGenre || 'não especificado'}
- Interações médias: ${features[0]?.toFixed(1)}
- Gasto médio: R$ ${features[1]?.toFixed(2)}`;
    
    default:
      return features.map((f, i) => `- Feature ${i}: ${f?.toFixed(2)}`).join('\n');
  }
}

function formatPercentiles(percentiles: Percentiles, type: string): string {
  switch (type) {
    case 'rfm':
      return `- Recência: P25=${percentiles.recency?.p25}, P50=${percentiles.recency?.p50}, P75=${percentiles.recency?.p75}
- Frequência: P25=${percentiles.frequency?.p25}, P50=${percentiles.frequency?.p50}, P75=${percentiles.frequency?.p75}
- Monetário: P25=R$ ${percentiles.monetary?.p25.toFixed(2)}, P50=R$ ${percentiles.monetary?.p50.toFixed(2)}, P75=R$ ${percentiles.monetary?.p75.toFixed(2)}`;
    
    case 'demographic':
      return `- Idade: P25=${percentiles.age?.p25}, P50=${percentiles.age?.p50}, P75=${percentiles.age?.p75}`;
    
    case 'behavioral':
      return `- Compras: P25=${percentiles.purchases?.p25}, P50=${percentiles.purchases?.p50}, P75=${percentiles.purchases?.p75}
- Intervalo: P25=${percentiles.daysBetween?.p25.toFixed(1)} dias, P50=${percentiles.daysBetween?.p50.toFixed(1)} dias, P75=${percentiles.daysBetween?.p75.toFixed(1)} dias
- Valor: P25=R$ ${percentiles.purchaseValue?.p25.toFixed(2)}, P50=R$ ${percentiles.purchaseValue?.p50.toFixed(2)}, P75=R$ ${percentiles.purchaseValue?.p75.toFixed(2)}`;
    
    case 'musical':
      return `- Interações: P25=${percentiles.interactions?.p25}, P50=${percentiles.interactions?.p50}, P75=${percentiles.interactions?.p75}
- Gasto: P25=R$ ${percentiles.spent?.p25.toFixed(2)}, P50=R$ ${percentiles.spent?.p50.toFixed(2)}, P75=R$ ${percentiles.spent?.p75.toFixed(2)}`;
    
    default:
      return 'Percentis não disponíveis';
  }
}

function generatePromptForCluster(
  cluster: ClusterData,
  segmentationType: string,
  percentiles: Percentiles,
  totalCustomers: number
): string {
  const features = formatFeatures(cluster, segmentationType);
  const percentilesText = formatPercentiles(percentiles, segmentationType);

  return `Vou te passar informações sobre um grupo de clientes. Analise e me diga quem são, como se comportam, e o que fazer para engajá-los melhor ou aumentar a receita.

Este cluster se chama "${cluster.name}" e tem ${cluster.size} clientes, representando ${cluster.percentage.toFixed(1)}% da base total de ${totalCustomers} clientes.

Características observadas:
${features}

Comparando com toda a base de clientes:
${percentilesText}

Agora me ajude a entender:
- Quem são essas pessoas e como se comportam? (descreva em 2-3 frases naturais)
- Quais são as 2-3 ações mais práticas que podemos fazer com esse grupo? (seja específico sobre canais, mensagens, ofertas)
- Qual a prioridade deste grupo comparado aos outros? (high se muito importante, medium se moderado, low se menos urgente)
- Resuma em uma frase o que define este cluster

Use apenas os dados que te passei. Se algo não estiver disponível, não tem problema - trabalhe com o que tiver. Cite números reais quando falar (R$, dias, percentuais). Compare com os percentis quando ajudar a entender a importância.

Responda em formato JSON assim:
{
  "characteristics": ["sua descrição natural aqui"],
  "strategies": ["ação 1 específica", "ação 2 específica"],
  "priority": "high, medium ou low",
  "description": "resumo em uma frase"
}`;
}

function validateInsight(insight: any): boolean {
  if (!insight.characteristics || !insight.strategies || !insight.priority || !insight.description) {
    console.error('❌ Missing required fields in insight');
    return false;
  }
  
  if (!Array.isArray(insight.characteristics) || insight.characteristics.length < 3) {
    console.error('❌ Characteristics must be an array with at least 3 items');
    return false;
  }
  
  if (!Array.isArray(insight.strategies) || insight.strategies.length < 3) {
    console.error('❌ Strategies must be an array with at least 3 items');
    return false;
  }
  
  if (!['high', 'medium', 'low'].includes(insight.priority)) {
    console.error('❌ Invalid priority value');
    return false;
  }
  
  if (typeof insight.description !== 'string' || insight.description.length < 20) {
    console.error('❌ Description must be a string with at least 20 characters');
    return false;
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { segmentationType, clusters, percentiles, totalCustomers } = await req.json();
    
    console.log(`🤖 Generating insights for ${clusters.length} clusters of type: ${segmentationType}`);
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const systemPrompt = systemPrompts[segmentationType as keyof typeof systemPrompts] || systemPrompts.rfm;
    
    // Generate insights for all clusters
    const insightPromises = clusters.map(async (cluster: ClusterData) => {
      const userPrompt = generatePromptForCluster(cluster, segmentationType, percentiles, totalCustomers);
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_completion_tokens: 1000,
            response_format: { type: "json_object" }
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.error('⚠️ Rate limit exceeded for cluster', cluster.id);
            return { clusterId: cluster.id, error: 'rate_limit' };
          }
          if (response.status === 402) {
            console.error('⚠️ Payment required for cluster', cluster.id);
            return { clusterId: cluster.id, error: 'payment_required' };
          }
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          return { clusterId: cluster.id, error: 'api_error' };
        }

        const aiResponse = await response.json();
        const content = aiResponse.choices?.[0]?.message?.content;
        
        if (!content) {
          console.error('❌ No content in AI response for cluster', cluster.id);
          return { clusterId: cluster.id, error: 'no_content' };
        }

        // Parse JSON from AI response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('❌ Could not extract JSON from AI response for cluster', cluster.id);
          return { clusterId: cluster.id, error: 'invalid_format' };
        }

        const insight = JSON.parse(jsonMatch[0]);
        
        // Validate insight
        if (!validateInsight(insight)) {
          console.error('❌ Validation failed for cluster', cluster.id);
          return { clusterId: cluster.id, error: 'validation_failed' };
        }

        console.log(`✅ Generated insight for cluster ${cluster.id}: ${cluster.name}`);
        
        return {
          clusterId: cluster.id,
          characteristics: insight.characteristics,
          strategies: insight.strategies,
          priority: insight.priority,
          description: insight.description
        };
        
      } catch (error) {
        console.error(`❌ Error generating insight for cluster ${cluster.id}:`, error);
        return { clusterId: cluster.id, error: 'generation_error' };
      }
    });

    const results = await Promise.all(insightPromises);
    
    // Filter out errors
    const successfulInsights = results.filter(r => !r.error);
    const failedInsights = results.filter(r => r.error);
    
    if (failedInsights.length > 0) {
      console.warn(`⚠️ Failed to generate ${failedInsights.length} insights:`, failedInsights);
    }
    
    console.log(`✅ Successfully generated ${successfulInsights.length}/${clusters.length} insights`);

    return new Response(
      JSON.stringify({
        success: true,
        insights: successfulInsights,
        failed: failedInsights.length,
        total: clusters.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Generate insights error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
