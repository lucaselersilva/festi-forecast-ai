const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DashboardMetrics {
  totalClientes: number;
  consumoMedio: number;
  consumoTotal: number;
  taxaAppAtivo: number;
  recenciaMedia: number;
  presencaMedia: number;
  topGeneros: Array<{ genero: string; clientes: number; consumo: number }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics, dataSource } = await req.json() as { 
      metrics: DashboardMetrics; 
      dataSource: 'valle_clientes' | 'events' 
    };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    console.log('📊 Gerando insights para:', { dataSource, totalClientes: metrics.totalClientes });

    const systemPrompt = dataSource === 'valle_clientes' 
      ? `Você é um analista de dados especializado em análise de comportamento de clientes.
Analise as métricas fornecidas e gere insights relevantes e acionáveis.
Seja específico com números e tendências observadas.`
      : `Você é um analista de eventos especializado em performance de shows e eventos.
Analise as métricas fornecidas e gere insights relevantes e acionáveis.`;

    const userPrompt = `
Analise os seguintes dados e gere exatamente 2 insights:
1. Um insight POSITIVO (algo que está indo bem)
2. Um insight NEGATIVO ou OPORTUNIDADE DE MELHORIA (algo que precisa atenção)

Métricas:
- Total de ${dataSource === 'valle_clientes' ? 'clientes' : 'eventos'}: ${metrics.totalClientes.toLocaleString('pt-BR')}
- ${dataSource === 'valle_clientes' ? 'Consumo médio' : 'Receita média'}: R$ ${metrics.consumoMedio.toFixed(2)}
- ${dataSource === 'valle_clientes' ? 'Consumo total' : 'Receita total'}: R$ ${metrics.consumoTotal.toFixed(2)}
${dataSource === 'valle_clientes' ? `- Taxa de app ativo: ${metrics.taxaAppAtivo.toFixed(1)}%
- Recência média: ${metrics.recenciaMedia.toFixed(0)} dias
- Presença média: ${metrics.presencaMedia.toFixed(1)} visitas` : ''}

Top ${dataSource === 'valle_clientes' ? 'gêneros' : 'categorias'}:
${metrics.topGeneros.slice(0, 3).map((g, i) => 
  `${i + 1}. ${g.genero}: ${g.clientes} ${dataSource === 'valle_clientes' ? 'clientes' : 'eventos'} - R$ ${(g.consumo / 1000).toFixed(0)}K`
).join('\n')}

Seja direto, específico e use os números reais. Cada insight deve ter no máximo 2 linhas.
`;

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
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_insights',
              description: 'Retorna um insight positivo e um negativo/oportunidade',
              parameters: {
                type: 'object',
                properties: {
                  positive: {
                    type: 'string',
                    description: 'Insight positivo sobre algo que está indo bem'
                  },
                  negative: {
                    type: 'string',
                    description: 'Insight negativo ou oportunidade de melhoria'
                  }
                },
                required: ['positive', 'negative'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_insights' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API Lovable:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos esgotados. Adicione créditos em Settings -> Workspace -> Usage.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Resposta da IA recebida');

    // Extrair os insights do tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_insights') {
      throw new Error('Resposta inválida da IA');
    }

    const insights = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro ao gerar insights:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        positive: 'Não foi possível gerar insights no momento.',
        negative: 'Por favor, tente novamente mais tarde.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
