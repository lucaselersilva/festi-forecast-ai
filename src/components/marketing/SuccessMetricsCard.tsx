import { BarChart3, Target, Activity, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SuccessMetricsCardProps {
  metrics: Array<{
    metric: string;
    target: string;
    measurement: string;
    rationale: string;
  }>;
}

export function SuccessMetricsCard({ metrics }: SuccessMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Métricas de Sucesso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">{metric.metric}</h4>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">Meta:</span>
                  <Badge className="text-sm">{metric.target}</Badge>
                </div>
              </div>
            </div>

            <Alert className="border-primary/30 bg-primary/5">
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                <strong>Por quê essa meta é realista:</strong> {metric.rationale}
              </AlertDescription>
            </Alert>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Como Medir</span>
              </div>
              <p className="text-xs text-muted-foreground bg-secondary/20 p-2 rounded">
                {metric.measurement}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
