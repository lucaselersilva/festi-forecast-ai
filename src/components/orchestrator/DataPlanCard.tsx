import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Play, Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  plan: any;
  onExecute: () => void;
  loading: boolean;
}

export default function DataPlanCard({ plan, onExecute, loading }: Props) {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Passo 2: Plano de Segmentação</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Segmentos que serão analisados:
          </h3>
          <div className="space-y-2">
            {plan.segments_to_query?.map((segment: string, idx: number) => (
              <div key={idx} className="bg-muted p-3 rounded-lg">
                <Badge variant="outline" className="mb-2">
                  {segment === 'attended_similar' && '🎵 Frequentaram eventos similares'}
                  {segment === 'high_value' && '⭐ Alto valor (Champions/Loyal)'}
                  {segment === 'at_risk' && '⚠️ Em risco (precisam reativação)'}
                  {segment === 'high_bar_spenders' && '🍺 Alto consumo no bar'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {plan.rationale && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Justificativa:
            </h3>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {plan.rationale}
            </p>
          </div>
        )}

        {plan.expected_reach && (
          <div>
            <h3 className="font-semibold mb-2">Alcance Estimado:</h3>
            <Badge variant="secondary" className="text-lg">
              ~{plan.expected_reach.toLocaleString()} clientes
            </Badge>
          </div>
        )}
      </div>

      <Button
        onClick={onExecute}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        <Play className="mr-2 h-4 w-4" />
        {loading ? 'Coletando dados...' : 'Coletar Dados dos Segmentos'}
      </Button>
    </Card>
  );
}