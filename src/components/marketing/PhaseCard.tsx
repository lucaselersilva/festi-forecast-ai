import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Copy, Target, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { copyToClipboard, formatEventDate } from "@/lib/marketingHelpers";
import { toast } from "sonner";

interface PhaseCardProps {
  phase: {
    phase_number: number;
    phase_name: string;
    start_date: string;
    end_date: string;
    objective: string;
    actions: Array<{
      action: string;
      channel: string;
      message: string;
      timing: string;
      kpi: string;
      rationale?: string;
    }>;
  };
}

export function PhaseCard({ phase }: PhaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopyMessages = async () => {
    const messages = phase.actions.map(a => a.message).join('\n\n');
    const success = await copyToClipboard(messages);
    if (success) {
      toast.success("Mensagens copiadas!");
    } else {
      toast.error("Erro ao copiar mensagens");
    }
  };

  const uniqueChannels = Array.from(new Set(phase.actions.map(a => a.channel)));

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">{phase.phase_number}</span>
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{phase.phase_name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatEventDate(phase.start_date)} - {formatEventDate(phase.end_date)}
                </span>
              </div>
              <div className="flex items-start gap-2 bg-secondary/50 p-3 rounded-lg">
                <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">{phase.objective}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMessages}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Mensagens
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {uniqueChannels.map((channel) => (
                <Badge key={channel} variant="secondary">
                  {channel}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {phase.actions.map((action, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Ação</span>
                    <p className="font-semibold text-sm">{action.action}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Canal</span>
                    <div className="mt-1">
                      <Badge variant="outline">{action.channel}</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <span className="text-xs text-muted-foreground font-medium">Mensagem</span>
                  <p className="text-sm mt-1 bg-secondary/30 p-2 rounded">{action.message}</p>
                </div>

                {action.rationale && (
                  <Alert className="border-primary/30 bg-primary/5">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-xs">
                      <strong>Por quê?</strong> {action.rationale}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Timing:</span>
                    <span className="ml-1 font-medium">{action.timing}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">KPI:</span>
                    <span className="ml-1 font-medium">{action.kpi}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
