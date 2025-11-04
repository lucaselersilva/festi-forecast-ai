import { TrendingUp, Lightbulb, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReachStrategiesCardProps {
  strategies: Array<{
    strategy: string;
    description: string;
    rationale: string;
    channels: string[];
    estimated_reach: string;
    investment: string;
  }>;
}

export function ReachStrategiesCard({ strategies }: ReachStrategiesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Estratégias de Alcance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {strategies.map((strategy, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div>
              <h4 className="font-semibold text-base mb-1">{strategy.strategy}</h4>
              <p className="text-sm text-muted-foreground">{strategy.description}</p>
            </div>

            <Alert className="border-primary/30 bg-primary/5">
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                <strong>Por quê funciona:</strong> {strategy.rationale}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Badge variant="outline" className="text-xs">Canais</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {strategy.channels.map((channel, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Users className="w-3 h-3" />
                  <span className="text-xs">Alcance Estimado</span>
                </div>
                <p className="font-semibold text-primary">{strategy.estimated_reach}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <DollarSign className="w-3 h-3" />
                  <span className="text-xs">Investimento</span>
                </div>
                <p className="font-semibold">{strategy.investment}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
