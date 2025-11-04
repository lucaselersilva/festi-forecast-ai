// Semantic naming and analysis helpers for customer segmentation

export interface RFMMetrics {
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
}

export interface Percentiles {
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

export interface SegmentInsight {
  name: string;
  description: string;
  characteristics: string[];
  strategies: string[];
  priority: 'high' | 'medium' | 'low';
  color: string;
}

// Get semantic name for RFM cluster based on metrics
export function getRFMSegmentName(metrics: RFMMetrics): SegmentInsight {
  const { avgRecency, avgFrequency, avgMonetary } = metrics;
  
  // Normalize values (assuming recency: lower is better, frequency/monetary: higher is better)
  const isRecentBuyer = avgRecency < 30;
  const isModerateRecency = avgRecency >= 30 && avgRecency < 90;
  const isHighFrequency = avgFrequency > 5;
  const isModerateFrequency = avgFrequency >= 2 && avgFrequency <= 5;
  const isHighValue = avgMonetary > 500;
  const isModerateValue = avgMonetary >= 200 && avgMonetary <= 500;
  
  // Champions - Best customers
  if (isRecentBuyer && isHighFrequency && isHighValue) {
    return {
      name: 'Campeões',
      description: 'Clientes premium que compram frequentemente e gastam muito',
      characteristics: [
        'Compra recente (< 30 dias)',
        'Alta frequência de interações',
        'Alto valor monetário',
        'Base de clientes mais valiosa'
      ],
      strategies: [
        'Programas VIP e benefícios exclusivos',
        'Acesso antecipado a novos eventos',
        'Comunicação personalizada',
        'Recompensas por fidelidade'
      ],
      priority: 'high',
      color: 'hsl(142 76% 36%)'
    };
  }
  
  // Loyal Customers
  if (isRecentBuyer && isHighFrequency) {
    return {
      name: 'Clientes Fiéis',
      description: 'Engajados e frequentes, com potencial de crescimento',
      characteristics: [
        'Compra recente e regular',
        'Alta frequência',
        'Valor médio a alto',
        'Forte conexão com a marca'
      ],
      strategies: [
        'Upsell para categorias premium',
        'Programas de recomendação',
        'Eventos exclusivos',
        'Cross-sell de produtos relacionados'
      ],
      priority: 'high',
      color: 'hsl(266 100% 78%)'
    };
  }
  
  // Big Spenders
  if (isHighValue && !isHighFrequency) {
    return {
      name: 'Grandes Gastadores',
      description: 'Alto ticket médio mas baixa frequência de compra',
      characteristics: [
        'Compras de alto valor',
        'Frequência moderada ou baixa',
        'Busca experiências premium',
        'Sensível à qualidade, não ao preço'
      ],
      strategies: [
        'Ofertas VIP e pacotes premium',
        'Eventos exclusivos e limitados',
        'Experiências personalizadas',
        'Aumentar frequência com incentivos especiais'
      ],
      priority: 'high',
      color: 'hsl(261 83% 58%)'
    };
  }
  
  // Promising/New Customers
  if (isRecentBuyer && !isHighFrequency && !isHighValue) {
    return {
      name: 'Promissores',
      description: 'Clientes novos ou recentes com potencial de crescimento',
      characteristics: [
        'Compra recente',
        'Baixa frequência (ainda)',
        'Valor moderado',
        'Em fase de conhecimento da marca'
      ],
      strategies: [
        'Onboarding e educação sobre eventos',
        'Ofertas de boas-vindas',
        'Aumentar engajamento com conteúdo',
        'Incentivos para segunda compra'
      ],
      priority: 'medium',
      color: 'hsl(142 71% 45%)'
    };
  }
  
  // At Risk
  if (!isRecentBuyer && isModerateRecency && (isHighValue || isModerateValue)) {
    return {
      name: 'Em Risco',
      description: 'Clientes valiosos que estão se afastando',
      characteristics: [
        'Sem compras recentes (30-90 dias)',
        'Histórico de valor alto/médio',
        'Frequência em declínio',
        'Risco de perda'
      ],
      strategies: [
        'Campanhas de reativação urgentes',
        'Ofertas personalizadas e descontos',
        'Pesquisa de satisfação',
        'Comunicação win-back'
      ],
      priority: 'high',
      color: 'hsl(38 92% 50%)'
    };
  }
  
  // Hibernating
  if (!isRecentBuyer && !isModerateRecency) {
    return {
      name: 'Hibernando',
      description: 'Clientes inativos há muito tempo',
      characteristics: [
        'Sem compras há mais de 90 dias',
        'Baixo engajamento atual',
        'Valor histórico variável',
        'Possível churn'
      ],
      strategies: [
        'Campanhas de reengajamento agressivas',
        'Ofertas especiais de retorno',
        'Remarketing direcionado',
        'Avaliação de custo-benefício de reativação'
      ],
      priority: 'low',
      color: 'hsl(240 5% 64.9%)'
    };
  }
  
  // Need Attention
  if (isModerateRecency && isModerateFrequency) {
    return {
      name: 'Necessita Atenção',
      description: 'Clientes regulares que podem declinar sem ação',
      characteristics: [
        'Recência moderada',
        'Frequência moderada',
        'Valor médio',
        'Estável mas sem crescimento'
      ],
      strategies: [
        'Aumentar engajamento com conteúdo',
        'Ofertas baseadas em preferências',
        'Programas de fidelidade',
        'Comunicação regular e relevante'
      ],
      priority: 'medium',
      color: 'hsl(210 40% 56%)'
    };
  }
  
  // Default - Casual Customers
  return {
    name: 'Ocasionais',
    description: 'Clientes esporádicos com baixo engajamento',
    characteristics: [
      'Compras ocasionais',
      'Baixa frequência e valor',
      'Engajamento limitado',
      'Sensível a promoções'
    ],
    strategies: [
      'Ofertas promocionais atrativas',
      'Aumentar awareness da marca',
      'Campanhas de conversão',
      'Incentivar primeira compra recorrente'
    ],
    priority: 'low',
    color: 'hsl(240 3.7% 15.9%)'
  };
}

// Get demographic segment insights
export function getDemographicInsight(
  ageSegment: string,
  gender: string,
  city: string
): SegmentInsight {
  const ageGroup = ageSegment.toLowerCase();
  
  if (ageGroup.includes('18-25')) {
    return {
      name: 'Jovens Urbanos',
      description: 'Audiência jovem, digital e trendy',
      characteristics: [
        'Alta presença digital',
        'Busca experiências sociais',
        'Influenciados por redes sociais',
        'Orçamento limitado mas engajados'
      ],
      strategies: [
        'Marketing em redes sociais',
        'Influencer partnerships',
        'Eventos acessíveis e instagramáveis',
        'Promoções para grupos'
      ],
      priority: 'high',
      color: 'hsl(266 100% 78%)'
    };
  }
  
  if (ageGroup.includes('26-35')) {
    return {
      name: 'Profissionais Estabelecidos',
      description: 'Público com poder aquisitivo e busca por qualidade',
      characteristics: [
        'Poder aquisitivo médio-alto',
        'Valoriza experiências premium',
        'Equilibra vida social e profissional',
        'Influenciador de tendências'
      ],
      strategies: [
        'Eventos premium e exclusivos',
        'Networking e experiências únicas',
        'Comunicação profissional',
        'Pacotes corporativos'
      ],
      priority: 'high',
      color: 'hsl(261 83% 58%)'
    };
  }
  
  if (ageGroup.includes('36-50')) {
    return {
      name: 'Famílias Consolidadas',
      description: 'Público maduro com família e estabilidade',
      characteristics: [
        'Alto poder aquisitivo',
        'Busca eventos familiares',
        'Valoriza conforto e segurança',
        'Lealdade à marca'
      ],
      strategies: [
        'Eventos family-friendly',
        'Pacotes familiares',
        'Infraestrutura confortável',
        'Programas de fidelidade'
      ],
      priority: 'medium',
      color: 'hsl(142 76% 36%)'
    };
  }
  
  return {
    name: 'Entusiastas Maduros',
    description: 'Público experiente e apaixonado por cultura',
    characteristics: [
      'Alta lealdade e experiência',
      'Valoriza qualidade acima de tudo',
      'Disposição para investir',
      'Networking estabelecido'
    ],
    strategies: [
      'Eventos culturais premium',
      'Experiências exclusivas',
      'Relacionamento personalizado',
      'Club memberships'
    ],
    priority: 'medium',
    color: 'hsl(38 92% 50%)'
  };
}

// Get behavioral segment insights
export function getBehavioralInsight(
  avgDaysBetween: number,
  avgDaysBefore: number
): SegmentInsight {
  const isImpulsive = avgDaysBefore < 7;
  const isPlanner = avgDaysBefore > 30;
  const isFrequent = avgDaysBetween < 30;
  
  if (isImpulsive && isFrequent) {
    return {
      name: 'Compradores Impulsivos',
      description: 'Decidem rápido e compram frequentemente',
      characteristics: [
        'Decisão de compra rápida',
        'Alta frequência',
        'Sensível a urgência',
        'Móvel como canal principal'
      ],
      strategies: [
        'Flash sales e ofertas relâmpago',
        'Notificações push estratégicas',
        'FOMO marketing',
        'Checkout simplificado'
      ],
      priority: 'high',
      color: 'hsl(0 62.8% 50%)'
    };
  }
  
  if (isPlanner) {
    return {
      name: 'Planejadores',
      description: 'Pesquisam e planejam compras com antecedência',
      characteristics: [
        'Compra com 30+ dias de antecedência',
        'Pesquisa extensiva',
        'Valoriza informação completa',
        'Busca melhor custo-benefício'
      ],
      strategies: [
        'Early bird discounts',
        'Informação detalhada do evento',
        'Email marketing educativo',
        'Conteúdo de planejamento'
      ],
      priority: 'medium',
      color: 'hsl(210 40% 56%)'
    };
  }
  
  return {
    name: 'Caçadores de Oportunidade',
    description: 'Buscam o melhor momento para comprar',
    characteristics: [
      'Timing médio de compra',
      'Sensível a promoções',
      'Compara preços',
      'Aguarda momento certo'
    ],
    strategies: [
      'Promoções estratégicas',
      'Remarketing inteligente',
      'Ofertas por tempo limitado',
      'Price match garantees'
    ],
    priority: 'medium',
    color: 'hsl(38 92% 50%)'
  };
}

// Get musical preference insights
export function getMusicalInsight(preferredGenre: string): SegmentInsight {
  const genre = preferredGenre.toLowerCase();
  
  const genreMap: { [key: string]: SegmentInsight } = {
    rock: {
      name: 'Rockeiros',
      description: 'Fãs de rock clássico e alternativo',
      characteristics: [
        'Lealdade a artistas',
        'Valoriza autenticidade',
        'Comunidade forte',
        'Merchandising importante'
      ],
      strategies: [
        'Meet & greets',
        'Merchandise exclusivo',
        'Experiências backstage',
        'Comunidade de fãs'
      ],
      priority: 'high',
      color: 'hsl(0 62.8% 50%)'
    },
    pop: {
      name: 'Pop Lovers',
      description: 'Audiência mainstream e diversa',
      characteristics: [
        'Grande volume',
        'Diversos demograficamente',
        'Alta viralidade social',
        'Sensível a tendências'
      ],
      strategies: [
        'Marketing viral',
        'Influencer campaigns',
        'Social media activation',
        'Experiências instagramáveis'
      ],
      priority: 'high',
      color: 'hsl(266 100% 78%)'
    },
    sertanejo: {
      name: 'Sertanejos',
      description: 'Fãs do gênero mais popular do Brasil',
      characteristics: [
        'Alta frequência de eventos',
        'Gasto médio-alto em bar',
        'Valoriza festa e convívio',
        'Lealdade regional'
      ],
      strategies: [
        'Experiência de balada completa',
        'Pacotes de bebidas',
        'Camarotes e áreas VIP',
        'Marketing regional'
      ],
      priority: 'high',
      color: 'hsl(142 76% 36%)'
    },
    eletronica: {
      name: 'Eletrônicos',
      description: 'Audiência de música eletrônica e festivais',
      characteristics: [
        'Busca experiência imersiva',
        'Alta disposição para gastar',
        'Valoriza produção e tecnologia',
        'Comunidade global'
      ],
      strategies: [
        'Experiências audiovisuais',
        'Festivais multi-day',
        'Branding tech-forward',
        'Lineup curado'
      ],
      priority: 'high',
      color: 'hsl(261 83% 58%)'
    }
  };
  
  return genreMap[genre] || {
    name: 'Eclíticos',
    description: 'Audiência diversa com gostos variados',
    characteristics: [
      'Aberto a diversos gêneros',
      'Busca qualidade sobre gênero',
      'Descoberta de novos artistas',
      'Influenciador cultural'
    ],
    strategies: [
      'Line-ups diversificados',
      'Curadoria de qualidade',
      'Descoberta de artistas',
      'Experiências únicas'
    ],
    priority: 'medium',
    color: 'hsl(280 60% 60%)'
  };
}

// ============= DYNAMIC SEGMENTATION WITH PERCENTILES =============

// Dynamic RFM segmentation using percentiles
export function getRFMSegmentNameDynamic(metrics: RFMMetrics, percentiles: Percentiles): SegmentInsight {
  if (!percentiles.recency || !percentiles.frequency || !percentiles.monetary) {
    return getRFMSegmentName(metrics);
  }

  const { avgRecency, avgFrequency, avgMonetary } = metrics;
  const { recency: rPerc, frequency: fPerc, monetary: mPerc } = percentiles;
  
  // Classify each metric into quartiles (lower is better for recency, higher is better for frequency/monetary)
  const recencyQuartile = avgRecency <= rPerc.p25 ? 4 : avgRecency <= rPerc.p50 ? 3 : avgRecency <= rPerc.p75 ? 2 : 1;
  const frequencyQuartile = avgFrequency >= fPerc.p75 ? 4 : avgFrequency >= fPerc.p50 ? 3 : avgFrequency >= fPerc.p25 ? 2 : 1;
  const monetaryQuartile = avgMonetary >= mPerc.p75 ? 4 : avgMonetary >= mPerc.p50 ? 3 : avgMonetary >= mPerc.p25 ? 2 : 1;
  
  // Calculate RFM Score (4-12 range per metric)
  const rfmScore = recencyQuartile + frequencyQuartile + monetaryQuartile;
  
  // Elite Champions: Top 25% in all dimensions
  if (recencyQuartile === 4 && frequencyQuartile === 4 && monetaryQuartile === 4) {
    return {
      name: 'Campeões Elite',
      description: 'Top 25% em todas as dimensões - clientes mais valiosos',
      characteristics: [
        `Recência excelente (≤ ${rPerc.p25.toFixed(0)} dias)`,
        `Frequência muito alta (≥ ${fPerc.p75.toFixed(0)} interações)`,
        `Valor monetário premium (≥ R$ ${mPerc.p75.toFixed(0)})`,
        'Probabilidade de compra futura: 90%+'
      ],
      strategies: [
        'Programas VIP ultra-exclusivos',
        'Concierge service dedicado',
        'Acesso antecipado garantido',
        'Eventos privados e meet & greets'
      ],
      priority: 'high',
      color: 'hsl(142 76% 36%)'
    };
  }
  
  // Premium Champions: High in 2 dimensions, good in 1
  if (rfmScore >= 11 && (recencyQuartile >= 3 || frequencyQuartile >= 3 || monetaryQuartile >= 3)) {
    return {
      name: 'Campeões Premium',
      description: 'Excelentes em 2+ dimensões - base premium',
      characteristics: [
        `Recência: ${avgRecency.toFixed(0)} dias`,
        `Frequência: ${avgFrequency.toFixed(0)} interações`,
        `Valor: R$ ${avgMonetary.toFixed(0)}`,
        'Mix de alta performance'
      ],
      strategies: [
        'Programa VIP com benefícios',
        'Upgrades automáticos',
        'Comunicação personalizada',
        'Recompensas por lealdade'
      ],
      priority: 'high',
      color: 'hsl(142 71% 45%)'
    };
  }
  
  // Big Spenders Premium: Top monetary, moderate frequency
  if (monetaryQuartile === 4 && frequencyQuartile <= 2) {
    return {
      name: 'Grandes Gastadores Premium',
      description: 'Alto valor de ticket mas frequência moderada',
      characteristics: [
        `Valor monetário premium (≥ R$ ${mPerc.p75.toFixed(0)})`,
        'Frequência moderada - potencial de aumento',
        'Busca experiências VIP exclusivas',
        'ROI alto por cliente'
      ],
      strategies: [
        'Pacotes VIP ultra-premium',
        'Experiências exclusivas limitadas',
        'Incentivos de frequência premium',
        'Eventos private label'
      ],
      priority: 'high',
      color: 'hsl(261 83% 58%)'
    };
  }
  
  // Big Spenders Regular: Good monetary, lower frequency
  if (monetaryQuartile >= 3 && frequencyQuartile <= 2) {
    return {
      name: 'Grandes Gastadores',
      description: 'Bom valor de ticket com oportunidade de aumentar frequência',
      characteristics: [
        `Valor acima da mediana (≥ R$ ${mPerc.p50.toFixed(0)})`,
        'Frequência abaixo do ideal',
        'Valoriza qualidade sobre quantidade',
        'Potencial de loyalty'
      ],
      strategies: [
        'Ofertas VIP e premium',
        'Programas de frequência incentivados',
        'Experiências personalizadas',
        'Bundle deals para múltiplos eventos'
      ],
      priority: 'high',
      color: 'hsl(266 85% 64%)'
    };
  }
  
  // Loyal Actives: High frequency, recent, moderate monetary
  if (recencyQuartile >= 3 && frequencyQuartile >= 3 && monetaryQuartile >= 2) {
    return {
      name: 'Clientes Fiéis Ativos',
      description: 'Alta frequência e recência - base leal',
      characteristics: [
        'Compras recentes e regulares',
        `Frequência alta (≥ ${fPerc.p50.toFixed(0)} interações)`,
        'Valor médio-alto por transação',
        'Forte conexão com a marca'
      ],
      strategies: [
        'Upsell para categorias premium',
        'Programas de referral',
        'Early access benefits',
        'Eventos exclusivos para loyals'
      ],
      priority: 'high',
      color: 'hsl(266 100% 78%)'
    };
  }
  
  // Promising New: Recent, low frequency, low-moderate value
  if (recencyQuartile >= 3 && frequencyQuartile <= 2 && monetaryQuartile <= 2) {
    return {
      name: 'Promissores Recentes',
      description: 'Novos ou recém-engajados com potencial de crescimento',
      characteristics: [
        `Compra muito recente (≤ ${rPerc.p50.toFixed(0)} dias)`,
        'Baixa frequência histórica - em fase inicial',
        'Valor moderado - espaço para crescer',
        'Alta probabilidade de conversão'
      ],
      strategies: [
        'Programa de onboarding estruturado',
        'Ofertas de boas-vindas agressivas',
        'Educação sobre lineup e eventos',
        'Incentivos para 2ª e 3ª compra'
      ],
      priority: 'medium',
      color: 'hsl(142 65% 50%)'
    };
  }
  
  // At Risk: Moderate recency, historically good value
  if (recencyQuartile === 2 && (monetaryQuartile >= 3 || frequencyQuartile >= 3)) {
    return {
      name: 'Em Risco de Churn',
      description: 'Clientes valiosos mostrando sinais de afastamento',
      characteristics: [
        `Última compra: ${avgRecency.toFixed(0)} dias (${rPerc.p50.toFixed(0)}-${rPerc.p75.toFixed(0)} dias)`,
        'Histórico de bom valor ou frequência',
        'Tendência de declínio visível',
        'Janela crítica de retenção'
      ],
      strategies: [
        'Campanhas de win-back urgentes',
        'Ofertas personalizadas e exclusivas',
        'Pesquisa de satisfação proativa',
        'Desconto significativo para retorno'
      ],
      priority: 'high',
      color: 'hsl(38 92% 50%)'
    };
  }
  
  // Hibernating Lost: Long recency, any value
  if (recencyQuartile === 1) {
    return {
      name: 'Hibernando - Perdidos',
      description: 'Inativos há muito tempo - necessita reativação agressiva',
      characteristics: [
        `Última compra há ${avgRecency.toFixed(0)} dias (> ${rPerc.p75.toFixed(0)} dias)`,
        'Engajamento nulo ou muito baixo',
        'Alto risco de churn permanente',
        'Custo-benefício de reativação questionável'
      ],
      strategies: [
        'Campanhas de reengajamento massivas',
        'Ofertas "última chance" agressivas',
        'Remarketing multi-canal',
        'Avaliar ROI de reativação vs custo'
      ],
      priority: 'low',
      color: 'hsl(240 5% 64.9%)'
    };
  }
  
  // Moderate Regulars: Middle of the pack in most dimensions
  if (rfmScore >= 7 && rfmScore <= 9) {
    return {
      name: 'Regulares Moderados',
      description: 'Clientes médios com potencial de crescimento',
      characteristics: [
        'Performance mediana em todas métricas',
        `Frequência: ${avgFrequency.toFixed(0)} (mediana: ${fPerc.p50.toFixed(0)})`,
        `Valor: R$ ${avgMonetary.toFixed(0)} (mediana: R$ ${mPerc.p50.toFixed(0)})`,
        'Base estável mas sem destaque'
      ],
      strategies: [
        'Programas de incentivo para upsell',
        'Ofertas baseadas em preferências',
        'Aumentar engajamento gradual',
        'Comunicação regular e relevante'
      ],
      priority: 'medium',
      color: 'hsl(210 40% 56%)'
    };
  }
  
  // Occasional Low Value: Bottom quartile in most metrics
  return {
    name: 'Ocasionais de Baixo Valor',
    description: 'Engajamento mínimo - segmento de conversão',
    characteristics: [
      `Valor baixo (< R$ ${mPerc.p25.toFixed(0)})`,
      `Frequência baixa (< ${fPerc.p25.toFixed(0)} interações)`,
      'Engajamento esporádico',
      'Sensível a preço e promoções'
    ],
    strategies: [
      'Promoções agressivas de conversão',
      'Ofertas entry-level acessíveis',
      'Marketing de awareness',
      'Primeira compra recorrente incentivada'
    ],
    priority: 'low',
    color: 'hsl(240 3.7% 15.9%)'
  };
}

// Dynamic demographic segmentation using age percentiles
export function getDemographicInsightDynamic(
  age: number,
  gender: string,
  city: string,
  percentiles: Percentiles
): SegmentInsight {
  if (!percentiles.age) {
    const ageSegment = age < 25 ? '18-24' : age < 35 ? '25-34' : age < 50 ? '35-49' : '50+';
    return getDemographicInsight(ageSegment, gender, city);
  }

  const { age: agePerc } = percentiles;
  
  // Very Young (bottom 25%)
  if (age <= agePerc.p25) {
    return {
      name: 'Jovens (até ' + agePerc.p25.toFixed(0) + ' anos)',
      description: `Audiência mais jovem (≤ ${agePerc.p25.toFixed(0)} anos) - digital natives`,
      characteristics: [
        'Nativos digitais e mobile-first',
        'Alta presença em redes sociais',
        'Influenciados por trends e virais',
        'Busca experiências instagramáveis',
        'Orçamento limitado mas engajados'
      ],
      strategies: [
        'Marketing TikTok e Instagram heavy',
        'Parcerias com micro-influencers',
        'Eventos acessíveis e "Instagramáveis"',
        'Promoções para grupos de amigos',
        'User-generated content campaigns'
      ],
      priority: 'high',
      color: 'hsl(266 100% 78%)'
    };
  }
  
  // Young Adults (25-50%)
  if (age <= agePerc.p50) {
    return {
      name: 'Adultos Jovens (' + agePerc.p25.toFixed(0) + '-' + agePerc.p50.toFixed(0) + ' anos)',
      description: `Adultos jovens (${agePerc.p25.toFixed(0)}-${agePerc.p50.toFixed(0)} anos) - profissionais em ascensão`,
      characteristics: [
        'Poder aquisitivo crescente',
        'Equilibram vida social e profissional',
        'Valorizam experiências sobre bens',
        'Early adopters de tecnologia',
        'Influenciadores culturais'
      ],
      strategies: [
        'Experiências premium e networking',
        'Eventos after-work e happy hours',
        'Marketing de experiência',
        'Pacotes corporativos',
        'Programa de fidelidade sofisticado'
      ],
      priority: 'high',
      color: 'hsl(261 83% 58%)'
    };
  }
  
  // Middle Age (50-75%)
  if (age <= agePerc.p75) {
    return {
      name: 'Meia-Idade (' + agePerc.p50.toFixed(0) + '-' + agePerc.p75.toFixed(0) + ' anos)',
      description: `Meia-idade (${agePerc.p50.toFixed(0)}-${agePerc.p75.toFixed(0)} anos) - alto poder aquisitivo`,
      characteristics: [
        'Alto poder aquisitivo estabelecido',
        'Valoriza qualidade e conforto',
        'Busca eventos family-friendly',
        'Lealdade à marca consolidada',
        'Disposição para investir em experiências'
      ],
      strategies: [
        'Eventos premium e confortáveis',
        'Pacotes familiares completos',
        'Infraestrutura de primeira',
        'Programas VIP e camarotes',
        'Relacionamento de longo prazo'
      ],
      priority: 'high',
      color: 'hsl(142 76% 36%)'
    };
  }
  
  // Mature (top 25%)
  return {
    name: 'Maduros (' + agePerc.p75.toFixed(0) + '+ anos)',
    description: `Audiência madura (≥ ${agePerc.p75.toFixed(0)} anos) - experiência e tradição`,
    characteristics: [
      'Alta experiência e conhecimento cultural',
      'Valoriza qualidade acima de tudo',
      'Lealdade extrema a artistas favoritos',
      'Disposição para investir significativamente',
      'Networking estabelecido'
    ],
    strategies: [
      'Eventos culturais premium',
      'Experiências exclusivas e intimistas',
      'Relacionamento personalizado VIP',
      'Club memberships e associações',
      'Serviço de concierge dedicado'
    ],
    priority: 'medium',
    color: 'hsl(38 92% 50%)'
  };
}

// Dynamic behavioral segmentation using percentiles
export function getBehavioralInsightDynamic(
  avgPurchases: number,
  avgDaysBetween: number,
  avgPurchaseValue: number,
  percentiles: Percentiles
): SegmentInsight {
  if (!percentiles.purchases || !percentiles.daysBetween || !percentiles.purchaseValue) {
    const estimatedDaysBefore = avgPurchaseValue > 150 ? 14 : avgPurchaseValue > 80 ? 7 : 1;
    return getBehavioralInsight(avgDaysBetween, estimatedDaysBefore);
  }

  const { purchases: pPerc, daysBetween: dPerc, purchaseValue: vPerc } = percentiles;
  
  // Classify into quartiles
  const purchaseQuartile = avgPurchases >= pPerc.p75 ? 4 : avgPurchases >= pPerc.p50 ? 3 : avgPurchases >= pPerc.p25 ? 2 : 1;
  const frequencyQuartile = avgDaysBetween <= dPerc.p25 ? 4 : avgDaysBetween <= dPerc.p50 ? 3 : avgDaysBetween <= dPerc.p75 ? 2 : 1;
  const valueQuartile = avgPurchaseValue >= vPerc.p75 ? 4 : avgPurchaseValue >= vPerc.p50 ? 3 : avgPurchaseValue >= vPerc.p25 ? 2 : 1;
  
  // Super Frequent High Value
  if (purchaseQuartile === 4 && frequencyQuartile === 4 && valueQuartile >= 3) {
    return {
      name: 'Visitantes VIP Frequentes',
      description: 'Compram muito, frequentemente e com alto valor',
      characteristics: [
        `Compras: ${avgPurchases.toFixed(0)}+ (top 25%)`,
        `Intervalo: ${avgDaysBetween.toFixed(0)} dias (muito curto)`,
        `Valor médio: R$ ${avgPurchaseValue.toFixed(0)}+ (alto)`,
        'Comportamento ideal de cliente'
      ],
      strategies: [
        'Programas VIP automáticos',
        'Benefícios exclusivos e perpétuos',
        'Acesso prioritário a tudo',
        'Cashback ou créditos premium'
      ],
      priority: 'high',
      color: 'hsl(142 76% 36%)'
    };
  }
  
  // Frequent Impulsive
  if (frequencyQuartile >= 3 && valueQuartile <= 2) {
    return {
      name: 'Frequentes de Última Hora',
      description: 'Alta frequência de compras rápidas e de menor valor',
      characteristics: [
        'Decisão de compra muito rápida',
        `Intervalo curto (≤ ${dPerc.p50.toFixed(0)} dias)`,
        'Valor individual moderado',
        'Mobile-first e sensível a urgência'
      ],
      strategies: [
        'Flash sales e ofertas relâmpago',
        'Notificações push estratégicas',
        'Gamificação e FOMO marketing',
        'Checkout super simplificado'
      ],
      priority: 'high',
      color: 'hsl(0 62.8% 50%)'
    };
  }
  
  // High Value Planners
  if (valueQuartile === 4 && frequencyQuartile <= 2) {
    return {
      name: 'VIPs Planejadores',
      description: 'Pesquisam extensivamente e compram com alto ticket',
      characteristics: [
        `Valor muito alto (≥ R$ ${vPerc.p75.toFixed(0)})`,
        'Compra menos frequente mas planejada',
        'Pesquisa extensiva pré-compra',
        'Busca ROI e custo-benefício'
      ],
      strategies: [
        'Early bird discounts significativos',
        'Informação detalhada e transparente',
        'Email marketing educativo premium',
        'Consultoria de planejamento de eventos'
      ],
      priority: 'high',
      color: 'hsl(261 83% 58%)'
    };
  }
  
  // Regular Moderate
  if (purchaseQuartile >= 2 && frequencyQuartile >= 2 && valueQuartile >= 2) {
    return {
      name: 'Visitantes Regulares',
      description: 'Performance mediana consistente em todas métricas',
      characteristics: [
        'Comportamento de compra previsível',
        `Frequência moderada (${avgDaysBetween.toFixed(0)} dias)`,
        'Valor mediano por transação',
        'Base estável e confiável'
      ],
      strategies: [
        'Programas de fidelidade progressivos',
        'Remarketing baseado em padrão',
        'Ofertas por tempo limitado',
        'Upsell e cross-sell inteligente'
      ],
      priority: 'medium',
      color: 'hsl(210 40% 56%)'
    };
  }
  
  // Opportunity Seekers
  if (valueQuartile <= 2 && frequencyQuartile <= 2) {
    return {
      name: 'Oportunistas',
      description: 'Aguardam o melhor momento e oferta para comprar',
      characteristics: [
        'Sensível a preço e promoções',
        `Intervalo longo (> ${dPerc.p50.toFixed(0)} dias)`,
        'Valor baixo-moderado',
        'Compara preços ativamente'
      ],
      strategies: [
        'Promoções estratégicas e limitadas',
        'Remarketing com desconto progressivo',
        'Price alerts e notificações',
        'Price match guarantees'
      ],
      priority: 'medium',
      color: 'hsl(38 92% 50%)'
    };
  }
  
  // Low engagement
  return {
    name: 'Visitantes Esporádicos',
    description: 'Comportamento de compra mínimo - segmento de conversão',
    characteristics: [
      `Poucas compras (< ${pPerc.p25.toFixed(0)})`,
      'Intervalos longos entre compras',
      'Valor baixo por transação',
      'Necessita ativação'
    ],
    strategies: [
      'Campanhas de conversão agressivas',
      'Ofertas entry-level super acessíveis',
      'Conteúdo educativo sobre eventos',
      'Incentivos de primeira compra forte'
    ],
    priority: 'low',
    color: 'hsl(240 3.7% 15.9%)'
  };
}

// Dynamic musical preference segmentation using percentiles
export function getMusicalInsightDynamic(
  preferredGenre: string,
  avgInteractions: number,
  avgSpent: number,
  percentiles: Percentiles
): SegmentInsight {
  if (!percentiles.interactions || !percentiles.spent) {
    return getMusicalInsight(preferredGenre);
  }

  const { interactions: iPerc, spent: sPerc } = percentiles;
  const genre = preferredGenre.toLowerCase();
  
  // Classify engagement level
  const interactionQuartile = avgInteractions >= iPerc.p75 ? 4 : avgInteractions >= iPerc.p50 ? 3 : avgInteractions >= iPerc.p25 ? 2 : 1;
  const spentQuartile = avgSpent >= sPerc.p75 ? 4 : avgSpent >= sPerc.p50 ? 3 : avgSpent >= sPerc.p25 ? 2 : 1;
  const engagementScore = interactionQuartile + spentQuartile;
  
  // Get base genre insight
  const baseInsight = getMusicalInsight(preferredGenre);
  
  // Super Fans (top engagement)
  if (engagementScore >= 7) {
    return {
      ...baseInsight,
      name: `${baseInsight.name} - Super Fãs`,
      description: `${baseInsight.description} com altíssimo engajamento`,
      characteristics: [
        ...baseInsight.characteristics,
        `Interações: ${avgInteractions.toFixed(0)}+ (top 25%)`,
        `Gasto total: R$ ${avgSpent.toFixed(0)}+ (premium)`,
        'Fãs devotados do gênero'
      ],
      strategies: [
        'Meet & greets e backstage access',
        'Merchandise exclusivo limitado',
        'Pre-sales e early access garantido',
        'Comunidade VIP de super fãs',
        ...baseInsight.strategies
      ],
      priority: 'high'
    };
  }
  
  // Active Fans (good engagement)
  if (engagementScore >= 5) {
    return {
      ...baseInsight,
      name: `${baseInsight.name} - Fãs Ativos`,
      description: `${baseInsight.description} com bom engajamento`,
      characteristics: [
        ...baseInsight.characteristics,
        `Interações regulares: ${avgInteractions.toFixed(0)}`,
        `Gasto médio-alto: R$ ${avgSpent.toFixed(0)}`,
        'Base engajada do gênero'
      ],
      strategies: [
        'Programas de fidelidade de gênero',
        'Curadoria personalizada',
        'Eventos temáticos do gênero',
        ...baseInsight.strategies
      ],
      priority: 'high'
    };
  }
  
  // Casual Listeners (moderate engagement)
  if (engagementScore >= 3) {
    return {
      ...baseInsight,
      name: `${baseInsight.name} - Ouvintes Casuais`,
      description: `Interesse em ${preferredGenre} com engajamento moderado`,
      characteristics: [
        'Engajamento ocasional com o gênero',
        `Interações: ${avgInteractions.toFixed(0)} (mediana)`,
        `Gasto: R$ ${avgSpent.toFixed(0)} (moderado)`,
        'Potencial de conversão'
      ],
      strategies: [
        'Aumentar frequência com incentivos',
        'Educação sobre line-ups',
        'Ofertas promocionais do gênero',
        'Cross-sell para gêneros similares'
      ],
      priority: 'medium'
    };
  }
  
  // Low engagement
  return {
    ...baseInsight,
    name: `${baseInsight.name} - Descobrindo`,
    description: `Interesse inicial em ${preferredGenre}`,
    characteristics: [
      'Engajamento baixo mas presente',
      `Poucas interações (< ${iPerc.p25.toFixed(0)})`,
      `Gasto baixo (< R$ ${sPerc.p25.toFixed(0)})`,
      'Fase de descoberta do gênero'
    ],
    strategies: [
      'Onboarding de gênero musical',
      'Ofertas entry-level acessíveis',
      'Playlists e content curado',
      'Converter interesse em engajamento'
    ],
    priority: 'low'
  };
}
