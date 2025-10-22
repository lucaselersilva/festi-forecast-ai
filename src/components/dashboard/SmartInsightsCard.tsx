import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, Target, Sparkles } from "lucide-react";

interface SmartInsightsCardProps {
  events: any[];
  metrics: any;
}

export default function SmartInsightsCard({ events, metrics }: SmartInsightsCardProps) {
  const generateInsights = () => {
    const insights: Array<{ type: 'positive' | 'warning' | 'info', text: string }> = [];

    if (events.length === 0) return insights;

    // Análise de Gêneros
    const genreStats: Record<string, { revenue: number, count: number }> = {};
    events.forEach(event => {
      if (!genreStats[event.genre]) genreStats[event.genre] = { revenue: 0, count: 0 };
      genreStats[event.genre].revenue += event.revenue || 0;
      genreStats[event.genre].count += 1;
    });

    const topGenre = Object.entries(genreStats)
      .sort((a, b) => b[1].revenue - a[1].revenue)[0];
    
    if (topGenre) {
      insights.push({
        type: 'positive',
        text: `${topGenre[0]} lidera com ${topGenre[1].count} eventos e receita de R$ ${(topGenre[1].revenue / 1000).toFixed(0)}K`
      });
    }

    // Análise de Ocupação
    if (metrics?.occupancyRate > 80) {
      insights.push({
        type: 'positive',
        text: `Ocupação excelente de ${metrics.occupancyRate.toFixed(1)}% - considere aumentar preços`
      });
    } else if (metrics?.occupancyRate < 50) {
      insights.push({
        type: 'warning',
        text: `Ocupação baixa (${metrics.occupancyRate.toFixed(1)}%) - recomenda-se campanha de promoção`
      });
    }

    // Análise de Cidades
    const cityStats: Record<string, { occupancy: number, count: number }> = {};
    events.forEach(event => {
      if (!cityStats[event.city]) cityStats[event.city] = { occupancy: 0, count: 0 };
      const occ = ((event.sold_tickets || 0) / (event.capacity || 1)) * 100;
      cityStats[event.city].occupancy += occ;
      cityStats[event.city].count += 1;
    });

    const topCity = Object.entries(cityStats)
      .map(([city, data]) => ({ city, avgOccupancy: data.occupancy / data.count }))
      .sort((a, b) => b.avgOccupancy - a.avgOccupancy)[0];
    
    if (topCity && topCity.avgOccupancy > 70) {
      insights.push({
        type: 'positive',
        text: `${topCity.city} tem ocupação média de ${topCity.avgOccupancy.toFixed(0)}% - mercado promissor`
      });
    }

    // Análise de Preço
    const avgPrice = metrics?.avgTicketPrice || 0;
    const avgOccupancy = metrics?.occupancyRate || 0;
    
    if (avgPrice > 100 && avgOccupancy > 70) {
      insights.push({
        type: 'info',
        text: `Boa elasticidade de preço: R$ ${avgPrice.toFixed(0)} com ${avgOccupancy.toFixed(0)}% ocupação`
      });
    }

    // Oportunidades
    const lowPriceHighOccupancy = events.filter(e => 
      e.ticket_price < avgPrice * 0.8 && 
      (e.sold_tickets / e.capacity) > 0.8
    ).length;

    if (lowPriceHighOccupancy > 5) {
      insights.push({
        type: 'info',
        text: `${lowPriceHighOccupancy} eventos com preço baixo mas alta ocupação - oportunidade de aumento`
      });
    }

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Insights Automáticos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                insight.type === 'positive' 
                  ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50'
                  : insight.type === 'warning'
                  ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50'
                  : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50'
              }`}
            >
              {insight.type === 'positive' && <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />}
              {insight.type === 'warning' && <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />}
              {insight.type === 'info' && <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />}
              <p className="text-sm">{insight.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
