import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ActionCard } from "./ActionCard";
import { ChevronDown, ChevronUp, Copy, Download, TrendingUp, Clock, Users } from "lucide-react";
import { exportClusterPlan } from "@/lib/birthdayHelpers";

interface Action {
  title: string;
  description: string;
  channel: string;
  timing: string;
  message_template: string;
  offer?: string;
  expected_conversion: number;
  cost_estimate?: string;
}

interface BirthdayClusterCardProps {
  cluster: {
    name: string;
    size: number;
    avgSpending?: number;
    avgRecency?: number;
    avgFrequency?: number;
    overview?: string;
    actions: Action[];
    key_insights?: string[];
    recommended_offer?: string;
  };
  customers: any[];
}

export function BirthdayClusterCard({ cluster, customers }: BirthdayClusterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const copyAllMessages = () => {
    const messages = cluster.actions
      .map((action, i) => `${i + 1}. ${action.title} (${action.channel})\n${action.message_template}`)
      .join('\n\n---\n\n');
    
    navigator.clipboard.writeText(messages);
    toast({
      title: "Mensagens copiadas!",
      description: `${cluster.actions.length} mensagens copiadas para a área de transferência`
    });
  };

  const handleExport = () => {
    exportClusterPlan(cluster, customers);
    toast({
      title: "Plano exportado!",
      description: "Download iniciado"
    });
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-base px-3 py-1">
              {cluster.name}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{cluster.size} pessoas</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metrics */}
        {cluster.avgSpending !== undefined && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Consumo Médio</div>
              <div className="text-lg font-bold">
                R$ {cluster.avgSpending.toFixed(2)}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Recência Média</div>
              <div className="text-lg font-bold flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {cluster.avgRecency?.toFixed(0)}d
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Frequência</div>
              <div className="text-lg font-bold flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {cluster.avgFrequency?.toFixed(1)}
              </div>
            </div>
          </div>
        )}

        {/* Overview */}
        {cluster.overview && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Visão Geral
            </h4>
            <p className="text-sm text-muted-foreground">{cluster.overview}</p>
          </div>
        )}

        {/* Key Insights */}
        {cluster.key_insights && cluster.key_insights.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">💡 Insights Principais:</h4>
            <ul className="space-y-1">
              {cluster.key_insights.map((insight, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Offer */}
        {cluster.recommended_offer && (
          <div className="bg-accent/50 border border-accent rounded-lg p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-1">
              🎁 Oferta Recomendada
            </div>
            <div className="text-sm font-medium">{cluster.recommended_offer}</div>
          </div>
        )}

        {/* Actions (expanded) */}
        {expanded && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">✨ Ações Recomendadas:</h4>
              {cluster.actions.map((action, i) => (
                <ActionCard key={i} action={action} index={i + 1} />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={copyAllMessages} variant="default">
                <Copy className="mr-2 h-4 w-4" />
                Copiar Todas as Mensagens
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Plano
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}