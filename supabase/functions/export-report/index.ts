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
        const pdfBase64 = await generatePDF(data);
        return new Response(JSON.stringify({ 
          success: true, 
          data: pdfBase64,
          filename: `insights-report-${Date.now()}.pdf`
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
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

async function generatePDF(data: any): Promise<string> {
  const { eventInfo, revenueData, sponsorshipData, segments } = data;
  
  console.log('Starting PDF generation with jsPDF...');
  
  try {
    // Import jsPDF dynamically
    const { jsPDF } = await import('https://esm.sh/jspdf@2.5.1');
    const doc = new jsPDF();
    console.log('jsPDF loaded successfully');
  
  let yPosition = 20;
  
  // Header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('RELATÓRIO DE INSIGHTS - EVENTO', 20, yPosition);
  yPosition += 15;
  
  // Event Info
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('INFORMAÇÕES DO EVENTO', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Gênero: ${eventInfo.genre}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Cidade: ${eventInfo.city}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Data: ${eventInfo.date}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Capacidade: ${eventInfo.capacity?.toLocaleString('pt-BR') || 'N/A'} pessoas`, 20, yPosition);
  yPosition += 15;
  
  // Revenue Analysis
  if (revenueData) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('ANÁLISE DE RECEITA', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Receita Total Projetada: R$ ${revenueData.revenueProjection.totalRevenue.toLocaleString('pt-BR')}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Ingressos Vendidos: ${revenueData.revenueProjection.totalSales.toLocaleString('pt-BR')}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Preço Médio: R$ ${revenueData.revenueProjection.avgTicketPrice.toLocaleString('pt-BR')}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Taxa de Ocupação: ${(revenueData.revenueProjection.occupancyRate * 100).toFixed(1)}%`, 20, yPosition);
    yPosition += 15;
    
    // Marketing ROI
    if (revenueData.marketingROI) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('ESTRATÉGIA DE MARKETING E ROI', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Orçamento Recomendado: R$ ${revenueData.marketingROI.recommendedBudget.toLocaleString('pt-BR')}`, 20, yPosition);
      yPosition += 5;
      doc.text(`CPA Esperado: R$ ${revenueData.marketingROI.expectedCPA}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Ponto de Equilíbrio: ${revenueData.marketingROI.breakeven} ingressos`, 20, yPosition);
      yPosition += 5;
      
      const channelMix = Object.entries(revenueData.marketingROI.channelMix)
        .map(([channel, percentage]) => `${channel}: ${percentage}%`)
        .join(', ');
      doc.text(`Mix de Canais: ${channelMix}`, 20, yPosition);
      yPosition += 10;
    }
    
    // Top Customer Prospects (if segments available)
    if (segments && segments.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('CLIENTES MAIS PROVÁVEIS', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      segments.slice(0, 3).forEach((segment: any, index: number) => {
        const topChannel = Object.entries(segment.marketingChannels || {})
          .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'digital';
        doc.text(`${index + 1}. ${segment.name}: ${(segment.conversionRate * 100).toFixed(0)}% probabilidade`, 20, yPosition);
        yPosition += 4;
        doc.text(`   Gasto Esperado: R$ ${(segment.avgTicketSpend + segment.avgBarSpend).toLocaleString('pt-BR')}`, 25, yPosition);
        yPosition += 4;
        doc.text(`   Canal Preferido: ${topChannel}`, 25, yPosition);
        yPosition += 6;
      });
    }
  }
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Sponsorship Analysis
  if (sponsorshipData) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('ANÁLISE DE PATROCÍNIO', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Alcance Esperado: ${sponsorshipData.expectedReach.toLocaleString('pt-BR')} pessoas`, 20, yPosition);
    yPosition += 6;
    doc.text(`Gasto no Local: R$ ${sponsorshipData.expectedOnsiteSpend.toLocaleString('pt-BR')}`, 20, yPosition);
    yPosition += 15;
    
    // Sponsor Packages
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('PACOTES DE PATROCÍNIO', 20, yPosition);
    yPosition += 8;
    
    sponsorshipData.sponsorPackages.forEach((pkg: any) => {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`${pkg.tier}: R$ ${pkg.price.toLocaleString('pt-BR')} - ROI: ${pkg.expectedROI}`, 20, yPosition);
      yPosition += 5;
      doc.setFont(undefined, 'normal');
      doc.text(`Benefícios: ${pkg.benefits.join(', ')}`, 25, yPosition);
      yPosition += 8;
    });
  }
  
  // Segments Detail
  if (segments && segments.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('SEGMENTAÇÃO AVANÇADA', 20, yPosition);
    yPosition += 10;
    
    segments.forEach((segment: any) => {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`${segment.name}`, 20, yPosition);
      yPosition += 6;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Participação: ${(segment.marketShare * 100).toFixed(1)}% | Preço Médio: R$ ${segment.avgTicketSpend}`, 25, yPosition);
      yPosition += 4;
      doc.text(`Gasto Bar: R$ ${segment.avgBarSpend} | Conversão: ${(segment.conversionRate * 100).toFixed(1)}%`, 25, yPosition);
      yPosition += 4;
      const channels = Object.entries(segment.marketingChannels || {})
        .map(([channel, percentage]) => `${channel}: ${percentage}%`)
        .join(', ');
      doc.text(`Canais: ${channels}`, 25, yPosition);
      yPosition += 8;
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });
  }
  
    console.log('PDF generation completed successfully');
    return doc.output('datauristring').split(',')[1]; // Return base64 string without data:application/pdf;base64, prefix
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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