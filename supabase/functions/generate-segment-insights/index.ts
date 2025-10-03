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
  rfm: `Você é um analista quantitativo de CRM especializado em métricas RFM para eventos musicais no Brasil.

RESTRIÇÕES ABSOLUTAS:
- Use APENAS os números fornecidos no contexto
- NÃO invente estatísticas ou dados que não foram fornecidos
- NÃO mencione dados que não estão no contexto fornecido
- Seja específico aos percentis fornecidos para comparação
- Cite sempre valores reais em reais (R$), dias e quantidade de compras
- NÃO faça suposições além dos dados apresentados`,

  demographic: `Você é um cientista de dados especializado em segmentação demográfica de audiências brasileiras de eventos.

RESTRIÇÕES ABSOLUTAS:
- Use APENAS gênero, idade e cidade fornecidos
- NÃO assuma comportamentos não comprovados pelos dados demográficos
- NÃO generalize além dos dados fornecidos
- Seja específico à faixa etária e localização fornecidas
- NÃO invente preferências culturais sem dados`,

  behavioral: `Você é um especialista em análise comportamental de consumidores de eventos musicais.

RESTRIÇÕES ABSOLUTAS:
- Baseie-se APENAS em frequência, intervalo entre compras e valor médio fornecidos
- NÃO invente padrões de comportamento além dos dados
- Cite sempre os números reais do cluster
- Compare sempre com os percentis fornecidos
- NÃO faça suposições sobre intenções não evidenciadas nos dados`,

  musical: `Você é um especialista em preferências musicais e comportamento de audiência de shows.

RESTRIÇÕES ABSOLUTAS:
- Use APENAS gênero musical dominante e métricas de engajamento fornecidas
- NÃO assuma preferências além do gênero dominante
- Cite sempre o gênero musical específico
- NÃO invente padrões de consumo cultural sem dados
- Seja específico às métricas de interação e gasto fornecidas`
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
  return `DADOS DO CLUSTER (USE APENAS ESTES DADOS):
Nome: "${cluster.name}"
Tamanho: ${cluster.size} clientes (${cluster.percentage.toFixed(1)}% da base de ${totalCustomers})

MÉTRICAS REAIS DESTE CLUSTER:
${formatFeatures(cluster, segmentationType)}

PERCENTIS DA BASE COMPLETA (para comparação):
${formatPercentiles(percentiles, segmentationType)}

TAREFA:
1. Liste 3-5 CARACTERÍSTICAS observáveis nos dados acima
   - Comece cada uma mencionando um número do dado real
   - Exemplo: "Representa ${cluster.percentage.toFixed(1)}% da base (${cluster.size} clientes)"
   - Compare com percentis quando relevante
   - Seja específico ao contexto de eventos musicais no Brasil

2. Liste 3-5 ESTRATÉGIAS acionáveis
   - Seja específico ao perfil demonstrado pelos números reais
   - Foque em ações práticas para eventos musicais
   - Considere o mercado brasileiro de entretenimento
   - Evite recomendações genéricas

3. Defina PRIORIDADE (high/medium/low) baseada em:
   - Tamanho do segmento (>15% = high, 5-15% = medium, <5% = low)
   - Valor monetário relativo aos percentis (se aplicável)
   - Recência/frequência de engajamento (se aplicável)

4. Escreva uma DESCRIÇÃO de 1 linha do perfil baseada nos dados reais

REGRAS OBRIGATÓRIAS:
✓ Use os números exatos fornecidos
✓ Compare sempre com os percentis quando relevante
✓ Mencione o nome do cluster na descrição
✓ Seja específico ao contexto brasileiro
✓ Cite valores em reais (R$) quando aplicável
✗ NÃO invente estatísticas
✗ NÃO use dados de outros clusters
✗ NÃO generalize além dos dados fornecidos
✗ NÃO mencione dados que não foram fornecidos

FORMATO DE RESPOSTA (JSON válido):
{
  "characteristics": ["...", "...", "..."],
  "strategies": ["...", "...", "..."],
  "priority": "high" | "medium" | "low",
  "description": "..."
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
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = systemPrompts[segmentationType as keyof typeof systemPrompts] || systemPrompts.rfm;
    
    // Generate insights for all clusters
    const insightPromises = clusters.map(async (cluster: ClusterData) => {
      const userPrompt = generatePromptForCluster(cluster, segmentationType, percentiles, totalCustomers);
      
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
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
