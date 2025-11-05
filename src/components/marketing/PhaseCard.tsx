import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Copy, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Ação</TableHead>
                <TableHead className="w-[35%]">Mensagem</TableHead>
                <TableHead className="w-[15%]">Canal</TableHead>
                <TableHead className="w-[15%]">Timing</TableHead>
                <TableHead className="w-[10%]">KPI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phase.actions.map((action, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{action.action}</TableCell>
                  <TableCell className="text-sm">{action.message}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{action.channel}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {action.timing}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {action.kpi}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}
