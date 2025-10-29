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
  dataSource?: 'events' | 'valle_clientes';
}

export default function AdvancedAnalysis({ events, dataSource = 'events' }: AdvancedAnalysisProps) {
  const getScatterData = () => {
    if (dataSource === 'valle_clientes') {
      return events.map(cliente => ({
        x: cliente.consumo || 0,
        y: cliente.presencas || 0,
        z: cliente.aplicativo_ativo ? 1 : 0,
        genre: cliente.genero || 'Não informado',
        name: cliente.nome || 'Cliente'
      }));
    }
    
    return events.map(event => ({
      x: event.ticket_price || 0,
      y: (event.sold_tickets || 0) / (event.capacity || 1) * 100,
      z: event.revenue || 0,
      genre: event.genre,
      name: `${event.artist} - ${event.venue}`
    }));
  };

  const getCrossAnalysisData = () => {
    if (dataSource === 'valle_clientes') {
      const analysis: Record<string, { clientes: number, consumo: number, presencas: number }> = {};
      
      events.forEach(cliente => {
        const genero = cliente.genero || 'Não informado';
        
        if (!analysis[genero]) analysis[genero] = { clientes: 0, consumo: 0, presencas: 0 };
        
        analysis[genero].clientes += 1;
        analysis[genero].consumo += cliente.consumo || 0;
        analysis[genero].presencas += cliente.presencas || 0;
      });

      return Object.entries(analysis)
        .map(([genero, data]) => ({
          name: genero,
          clientes: data.clientes,
          consumo: data.consumo,
          presencas: data.presencas,
          consumoMedio: data.consumo / data.clientes
        }))
        .sort((a, b) => b.consumo - a.consumo)
        .slice(0, 10);
    }

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
          {dataSource === 'valle_clientes' ? '📊 Análise de Consumo vs Presença' : '📊 Análise de Preço vs Ocupação'}
        </AccordionTrigger>
        <AccordionContent>
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={dataSource === 'valle_clientes' ? 'Consumo' : 'Preço'}
                  label={{ value: dataSource === 'valle_clientes' ? 'Consumo Total (R$)' : 'Preço do Ingresso (R$)', position: 'bottom' }}
                  className="text-muted-foreground"
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name={dataSource === 'valle_clientes' ? 'Presenças' : 'Ocupação'}
                  label={{ value: dataSource === 'valle_clientes' ? 'Número de Presenças' : 'Ocupação (%)', angle: -90, position: 'left' }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (dataSource === 'valle_clientes') {
                        return (
                          <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                            <p className="font-semibold text-sm mb-1">{data.name}</p>
                            <p className="text-xs text-muted-foreground">Consumo: R$ {data.x.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">Presenças: {data.y}</p>
                            <p className="text-xs text-muted-foreground">App Ativo: {data.z ? 'Sim' : 'Não'}</p>
                            <p className="text-xs text-primary mt-1">{data.genre}</p>
                          </div>
                        );
                      }
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
          {dataSource === 'valle_clientes' ? '🎯 Análise por Gênero' : '🎯 Análise Cruzada: Gênero × Cidade'}
        </AccordionTrigger>
        <AccordionContent>
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={getCrossAnalysisData()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey={dataSource === 'valle_clientes' ? 'name' : 'combination'}
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  className="text-xs text-muted-foreground"
                />
                <YAxis
                  yAxisId="left"
                  label={{ value: dataSource === 'valle_clientes' ? 'Consumo (R$)' : 'Receita (R$)', angle: -90, position: 'insideLeft' }}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{ value: dataSource === 'valle_clientes' ? 'Nº Clientes' : 'Nº Eventos', angle: 90, position: 'insideRight' }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (dataSource === 'valle_clientes') {
                        return (
                          <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                            <p className="font-semibold text-sm mb-1">{data.name}</p>
                            <p className="text-xs text-muted-foreground">Clientes: {data.clientes}</p>
                            <p className="text-xs text-muted-foreground">Consumo Total: R$ {(data.consumo / 1000).toFixed(0)}K</p>
                            <p className="text-xs text-muted-foreground">Consumo Médio: R$ {data.consumoMedio.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">Presenças: {data.presencas}</p>
                          </div>
                        );
                      }
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
                <Bar 
                  yAxisId="left" 
                  dataKey={dataSource === 'valle_clientes' ? 'consumo' : 'revenue'} 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey={dataSource === 'valle_clientes' ? 'clientes' : 'events'} 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
