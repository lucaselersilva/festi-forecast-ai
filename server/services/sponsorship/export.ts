/**
 * Sponsorship Export Service
 * 
 * Gera arquivos PDF e CSV com relatórios executivos de patrocínio
 */

interface ExportData {
  eventInfo: {
    genre: string;
    city: string;
    date?: string;
    capacity?: number;
  };
  forecast: {
    expectedReach: number;
    expectedOnsiteSpend: number;
    segments: any;
    profileHints: any;
  };
  packages: any[];
  insights: string[];
  salesNarrative: string[];
}

export class SponsorshipExport {
  
  /**
   * Gerar relatório em formato CSV
   */
  async buildSponsorCSV(data: ExportData): Promise<string> {
    try {
      const csvLines = [];
      
      // Cabeçalho do relatório
      csvLines.push("RELATÓRIO DE PATROCÍNIO - FESTI FORECAST AI");
      csvLines.push(`Evento: ${data.eventInfo.genre} - ${data.eventInfo.city}`);
      csvLines.push(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`);
      csvLines.push("");

      // Resumo Executivo
      csvLines.push("RESUMO EXECUTIVO");
      csvLines.push("Métrica,Valor");
      csvLines.push(`Alcance Esperado,${data.forecast.expectedReach}`);
      csvLines.push(`Consumo On-Site Previsto,R$ ${data.forecast.expectedOnsiteSpend.toLocaleString('pt-BR')}`);
      csvLines.push(`Idade Média da Audiência,${data.forecast.profileHints.avgAge} anos`);
      csvLines.push(`Distribuição de Gênero - Masculino,${(data.forecast.profileHints.genderSplit.male * 100).toFixed(1)}%`);
      csvLines.push(`Distribuição de Gênero - Feminino,${(data.forecast.profileHints.genderSplit.female * 100).toFixed(1)}%`);
      csvLines.push("");

      // Segmentação
      csvLines.push("SEGMENTAÇÃO DE AUDIÊNCIA");
      csvLines.push("Segmento,Público Esperado,Consumo Esperado,Taxa de Conversão");
      Object.entries(data.forecast.segments).forEach(([segment, data]: [string, any]) => {
        csvLines.push(`${segment},${data.expectedAudience},R$ ${data.expectedSpend.toLocaleString('pt-BR')},${(data.conversionRate * 100).toFixed(1)}%`);
      });
      csvLines.push("");

      // Pacotes de Patrocínio
      csvLines.push("PACOTES DE PATROCÍNIO");
      csvLines.push("Tier,Preço,Alcance Esperado,ROI Esperado");
      data.packages.forEach(pkg => {
        csvLines.push(`${pkg.tier},R$ ${pkg.price.toLocaleString('pt-BR')},${pkg.expectedReach},${pkg.expectedROI}`);
      });
      csvLines.push("");

      // Benefícios por Package
      data.packages.forEach(pkg => {
        csvLines.push(`BENEFÍCIOS - ${pkg.tier.toUpperCase()}`);
        pkg.benefits.forEach((benefit: string) => {
          csvLines.push(`- ${benefit}`);
        });
        csvLines.push("");
      });

      // Insights Executivos
      csvLines.push("INSIGHTS EXECUTIVOS");
      data.insights.forEach((insight, index) => {
        csvLines.push(`${index + 1}. ${insight}`);
      });
      csvLines.push("");

      // Narrativa de Vendas
      csvLines.push("ARGUMENTOS PARA PATROCINADORES");
      data.salesNarrative.forEach((narrative, index) => {
        csvLines.push(`${index + 1}. ${narrative}`);
      });

      return csvLines.join('\n');

    } catch (error) {
      console.error("Error generating CSV:", error);
      throw new Error("Failed to generate CSV report");
    }
  }

  /**
   * Gerar relatório em formato JSON estruturado para PDF
   * (O frontend pode usar esta estrutura para gerar PDF com bibliotecas como jsPDF)
   */
  async buildSponsorPDF(data: ExportData): Promise<any> {
    try {
      const pdfStructure = {
        title: "Relatório Executivo de Patrocínio",
        subtitle: `${data.eventInfo.genre} - ${data.eventInfo.city}`,
        date: new Date().toLocaleDateString('pt-BR'),
        
        sections: [
          {
            title: "Resumo Executivo",
            type: "summary",
            content: {
              expectedReach: data.forecast.expectedReach,
              expectedSpend: data.forecast.expectedOnsiteSpend,
              avgAge: data.forecast.profileHints.avgAge,
              genderSplit: data.forecast.profileHints.genderSplit,
              topMarkets: data.forecast.profileHints.topCities?.slice(0, 3) || [],
            }
          },
          
          {
            title: "Segmentação de Audiência",
            type: "table",
            headers: ["Segmento", "Público Esperado", "Consumo Esperado", "Taxa de Conversão"],
            rows: Object.entries(data.forecast.segments).map(([segment, segmentData]: [string, any]) => [
              segment,
              segmentData.expectedAudience.toLocaleString('pt-BR'),
              `R$ ${segmentData.expectedSpend.toLocaleString('pt-BR')}`,
              `${(segmentData.conversionRate * 100).toFixed(1)}%`
            ])
          },

          {
            title: "Pacotes de Patrocínio",
            type: "packages",
            content: data.packages.map(pkg => ({
              tier: pkg.tier,
              price: pkg.price,
              expectedReach: pkg.expectedReach,
              expectedROI: pkg.expectedROI,
              benefits: pkg.benefits,
              roiHint: pkg.roiHint,
              activationSuggestions: pkg.activationSuggestions,
            }))
          },

          {
            title: "Insights Data-Driven",
            type: "bullets",
            content: data.insights
          },

          {
            title: "Argumentos Executivos",
            type: "narrative",
            content: data.salesNarrative
          },

          {
            title: "Metodologia",
            type: "methodology",
            content: [
              "Análise RFM (Recency, Frequency, Monetary) dos clientes históricos",
              "Segmentação baseada em comportamento de consumo (Heavy/Medium/Light)",
              "Projeção usando eventos análogos dos últimos 12 meses",
              "Modelos de elasticidade de demanda e sazonalidade",
              "Parâmetros conservadores com intervalos de confiança de ±15%"
            ]
          }
        ],

        footer: {
          timestamp: new Date().toISOString(),
          source: "Festi Forecast AI - Analytics Platform",
          disclaimer: "Projeções baseadas em dados históricos. Resultados podem variar."
        }
      };

      return pdfStructure;

    } catch (error) {
      console.error("Error generating PDF structure:", error);
      throw new Error("Failed to generate PDF structure");
    }
  }

  /**
   * Gerar sumário executivo em texto simples
   */
  generateExecutiveSummary(data: ExportData): string {
    const summary = [];
    
    summary.push(`OPORTUNIDADE DE PATROCÍNIO - ${data.eventInfo.genre.toUpperCase()}`);
    summary.push(`📍 ${data.eventInfo.city} • 📅 ${data.eventInfo.date || 'Data a definir'}`);
    summary.push("");
    
    summary.push("🎯 ALCANCE E AUDIÊNCIA:");
    summary.push(`• ${data.forecast.expectedReach.toLocaleString('pt-BR')} pessoas alcançadas`);
    summary.push(`• Idade média: ${data.forecast.profileHints.avgAge} anos`);
    summary.push(`• Distribuição: ${(data.forecast.profileHints.genderSplit.male * 100).toFixed(0)}% M / ${(data.forecast.profileHints.genderSplit.female * 100).toFixed(0)}% F`);
    summary.push("");
    
    summary.push("💰 POTENCIAL COMERCIAL:");
    summary.push(`• R$ ${data.forecast.expectedOnsiteSpend.toLocaleString('pt-BR')} em consumo no local previsto`);
    summary.push(`• Segmento Heavy: ${data.forecast.segments.Heavy?.expectedAudience || 0} pessoas de alto valor`);
    summary.push(`• ROI projetado: ${data.packages[0]?.expectedROI || 'N/A'} (pacote Gold)`);
    summary.push("");
    
    summary.push("🚀 OPORTUNIDADES DE ATIVAÇÃO:");
    const goldPackage = data.packages.find(p => p.tier === "Gold");
    if (goldPackage?.activationSuggestions) {
      goldPackage.activationSuggestions.slice(0, 3).forEach((suggestion: string) => {
        summary.push(`• ${suggestion}`);
      });
    }
    
    return summary.join('\n');
  }

  /**
   * Validar dados antes do export
   */
  validateExportData(data: ExportData): boolean {
    return !!(
      data.eventInfo &&
      data.forecast &&
      data.packages &&
      data.packages.length > 0 &&
      data.insights &&
      data.salesNarrative
    );
  }

  /**
   * Obter métricas de performance do relatório
   */
  getReportMetrics(data: ExportData) {
    const totalPackageValue = data.packages.reduce((sum, pkg) => sum + pkg.price, 0);
    const avgROI = data.packages.reduce((sum, pkg) => sum + parseFloat(pkg.expectedROI), 0) / data.packages.length;
    
    return {
      totalPackageValue,
      avgROI: avgROI.toFixed(1),
      segmentCount: Object.keys(data.forecast.segments).length,
      insightCount: data.insights.length,
      narrativePoints: data.salesNarrative.length,
      reportGenerated: new Date().toISOString(),
    };
  }
}