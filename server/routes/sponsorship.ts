import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config";
import { SponsorshipForecast } from "../services/sponsorship/forecast";
import { SponsorshipPricing } from "../services/sponsorship/pricing";
import { SponsorshipExport } from "../services/sponsorship/export";

const router = Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

// Initialize sponsorship services
const sponsorshipForecast = new SponsorshipForecast(supabase);
const sponsorshipPricing = new SponsorshipPricing();
const sponsorshipExport = new SponsorshipExport();

// POST /api/sponsorship/forecast → gerar previsão completa de patrocínio
router.post("/forecast", async (req, res) => {
  try {
    const {
      genre,
      city,
      targetRevenue,
      eventId,
      date,
      sponsorBudget,
      capacity
    } = req.body;

    // Validação de inputs obrigatórios
    if (!genre || !city) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["genre", "city"]
      });
    }

    console.log(`📊 Generating sponsorship forecast for ${genre} in ${city}`);

    // 1. Construir previsão de audiência e consumo
    const forecast = await sponsorshipForecast.buildSponsorForecast({
      genre,
      city,
      targetRevenue,
      eventId,
      date,
      capacity
    });

    // 2. Calcular preços de patrocínio
    const pricingInput = {
      expectedReach: forecast.expectedReach,
      expectedIncrementalRevenue: forecast.expectedOnsiteSpend * 0.06, // 6% lift estimado
      eventCapacity: capacity,
      eventGenre: genre,
      eventCity: city,
    };

    if (!sponsorshipPricing.validatePricingInputs(pricingInput)) {
      return res.status(400).json({
        error: "Invalid pricing inputs",
        details: "Expected reach and incremental revenue must be positive"
      });
    }

    const pricing = sponsorshipPricing.suggestSponsorshipPrice(pricingInput);

    // 3. Gerar narrativa de vendas
    const salesNarrative = generateSalesNarrative(forecast, pricing, { genre, city });

    // 4. Estruturar resposta final
    const response = {
      audience: forecast.audience,
      expectedReach: forecast.expectedReach,
      expectedOnsiteSpend: forecast.expectedOnsiteSpend,
      profileHints: forecast.profileHints,
      sponsorPackages: pricing.packages,
      salesNarrative,
      insights: forecast.insights,
      dataQuality: forecast.dataQuality,
      uncertainty: forecast.uncertainty,
      pricingRationale: pricing.pricingRationale,
      benchmarks: pricing.benchmarks,
      methodology: {
        description: "Análise baseada em RFM histórico, eventos análogos e modelos de elasticidade",
        sampleSize: Object.keys(forecast.audience).length,
        confidence: forecast.dataQuality,
        lastUpdated: new Date().toISOString(),
      }
    };

    console.log(`✅ Sponsorship forecast generated: ${forecast.expectedReach} reach, R$ ${forecast.expectedOnsiteSpend.toFixed(0)} spend`);

    res.json(response);

  } catch (error) {
    console.error("❌ Sponsorship forecast error:", error);
    res.status(500).json({
      error: "Failed to generate sponsorship forecast",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/sponsorship/export → gerar arquivos CSV/PDF
router.post("/export", async (req, res) => {
  try {
    const { format, data } = req.body;

    if (!format || !data) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["format", "data"]
      });
    }

    // Validar dados de export
    if (!sponsorshipExport.validateExportData(data)) {
      return res.status(400).json({
        error: "Invalid export data structure"
      });
    }

    let exportResult;
    let contentType;
    let filename;

    if (format === "csv") {
      exportResult = await sponsorshipExport.buildSponsorCSV(data);
      contentType = "text/csv";
      filename = `sponsorship-report-${Date.now()}.csv`;
    } else if (format === "pdf") {
      exportResult = await sponsorshipExport.buildSponsorPDF(data);
      contentType = "application/json"; // PDF structure as JSON
      filename = `sponsorship-report-${Date.now()}.json`;
    } else {
      return res.status(400).json({
        error: "Invalid format",
        validFormats: ["csv", "pdf"]
      });
    }

    // Definir headers apropriados
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Retornar arquivo
    if (format === "csv") {
      res.send(exportResult);
    } else {
      res.json({
        pdfStructure: exportResult,
        filename,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📄 Export generated: ${format.toUpperCase()} for ${data.eventInfo?.genre} in ${data.eventInfo?.city}`);

  } catch (error) {
    console.error("❌ Export error:", error);
    res.status(500).json({
      error: "Failed to generate export",
      message: error.message
    });
  }
});

// GET /api/sponsorship/pricing-ranges → obter ranges de preço por categoria
router.get("/pricing-ranges", (req, res) => {
  try {
    const ranges = sponsorshipPricing.getPricingRanges();
    
    res.json({
      ranges,
      currency: "BRL",
      note: "Valores em Reais Brasileiros, baseados em dados de mercado 2024-2025",
      factors: {
        genre: "Gêneros premium (Rock, Eletrônica) têm multiplicador +10-15%",
        city: "São Paulo e Rio de Janeiro têm premium de +15-20%",
        capacity: "Eventos >20k pessoas têm multiplicador +25%",
        timing: "Eventos em alta temporada têm premium adicional"
      }
    });

  } catch (error) {
    console.error("❌ Pricing ranges error:", error);
    res.status(500).json({ error: "Failed to get pricing ranges" });
  }
});

// GET /api/sponsorship/benchmarks → obter benchmarks de mercado
router.get("/benchmarks", async (req, res) => {
  try {
    // Obter benchmarks básicos do banco
    const { data: recentEvents } = await supabase
      .from("vw_event_analogs")
      .select("genre, city, revenue_per_person, occupancy_rate")
      .order("month_bucket", { ascending: false })
      .limit(50);

    // Calcular benchmarks por gênero
    const benchmarksByGenre: { [genre: string]: any } = {};
    
    if (recentEvents) {
      recentEvents.forEach(event => {
        if (!benchmarksByGenre[event.genre]) {
          benchmarksByGenre[event.genre] = {
            samples: 0,
            avgRevenuePerPerson: 0,
            avgOccupancy: 0,
          };
        }
        
        benchmarksByGenre[event.genre].samples++;
        benchmarksByGenre[event.genre].avgRevenuePerPerson += event.revenue_per_person;
        benchmarksByGenre[event.genre].avgOccupancy += event.occupancy_rate;
      });

      // Calcular médias
      Object.keys(benchmarksByGenre).forEach(genre => {
        const data = benchmarksByGenre[genre];
        data.avgRevenuePerPerson = Math.round(data.avgRevenuePerPerson / data.samples);
        data.avgOccupancy = Math.round((data.avgOccupancy / data.samples) * 100) / 100;
      });
    }

    res.json({
      benchmarksByGenre,
      marketAverages: {
        cpmRange: { min: 15, max: 80 },
        cpaRange: { min: 25, max: 150 },
        sponsorshipROI: { min: 120, max: 350 }, // % 
      },
      lastUpdated: new Date().toISOString(),
      sampleSize: recentEvents?.length || 0,
    });

  } catch (error) {
    console.error("❌ Benchmarks error:", error);
    res.status(500).json({ error: "Failed to get benchmarks" });
  }
});

// Função auxiliar para gerar narrativa de vendas
function generateSalesNarrative(forecast: any, pricing: any, eventInfo: any): string[] {
  const narrative = [];

  // Argumento 1: Audiência qualificada
  const heavyPct = forecast.audience.Heavy ? 
    (forecast.audience.Heavy.expectedAudience / forecast.expectedReach * 100).toFixed(0) : 0;
  
  if (heavyPct > 15) {
    narrative.push(
      `Audiência Heavy representa ${heavyPct}% do público com LTV 3.2x superior à média e alta afinidade por marcas premium`
    );
  }

  // Argumento 2: Performance do gênero
  const genreMultiplier = pricing.pricingRationale.genreBonus;
  if (genreMultiplier > 0.1) {
    narrative.push(
      `Gênero ${eventInfo.genre} demonstra +${(genreMultiplier * 100).toFixed(0)}% de performance em ativações comparado à média do mercado`
    );
  }

  // Argumento 3: Potencial de conversão
  const totalConversion = Object.values(forecast.audience)
    .reduce((sum: number, segment: any) => sum + segment.conversionRate, 0) / 3;
  
  narrative.push(
    `Taxa de conversão projetada de ${(totalConversion * 100).toFixed(1)}% baseada em análise de ${Object.keys(forecast.audience).length} segmentos comportamentais`
  );

  // Argumento 4: ROI data-driven
  const goldPackage = pricing.packages.find((p: any) => p.tier === "Gold");
  if (goldPackage) {
    narrative.push(
      `ROI projetado de ${goldPackage.expectedROI} com ativações premium incluindo cashback automático para clientes Heavy`
    );
  }

  // Argumento 5: Oportunidade de mercado
  if (eventInfo.city === "São Paulo" || eventInfo.city === "Rio de Janeiro") {
    narrative.push(
      `Mercado ${eventInfo.city} oferece premium de +${(pricing.pricingRationale.marketPremium * 100).toFixed(0)}% em valor de patrocínio devido ao alto poder aquisitivo da audiência`
    );
  }

  return narrative.slice(0, 5); // Retornar top 5 argumentos
}

export default router;