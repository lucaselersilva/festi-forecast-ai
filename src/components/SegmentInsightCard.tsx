import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Target, Lightbulb } from "lucide-react";
import { SegmentInsight } from "@/lib/segmentationHelpers";

interface SegmentInsightCardProps {
  insight: SegmentInsight;
  size: number;
  percentage: number;
  totalValue?: number;
}

export function SegmentInsightCard({ 
  insight, 
  size, 
  percentage,
  totalValue 
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
