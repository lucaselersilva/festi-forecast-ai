import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Target, Lightbulb } from "lucide-react";
import { SegmentInsight } from "@/lib/segmentationHelpers";

interface SegmentInsightCardProps {
  insight: SegmentInsight;
  size: number;
  percentage: number;
  totalValue?: number;
  isLoading?: boolean;
}

export function SegmentInsightCard({ 
  insight, 
  size, 
  percentage,
  totalValue,
  isLoading = false
}: SegmentInsightCardProps) {
  const priorityVariant = {
    high: 'destructive' as const,
    medium: 'default' as const,
    low: 'secondary' as const
  };

  const priorityLabel = {
    high: 'Alta Prioridade',
    medium: 'Média Prioridade',
    low: 'Baixa Prioridade'
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-l-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            {totalValue !== undefined && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: insight.color }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <span style={{ color: insight.color }}>●</span>
              {insight.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </div>
          <Badge variant={priorityVariant[insight.priority]}>
            {priorityLabel[insight.priority]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Tamanho
            </div>
            <div className="text-2xl font-bold">{size}</div>
            <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}% do total</div>
          </div>
          
          {totalValue && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="h-4 w-4" />
                Valor Total
              </div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0
                }).format(totalValue)}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalValue / size)} por cliente
              </div>
            </div>
          )}
        </div>

        {/* Characteristics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4" />
            Características
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {insight.characteristics.map((char, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{char}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Strategies */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4" />
            Estratégias Recomendadas
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {insight.strategies.map((strategy, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-success mt-1">✓</span>
                <span>{strategy}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
