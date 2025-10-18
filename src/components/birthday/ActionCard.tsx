import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Copy, Clock, TrendingUp, Gift } from "lucide-react";

interface ActionCardProps {
  action: {
    title: string;
    description: string;
    channel: string;
    timing: string;
    message_template: string;
    offer?: string;
    expected_conversion: number;
    cost_estimate?: string;
  };
  index: number;
}

export function ActionCard({ action, index }: ActionCardProps) {
  const { toast } = useToast();

  const copyMessage = () => {
    navigator.clipboard.writeText(action.message_template);
    toast({ 
      title: "Mensagem copiada!",
      description: "A mensagem foi copiada para a área de transferência"
    });
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      'WhatsApp': 'bg-green-500/10 text-green-700 border-green-500/20',
      'Email': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      'SMS': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      'Push Notification': 'bg-orange-500/10 text-orange-700 border-orange-500/20',
      'Presencial': 'bg-pink-500/10 text-pink-700 border-pink-500/20',
      'Redes Sociais': 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20'
    };
    return colors[channel] || 'bg-muted';
  };

  return (
    <Card className="bg-muted/30 border-muted">
      <CardContent className="pt-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {String(index).padStart(2, '0')}
            </Badge>
            <h5 className="font-semibold">{action.title}</h5>
          </div>
          <Badge className={getChannelColor(action.channel)}>
            {action.channel}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">{action.description}</p>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm bg-background/50 rounded p-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Timing</div>
              <div className="font-medium">{action.timing}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm bg-background/50 rounded p-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Conversão Est.</div>
              <div className="font-medium">{action.expected_conversion}%</div>
            </div>
          </div>
        </div>

        {/* Offer */}
        {action.offer && (
          <Alert className="border-primary/20 bg-primary/5">
            <Gift className="h-4 w-4" />
            <AlertTitle className="text-sm">Oferta Especial</AlertTitle>
            <AlertDescription className="text-xs">
              {action.offer}
            </AlertDescription>
          </Alert>
        )}

        {/* Message Template */}
        <div className="bg-background rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Mensagem Pronta
            </span>
            <Button variant="ghost" size="sm" onClick={copyMessage}>
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </Button>
          </div>
          <p className="text-sm whitespace-pre-wrap font-mono bg-muted/30 p-3 rounded">
            {action.message_template}
          </p>
        </div>

        {/* Cost Estimate */}
        {action.cost_estimate && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span>💰 Custo estimado:</span>
            <span className="font-medium">{action.cost_estimate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}