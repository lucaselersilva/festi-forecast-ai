import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClusterQualityProps {
  silhouetteScore?: number;
  daviesBouldinScore?: number;
  noiseRatio?: number;
  clusterSizes: Record<number, number>;
  method: string;
}

export function ClusterQuality({ 
  silhouetteScore, 
  daviesBouldinScore, 
  noiseRatio,
  clusterSizes,
  method 
}: ClusterQualityProps) {
  const totalPoints = Object.values(clusterSizes).reduce((a, b) => a + b, 0);
  
  const getSilhouetteQuality = (score: number) => {
    if (score > 0.7) return { label: 'Excelente', color: 'bg-green-500', variant: 'default' as const };
    if (score > 0.5) return { label: 'Bom', color: 'bg-blue-500', variant: 'secondary' as const };
    if (score > 0.25) return { label: 'Razoável', color: 'bg-yellow-500', variant: 'outline' as const };
    return { label: 'Fraco', color: 'bg-red-500', variant: 'destructive' as const };
  };

  const silhouetteQuality = silhouetteScore !== undefined ? getSilhouetteQuality(silhouetteScore) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Qualidade da Segmentação
        </CardTitle>
        <CardDescription>
          Métricas de avaliação do clustering {method.toUpperCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {silhouetteScore !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Silhouette Score</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        <strong>Fórmula:</strong> s(i) = (b(i) - a(i)) / max(a(i), b(i))
                      </p>
                      <p className="text-xs mt-1">
                        Varia de -1 a 1. Valores próximos de 1 indicam que os pontos estão bem agrupados em seus clusters e distantes de outros clusters.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {silhouetteQuality && (
                <Badge variant={silhouetteQuality.variant}>
                  {silhouetteQuality.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Progress value={(silhouetteScore + 1) * 50} className="flex-1" />
              <span className="text-sm font-medium min-w-[3rem] text-right">
                {silhouetteScore.toFixed(3)}
              </span>
            </div>
          </div>
        )}

        {daviesBouldinScore !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Davies-Bouldin Index</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        <strong>Fórmula:</strong> DB = (1/k) Σ max_j[(S_i + S_j) / M_ij]
                      </p>
                      <p className="text-xs mt-1">
                        Quanto menor, melhor. Mede a razão entre dispersão intra-cluster e separação inter-cluster.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant={daviesBouldinScore < 1 ? 'default' : daviesBouldinScore < 2 ? 'secondary' : 'outline'}>
                {daviesBouldinScore < 1 ? 'Bom' : daviesBouldinScore < 2 ? 'Moderado' : 'Alto'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={Math.max(0, 100 - daviesBouldinScore * 25)} className="flex-1" />
              <span className="text-sm font-medium min-w-[3rem] text-right">
                {daviesBouldinScore.toFixed(3)}
              </span>
            </div>
          </div>
        )}

        {noiseRatio !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Proporção de Ruído</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Pontos classificados como outliers pelo DBSCAN. Alto ruído pode indicar necessidade de ajustar eps ou min_samples.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant={noiseRatio < 0.1 ? 'default' : noiseRatio < 0.3 ? 'secondary' : 'destructive'}>
                {(noiseRatio * 100).toFixed(1)}%
              </Badge>
            </div>
            <Progress value={noiseRatio * 100} className="flex-1" />
          </div>
        )}

        <div className="space-y-3 pt-4 border-t">
          <Label>Distribuição dos Clusters</Label>
          {Object.entries(clusterSizes)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([clusterId, size]) => (
              <div key={clusterId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Cluster {parseInt(clusterId) === -1 ? 'Ruído' : parseInt(clusterId) + 1}
                  </span>
                  <span className="text-muted-foreground">
                    {size} ({((size / totalPoints) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress value={(size / totalPoints) * 100} />
              </div>
            ))}
        </div>

        {totalPoints < 200 && (
          <div className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Dados insuficientes
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                Com menos de 200 registros, os resultados podem ser instáveis. Considere ampliar o período de análise.
              </p>
            </div>
          </div>
        )}

        {silhouetteScore !== undefined && silhouetteScore < 0.25 && (
          <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Separação fraca
              </p>
              <p className="text-xs text-red-800 dark:text-red-200">
                Os clusters não estão bem separados. Experimente ajustar os parâmetros ou usar outro método.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium">{children}</span>;
}
