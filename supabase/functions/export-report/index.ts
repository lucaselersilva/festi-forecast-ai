import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
      const pdfBuffer = await generatePDF(data);
      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="insights-report-${Date.now()}.pdf"`
        },
      });
    }

    throw new Error('Unsupported export format');

  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
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
    csv += 'Segmento,Participação,Preço Médio,Gasto Bar,Taxa Conversão,Canais Marketing\n';
    segments.forEach((segment: any) => {
      const channels = Object.entries(segment.marketingChannels || {})
        .map(([channel, percentage]) => `${channel}: ${percentage}%`)
        .join('; ');
      csv += `${segment.name},${(segment.marketShare * 100).toFixed(1)}%,R$ ${segment.avgTicketSpend},R$ ${segment.avgBarSpend},${(segment.conversionRate * 100).toFixed(1)}%,"${channels}"\n`;
    });
    csv += '\n';
  }

  // Marketing & ROI Insights
  if (revenueData && revenueData.marketingROI) {
    csv += 'ESTRATÉGIA DE MARKETING E ROI\n';
    csv += 'Métrica,Valor\n';
    csv += `Orçamento Recomendado,R$ ${revenueData.marketingROI.recommendedBudget.toLocaleString('pt-BR')}\n`;
    csv += `CPA Esperado,R$ ${revenueData.marketingROI.expectedCPA}\n`;
    csv += `Ponto de Equilíbrio,${revenueData.marketingROI.breakeven} ingressos\n`;
    const channelMix = Object.entries(revenueData.marketingROI.channelMix)
      .map(([channel, percentage]) => `${channel}: ${percentage}%`)
      .join('; ');
    csv += `Mix de Canais,"${channelMix}"\n\n`;
  }

  // Top Customer Prospects
  if (segments && segments.length > 0) {
    csv += 'CLIENTES MAIS PROVÁVEIS\n';
    csv += 'Perfil,Probabilidade,Gasto Esperado,Canal Preferido\n';
    segments.slice(0, 3).forEach((segment: any, index: number) => {
      const topChannel = Object.entries(segment.marketingChannels || {})
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'digital';
      csv += `${segment.name},${(segment.conversionRate * 100).toFixed(0)}%,R$ ${segment.avgTicketSpend + segment.avgBarSpend},${topChannel}\n`;
    });
  }
  
  return csv;
}

async function generatePDF(data: any): Promise<ArrayBuffer> {
  const { eventInfo, revenueData, sponsorshipData, segments } = data;
  
  // Simple PDF generation - creating a structured text-based PDF
  const content = generatePDFContent(data);
  
  // For now, return a simple PDF-like structure as bytes
  // In a real implementation, you'd use a proper PDF library
  const encoder = new TextEncoder();
  const pdfHeader = "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n\n";
  const pdfContent = `2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n\n4 0 obj\n<<\n/Length ${content.length}\n>>\nstream\nBT\n/F1 12 Tf\n50 750 Td\n(${content.replace(/\n/g, ') Tj T* (')}) Tj\nET\nendstream\nendobj\n\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000125 00000 n \n0000000200 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n${400 + content.length}\n%%EOF`;
  
  const fullPdf = encoder.encode(pdfHeader + pdfContent);
  return fullPdf.buffer;
}

function generatePDFContent(data: any): string {
  const { eventInfo, revenueData, sponsorshipData, segments } = data;
  
  let content = `RELATORIO DE INSIGHTS - EVENTO\n\n`;
  content += `Evento: ${eventInfo.genre} em ${eventInfo.city}\n`;
  content += `Data: ${eventInfo.date}\n`;
  content += `Capacidade: ${eventInfo.capacity} pessoas\n\n`;
  
  if (revenueData) {
    content += `ANALISE DE RECEITA\n`;
    content += `Receita Projetada: R$ ${revenueData.revenueProjection.totalRevenue.toLocaleString('pt-BR')}\n`;
    content += `Ingressos: ${revenueData.revenueProjection.totalSales}\n`;
    content += `Preco Medio: R$ ${revenueData.revenueProjection.avgTicketPrice.toLocaleString('pt-BR')}\n`;
    content += `Ocupacao: ${(revenueData.revenueProjection.occupancyRate * 100).toFixed(1)}%\n\n`;
    
    if (revenueData.marketingROI) {
      content += `ESTRATEGIA DE MARKETING\n`;
      content += `Orcamento: R$ ${revenueData.marketingROI.recommendedBudget.toLocaleString('pt-BR')}\n`;
      content += `CPA: R$ ${revenueData.marketingROI.expectedCPA}\n`;
      content += `Break-even: ${revenueData.marketingROI.breakeven} ingressos\n\n`;
    }
  }
  
  if (sponsorshipData) {
    content += `ESTRATEGIA DE PATROCINIO\n`;
    content += `Alcance: ${sponsorshipData.expectedReach.toLocaleString('pt-BR')} pessoas\n`;
    content += `Gasto Local: R$ ${sponsorshipData.expectedOnsiteSpend.toLocaleString('pt-BR')}\n\n`;
  }
  
  if (segments && segments.length > 0) {
    content += `SEGMENTACAO AVANCADA\n`;
    content += `${segments.length} segmentos identificados\n`;
    segments.slice(0, 5).forEach((segment: any) => {
      content += `${segment.name}: ${(segment.marketShare * 100).toFixed(1)}% - R$ ${segment.avgTicketSpend}\n`;
    });
    content += `\nCLIENTES MAIS PROVAVEIS:\n`;
    segments.slice(0, 3).forEach((segment: any) => {
      content += `${segment.name}: ${(segment.conversionRate * 100).toFixed(0)}% probabilidade\n`;
    });
  }
  
  return content;
}