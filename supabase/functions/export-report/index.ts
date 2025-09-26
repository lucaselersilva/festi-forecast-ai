import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { format, data } = await req.json();
    
    console.log('Export request:', { format, dataKeys: Object.keys(data) });

    if (format === 'csv') {
      const csvContent = generateCSV(data);
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="insights-report-${Date.now()}.csv"`
        },
      });
    }

    if (format === 'pdf') {
      const pdfStructure = generatePDFStructure(data);
      return new Response(JSON.stringify({
        success: true,
        pdfStructure,
        downloadUrl: null // Client-side PDF generation
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Unsupported export format');

  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateCSV(data: any): string {
  const { eventInfo, revenueData, sponsorshipData, segments } = data;
  
  let csv = 'Relatório de Insights - Evento\n\n';
  
  // Event Info
  csv += 'INFORMAÇÕES DO EVENTO\n';
  csv += 'Campo,Valor\n';
  csv += `Gênero,${eventInfo.genre}\n`;
  csv += `Cidade,${eventInfo.city}\n`;
  csv += `Data,${eventInfo.date}\n`;
  csv += `Capacidade,${eventInfo.capacity}\n\n`;
  
  // Revenue Analysis
  if (revenueData) {
    csv += 'ANÁLISE DE RECEITA\n';
    csv += 'Métrica,Valor\n';
    csv += `Receita Total,R$ ${revenueData.revenueProjection.totalRevenue.toLocaleString('pt-BR')}\n`;
    csv += `Ingressos Vendidos,${revenueData.revenueProjection.totalSales}\n`;
    csv += `Preço Médio,R$ ${revenueData.revenueProjection.avgTicketPrice.toLocaleString('pt-BR')}\n`;
    csv += `Taxa de Ocupação,${(revenueData.revenueProjection.occupancyRate * 100).toFixed(1)}%\n\n`;
    
    // Pricing Tiers
    csv += 'CATEGORIA DE PREÇOS\n';
    csv += 'Categoria,Percentual,Capacidade,Preço,Vendas Esperadas,Receita,Taxa Conversão\n';
    revenueData.pricingTiers.forEach((tier: any) => {
      csv += `${tier.tier},${tier.percentage}%,${tier.capacity},R$ ${tier.price},${tier.expectedSales},R$ ${tier.revenue.toLocaleString('pt-BR')},${(tier.conversionRate * 100).toFixed(1)}%\n`;
    });
    csv += '\n';
  }
  
  // Sponsorship Analysis
  if (sponsorshipData) {
    csv += 'ANÁLISE DE PATROCÍNIO\n';
    csv += 'Métrica,Valor\n';
    csv += `Alcance Esperado,${sponsorshipData.expectedReach.toLocaleString('pt-BR')}\n`;
    csv += `Gasto no Local,R$ ${sponsorshipData.expectedOnsiteSpend.toLocaleString('pt-BR')}\n\n`;
    
    // Sponsor Packages
    csv += 'PACOTES DE PATROCÍNIO\n';
    csv += 'Categoria,Preço,ROI Esperado,Benefícios\n';
    sponsorshipData.sponsorPackages.forEach((pkg: any) => {
      csv += `${pkg.tier},R$ ${pkg.price.toLocaleString('pt-BR')},${pkg.expectedROI},"${pkg.benefits.join('; ')}"\n`;
    });
    csv += '\n';
  }
  
  // Segments
  if (segments && segments.length > 0) {
    csv += 'SEGMENTAÇÃO AVANÇADA\n';
    csv += 'Segmento,Participação,Preço Médio,Gasto Bar,Taxa Conversão\n';
    segments.forEach((segment: any) => {
      csv += `${segment.name},${(segment.marketShare * 100).toFixed(1)}%,R$ ${segment.avgTicketSpend},R$ ${segment.avgBarSpend},${(segment.conversionRate * 100).toFixed(1)}%\n`;
    });
  }
  
  return csv;
}

function generatePDFStructure(data: any) {
  const { eventInfo, revenueData, sponsorshipData, segments } = data;
  
  return {
    title: 'Relatório de Insights - Evento',
    metadata: {
      genre: eventInfo.genre,
      city: eventInfo.city,
      date: eventInfo.date,
      capacity: eventInfo.capacity,
      generatedAt: new Date().toISOString()
    },
    sections: [
      {
        title: 'Resumo Executivo',
        content: [
          `Evento de ${eventInfo.genre} em ${eventInfo.city}`,
          `Capacidade: ${eventInfo.capacity} pessoas`,
          `Data: ${eventInfo.date}`,
          revenueData ? `Receita Projetada: R$ ${revenueData.revenueProjection.totalRevenue.toLocaleString('pt-BR')}` : '',
          sponsorshipData ? `Alcance Esperado: ${sponsorshipData.expectedReach.toLocaleString('pt-BR')} pessoas` : ''
        ].filter(Boolean)
      },
      ...(revenueData ? [{
        title: 'Análise de Receita',
        content: [
          `Receita Total: R$ ${revenueData.revenueProjection.totalRevenue.toLocaleString('pt-BR')}`,
          `Ingressos Vendidos: ${revenueData.revenueProjection.totalSales}`,
          `Preço Médio: R$ ${revenueData.revenueProjection.avgTicketPrice.toLocaleString('pt-BR')}`,
          `Taxa de Ocupação: ${(revenueData.revenueProjection.occupancyRate * 100).toFixed(1)}%`
        ],
        table: {
          headers: ['Categoria', 'Preço', 'Vendas', 'Receita'],
          rows: revenueData.pricingTiers.map((tier: any) => [
            tier.tier,
            `R$ ${tier.price.toLocaleString('pt-BR')}`,
            tier.expectedSales.toString(),
            `R$ ${tier.revenue.toLocaleString('pt-BR')}`
          ])
        },
        recommendations: revenueData.recommendations
      }] : []),
      ...(sponsorshipData ? [{
        title: 'Estratégia de Patrocínio',
        content: [
          `Alcance Esperado: ${sponsorshipData.expectedReach.toLocaleString('pt-BR')} pessoas`,
          `Gasto Médio no Local: R$ ${(sponsorshipData.expectedOnsiteSpend / sponsorshipData.expectedReach).toFixed(2)}`,
          `Idade Média: ${sponsorshipData.profileHints.avgAge} anos`
        ],
        table: {
          headers: ['Pacote', 'Preço', 'ROI', 'Benefícios'],
          rows: sponsorshipData.sponsorPackages.map((pkg: any) => [
            pkg.tier,
            `R$ ${pkg.price.toLocaleString('pt-BR')}`,
            pkg.expectedROI,
            pkg.benefits.slice(0, 2).join(', ')
          ])
        },
        insights: sponsorshipData.insights
      }] : []),
      ...(segments && segments.length > 0 ? [{
        title: 'Segmentação Avançada',
        content: [
          `${segments.length} segmentos identificados`,
          `Segmento principal: ${segments[0]?.name}`,
          `Taxa de conversão média: ${(segments.reduce((acc: number, s: any) => acc + s.conversionRate, 0) / segments.length * 100).toFixed(1)}%`
        ],
        table: {
          headers: ['Segmento', 'Participação', 'Ticket Médio', 'Conversão'],
          rows: segments.map((segment: any) => [
            segment.name,
            `${(segment.marketShare * 100).toFixed(1)}%`,
            `R$ ${segment.avgTicketSpend}`,
            `${(segment.conversionRate * 100).toFixed(1)}%`
          ])
        }
      }] : [])
    ]
  };
}