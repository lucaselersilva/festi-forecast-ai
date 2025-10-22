import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ComposedChart,
  Bar,
  Line
} from "recharts";

interface AdvancedAnalysisProps {
  events: any[];
}

export default function AdvancedAnalysis({ events }: AdvancedAnalysisProps) {
  const getScatterData = () => {
    return events.map(event => ({
      x: event.ticket_price || 0,
      y: (event.sold_tickets || 0) / (event.capacity || 1) * 100,
      z: event.revenue || 0,
      genre: event.genre,
      name: `${event.artist} - ${event.venue}`
    }));
  };

  const getCrossAnalysisData = () => {
    const analysis: Record<string, Record<string, { events: number, revenue: number }>> = {};
    
    events.forEach(event => {
      const genre = event.genre;
      const city = event.city;
      
      if (!analysis[genre]) analysis[genre] = {};
      if (!analysis[genre][city]) analysis[genre][city] = { events: 0, revenue: 0 };
      
      analysis[genre][city].events += 1;
      analysis[genre][city].revenue += event.revenue || 0;
    });

    const result = [];
    Object.entries(analysis).forEach(([genre, cities]) => {
      Object.entries(cities).forEach(([city, data]) => {
        result.push({
          genre,
          city,
          combination: `${genre} - ${city}`,
          events: data.events,
          revenue: data.revenue,
          avgRevenue: data.revenue / data.events
        });
      });
    });

    return result.sort((a, b) => b.revenue - a.revenue).slice(0, 15);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="scatter">
        <AccordionTrigger className="text-base font-semibold">
          📊 Análise de Preço vs Ocupação
        </AccordionTrigger>
        <AccordionContent>
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Preço"
                  label={{ value: 'Preço do Ingresso (R$)', position: 'bottom' }}
                  className="text-muted-foreground"
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Ocupação"
                  label={{ value: 'Ocupação (%)', angle: -90, position: 'left' }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                          <p className="font-semibold text-sm mb-1">{data.name}</p>
                          <p className="text-xs text-muted-foreground">Preço: R$ {data.x.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">Ocupação: {data.y.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Receita: R$ {(data.z / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-primary mt-1">{data.genre}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={getScatterData()} fill="hsl(var(--primary))" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="cross">
        <AccordionTrigger className="text-base font-semibold">
          🎯 Análise Cruzada: Gênero × Cidade
        </AccordionTrigger>
        <AccordionContent>
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={getCrossAnalysisData()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="combination"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  className="text-xs text-muted-foreground"
                />
                <YAxis
                  yAxisId="left"
                  label={{ value: 'Receita (R$)', angle: -90, position: 'insideLeft' }}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Nº Eventos', angle: 90, position: 'insideRight' }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                          <p className="font-semibold text-sm mb-1">{data.genre} em {data.city}</p>
                          <p className="text-xs text-muted-foreground">Eventos: {data.events}</p>
                          <p className="text-xs text-muted-foreground">Receita Total: R$ {(data.revenue / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-muted-foreground">Média por Evento: R$ {(data.avgRevenue / 1000).toFixed(0)}K</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="events" stroke="hsl(var(--chart-2))" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
