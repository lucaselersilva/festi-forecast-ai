import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, MessageSquare, Clock, Target, TrendingUp } from "lucide-react";

const ensureArray = <T,>(value: T | T[] | undefined): T[] => {
  if (Array.isArray(value)) return value;
  if (value !== undefined && value !== null) return [value];
  return [];
};

interface Props {
  strategy: any;
  runId: string;
  eventId: string;
  constraints: any;
}

export default function StrategyCard({ strategy, runId, eventId, constraints }: Props) {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const { toast } = useToast();

  const handleValidate = async () => {
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'validate',
          payload: { 
            strategyId: strategy.id || 'temp', 
            strategy, 
            eventId, 
            constraints 
          }
        }
      });

      if (error) throw error;
      
      setValidation(data);
      
      toast({
        title: data.ok ? "✅ Validação passou" : "❌ Validação falhou",
        description: data.ok ? "Estratégia válida" : data.reasons.join(', '),
        variant: data.ok ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold">{strategy.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{strategy.target_segment}</p>
        </div>
        {validation && (
          <div className="flex items-center gap-2">
            {validation.ok ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4 text-primary" />
            Canais
          </div>
          <div className="flex flex-wrap gap-2">
            {ensureArray(strategy.channel).map((ch: string, idx: number) => (
              <Badge key={idx} variant="secondary">{ch}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-primary" />
            Timing
          </div>
          <div className="text-sm text-muted-foreground">
            <div>{strategy.timing?.start_rule}</div>
            <div className="text-xs">{strategy.timing?.cadence}</div>
          </div>
        </div>
      </div>

      {strategy.offer && (
        <div className="bg-muted p-3 rounded-lg">
          <div className="text-sm font-medium mb-1">Oferta</div>
          <div className="text-sm">
            <span className="font-medium">{strategy.offer.type}:</span> {strategy.offer.value}
          </div>
        </div>
      )}

      {strategy.kpi && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium">KPI:</span>
          </div>
          <Badge variant="outline">
            {strategy.kpi.metric}: {strategy.kpi.goal} em {strategy.kpi.timebox_days}d
          </Badge>
        </div>
      )}

      {strategy.predicted_uplift && (
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span>
            Uplift previsto: <span className="font-semibold">{strategy.predicted_uplift.value_pct}%</span>
          </span>
          <Badge variant="outline" className="text-xs">{strategy.predicted_uplift.method}</Badge>
        </div>
      )}

      {strategy.rationale && strategy.rationale.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm font-medium">Rationale (Evidências):</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {ensureArray(strategy.rationale).map((rat: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{rat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation && !validation.ok && validation.reasons && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="text-sm space-y-1">
              {ensureArray(validation?.reasons).map((reason: string, idx: number) => (
                <li key={idx}>• {reason}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleValidate}
          disabled={validating}
          variant="outline"
          size="sm"
        >
          {validating ? 'Validando...' : 'Validar'}
        </Button>
        <Button
          disabled={!validation?.ok}
          variant="default"
          size="sm"
        >
          Salvar
        </Button>
      </div>
    </Card>
  );
}