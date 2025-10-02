// Semantic naming and analysis helpers for customer segmentation

export interface RFMMetrics {
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
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
