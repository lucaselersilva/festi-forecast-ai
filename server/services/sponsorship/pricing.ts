/**
 * Sponsorship Pricing Service
 * 
 * Sugere preços de patrocínio baseados em alcance esperado,
 * receita incremental e tiers de ativação
 */

interface SponsorshipPricingInput {
  expectedReach: number;
  expectedIncrementalRevenue: number;
  eventCapacity?: number;
  eventGenre?: string;
  eventCity?: string;
}

interface SponsorshipPackage {
  tier: "Gold" | "Silver" | "Bronze";
  price: number;
  benefits: string[];
  roiHint: string;
  activationSuggestions: string[];
  expectedReach: number;
  expectedROI: string;
}

interface SponsorshipPricingResult {
  packages: SponsorshipPackage[];
  pricingRationale: {
    reachMultiplier: number;
    revenueMultiplier: number;
    genreBonus: number;
    marketPremium: number;
  };
  benchmarks: {
    cpmEquivalent: number;
    cpaEquivalent: number;
  };
}

export class SponsorshipPricing {
  // Configuração de pricing (vem do .env em produção)
  private readonly PRICING_ALPHA = 0.8; // R$ por alcance qualificado
  private readonly PRICING_BETA = 0.2;  // % da receita incremental
  private readonly LIFT_DEFAULT = 0.05; // 5% lift padrão
  
  // Bounds de preço (em reais)
  private readonly MIN_PACKAGE_PRICE = 5000;
  private readonly MAX_PACKAGE_PRICE = 500000;

  /**
   * Sugere preços de patrocínio por tier
   */
  suggestSponsorshipPrice(input: SponsorshipPricingInput): SponsorshipPricingResult {
    try {
      // Calcular preço base
      const basePrice = this.calculateBasePrice(input);
      
      // Aplicar ajustes por gênero e mercado
      const adjustedPrice = this.applyMarketAdjustments(basePrice, input);
      
      // Gerar packages por tier
      const packages = this.generatePackageTiers(adjustedPrice, input);
      
      // Calcular métricas de benchmark
      const benchmarks = this.calculateBenchmarks(adjustedPrice, input);
      
      // Gerar rationale de pricing
      const pricingRationale = this.buildPricingRationale(input);

      return {
        packages,
        pricingRationale,
        benchmarks,
      };

    } catch (error) {
      console.error("Error in sponsorship pricing:", error);
      throw new Error("Failed to calculate sponsorship pricing");
    }
  }

  /**
   * Calcular preço base usando fórmula α * reach + β * incremental_revenue
   */
  private calculateBasePrice(input: SponsorshipPricingInput): number {
    const reachComponent = input.expectedReach * this.PRICING_ALPHA;
    const revenueComponent = input.expectedIncrementalRevenue * this.PRICING_BETA;
    
    const basePrice = reachComponent + revenueComponent;
    
    // Aplicar bounds
    return Math.max(
      this.MIN_PACKAGE_PRICE,
      Math.min(this.MAX_PACKAGE_PRICE, basePrice)
    );
  }

  /**
   * Aplicar ajustes por gênero musical e cidade
   */
  private applyMarketAdjustments(basePrice: number, input: SponsorshipPricingInput): number {
    let adjustedPrice = basePrice;

    // Ajuste por gênero (premium genres command higher prices)
    const genreMultipliers: { [genre: string]: number } = {
      "Rock": 1.15,
      "Eletrônica": 1.12,
      "Funk": 1.08,
      "Sertanejo": 1.05,
      "Pop": 1.10,
      "Forró": 1.02,
      "MPB": 1.00,
      "Rap": 1.06,
      "Indie": 1.08,
      "Pagode": 1.00,
    };

    if (input.eventGenre && genreMultipliers[input.eventGenre]) {
      adjustedPrice *= genreMultipliers[input.eventGenre];
    }

    // Ajuste por cidade (mercados premium)
    const cityMultipliers: { [city: string]: number } = {
      "São Paulo": 1.20,
      "Rio de Janeiro": 1.15,
      "Belo Horizonte": 1.05,
      "Brasília": 1.08,
      "Salvador": 1.00,
      "Fortaleza": 0.95,
      "Recife": 0.98,
      "Florianópolis": 1.10,
    };

    if (input.eventCity && cityMultipliers[input.eventCity]) {
      adjustedPrice *= cityMultipliers[input.eventCity];
    }

    // Ajuste por capacidade (eventos grandes = premium)
    if (input.eventCapacity) {
      if (input.eventCapacity > 20000) {
        adjustedPrice *= 1.25; // Mega eventos
      } else if (input.eventCapacity > 10000) {
        adjustedPrice *= 1.15; // Grandes eventos
      } else if (input.eventCapacity > 5000) {
        adjustedPrice *= 1.08; // Eventos médios
      }
    }

    return Math.round(adjustedPrice);
  }

  /**
   * Gerar packages por tier (Gold, Silver, Bronze)
   */
  private generatePackageTiers(adjustedPrice: number, input: SponsorshipPricingInput): SponsorshipPackage[] {
    const packages: SponsorshipPackage[] = [];

    // Gold Package (100% do preço calculado)
    packages.push({
      tier: "Gold",
      price: Math.round(adjustedPrice),
      benefits: [
        "Naming rights do evento",
        "Logo em todas as peças de marketing",
        "Ativação premium no local (stand 4x4m)",
        "Branded bar ou zona VIP",
        "Push notifications segmentados",
        "Cupom de desconto no checkout",
        "Relatório completo de performance",
        "Direitos de imagem e vídeo"
      ],
      roiHint: this.calculateROIHint(adjustedPrice, input.expectedIncrementalRevenue, 1.0),
      activationSuggestions: [
        "Bebidas branded exclusivas",
        "QR codes nos pontos de venda",
        "Contest/sorteio com prêmios",
        "Cashback automático Heavy customers"
      ],
      expectedReach: input.expectedReach,
      expectedROI: this.calculateExpectedROI(adjustedPrice, input.expectedIncrementalRevenue * 1.2),
    });

    // Silver Package (70% do preço)
    const silverPrice = Math.round(adjustedPrice * 0.7);
    packages.push({
      tier: "Silver",
      price: silverPrice,
      benefits: [
        "Co-naming do evento",
        "Logo em peças selecionadas",
        "Ativação no local (stand 3x3m)",
        "Branded drinks/combos",
        "Push notifications básicos",
        "Desconto no checkout",
        "Relatório de performance"
      ],
      roiHint: this.calculateROIHint(silverPrice, input.expectedIncrementalRevenue, 0.8),
      activationSuggestions: [
        "Combos promocionais branded",
        "Sampling no local",
        "Desconto progressivo Heavy customers"
      ],
      expectedReach: Math.round(input.expectedReach * 0.8),
      expectedROI: this.calculateExpectedROI(silverPrice, input.expectedIncrementalRevenue * 1.0),
    });

    // Bronze Package (45% do preço)
    const bronzePrice = Math.round(adjustedPrice * 0.45);
    packages.push({
      tier: "Bronze",
      price: bronzePrice,
      benefits: [
        "Logo em peças digitais",
        "Menção em redes sociais",
        "Stand básico (2x2m)",
        "Cupom de desconto simples",
        "Relatório básico"
      ],
      roiHint: this.calculateROIHint(bronzePrice, input.expectedIncrementalRevenue, 0.6),
      activationSuggestions: [
        "Desconto no bar",
        "Brinde na entrada",
        "Menção no palco"
      ],
      expectedReach: Math.round(input.expectedReach * 0.6),
      expectedROI: this.calculateExpectedROI(bronzePrice, input.expectedIncrementalRevenue * 0.8),
    });

    return packages;
  }

  /**
   * Calcular ROI hint para o package
   */
  private calculateROIHint(packagePrice: number, expectedRevenue: number, effectivenessMultiplier: number): string {
    const expectedReturn = expectedRevenue * effectivenessMultiplier;
    const roi = ((expectedReturn - packagePrice) / packagePrice) * 100;
    
    if (roi > 100) {
      return `ROI projetado de +${roi.toFixed(0)}% com receita incremental estimada`;
    } else if (roi > 50) {
      return `ROI sólido de ${roi.toFixed(0)}% baseado em ativações similares`;
    } else if (roi > 0) {
      return `ROI positivo de ${roi.toFixed(0)}% com potencial de expansão`;
    } else {
      return `Investimento em branding com retorno em awareness e fidelização`;
    }
  }

  /**
   * Calcular ROI esperado em formato string
   */
  private calculateExpectedROI(investment: number, expectedReturn: number): string {
    const roi = ((expectedReturn - investment) / investment) * 100;
    return `${roi.toFixed(0)}%`;
  }

  /**
   * Calcular benchmarks de mercado (CPM, CPA)
   */
  private calculateBenchmarks(adjustedPrice: number, input: SponsorshipPricingInput) {
    // CPM equivalente (custo por mil impressões)
    const cpmEquivalent = (adjustedPrice / input.expectedReach) * 1000;
    
    // CPA equivalente (assumindo conversão de 15% do reach para ação)
    const estimatedActions = input.expectedReach * 0.15;
    const cpaEquivalent = adjustedPrice / estimatedActions;

    return {
      cpmEquivalent: Math.round(cpmEquivalent * 100) / 100,
      cpaEquivalent: Math.round(cpaEquivalent * 100) / 100,
    };
  }

  /**
   * Construir rationale de pricing para transparência
   */
  private buildPricingRationale(input: SponsorshipPricingInput) {
    return {
      reachMultiplier: this.PRICING_ALPHA,
      revenueMultiplier: this.PRICING_BETA,
      genreBonus: this.getGenreBonus(input.eventGenre),
      marketPremium: this.getMarketPremium(input.eventCity),
    };
  }

  /**
   * Obter bônus de gênero aplicado
   */
  private getGenreBonus(genre?: string): number {
    const bonuses: { [genre: string]: number } = {
      "Rock": 0.15,
      "Eletrônica": 0.12,
      "Funk": 0.08,
      "Pop": 0.10,
    };
    return bonuses[genre || ""] || 0;
  }

  /**
   * Obter premium de mercado aplicado
   */
  private getMarketPremium(city?: string): number {
    const premiums: { [city: string]: number } = {
      "São Paulo": 0.20,
      "Rio de Janeiro": 0.15,
      "Florianópolis": 0.10,
      "Brasília": 0.08,
    };
    return premiums[city || ""] || 0;
  }

  /**
   * Validar inputs de pricing
   */
  validatePricingInputs(input: SponsorshipPricingInput): boolean {
    return input.expectedReach > 0 && input.expectedIncrementalRevenue >= 0;
  }

  /**
   * Obter ranges de preço por categoria de evento
   */
  getPricingRanges(): { [category: string]: { min: number; max: number } } {
    return {
      "festival": { min: 50000, max: 500000 },
      "show": { min: 10000, max: 200000 },
      "evento_corporativo": { min: 5000, max: 100000 },
      "balada": { min: 3000, max: 50000 },
    };
  }
}