import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';

interface ClusterData {
  cluster: number;
  name: string;
  size: number;
  percentage: number;
  avgRecency?: number;
  avgFrequency?: number;
  avgMonetary?: number;
  color: string;
}

interface ClusterVisualizationProps {
  clusters: ClusterData[];
  type: 'rfm' | 'demographic' | 'behavioral' | 'musical' | 'multi-dimensional';
}

export function ClusterVisualization({ clusters, type }: ClusterVisualizationProps) {
  if (type === 'rfm') {
    // 3D-style scatter plot for RFM
    const scatterData = clusters.map(c => ({
      name: c.name,
      recency: c.avgRecency || 0,
      frequency: c.avgFrequency || 0,
      monetary: c.avgMonetary || 0,
      size: c.size,
      color: c.color
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Frequency vs Monetary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Frequência × Valor Monetário</CardTitle>
            <CardDescription>Distribuição de clusters por comportamento de compra</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  dataKey="frequency" 
                  name="Frequência"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  type="number" 
                  dataKey="monetary" 
                  name="Valor"
                  stroke="hsl(var(--muted-foreground))"
                />
                <ZAxis type="number" dataKey="size" range={[50, 400]} name="Tamanho" />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-1">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Frequência: {data.frequency.toFixed(1)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Valor: R$ {data.monetary.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Clientes: {data.size}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Recência</CardTitle>
            <CardDescription>Dias desde a última interação por segmento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scatterData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-1">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Recência Média: {data.recency.toFixed(0)} dias
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="recency" radius={[8, 8, 0, 0]}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For other types, show size distribution
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Segmentos</CardTitle>
        <CardDescription>Tamanho e composição dos grupos identificados</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={clusters} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold mb-1">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Clientes: {data.size}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Percentual: {data.percentage.toFixed(1)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="size" radius={[8, 8, 0, 0]}>
              {clusters.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
