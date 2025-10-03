import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Play } from "lucide-react";
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
        <h2 className="text-2xl font-bold">Passo 2: Plano de Dados & Features</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Consultas SQL que serão executadas:</h3>
          <div className="space-y-2">
            {plan.queries?.map((query: any, idx: number) => (
              <div key={idx} className="bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{query.name}</Badge>
                </div>
                <code className="text-sm text-muted-foreground block overflow-x-auto">
                  {query.sql}
                </code>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Features necessárias:</h3>
          <div className="flex flex-wrap gap-2">
            {plan.features_needed?.map((feature: string, idx: number) => (
              <Badge key={idx} variant="secondary">{feature}</Badge>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={onExecute}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        <Play className="mr-2 h-4 w-4" />
        {loading ? 'Executando...' : 'Executar Coleta de Dados'}
      </Button>
    </Card>
  );
}