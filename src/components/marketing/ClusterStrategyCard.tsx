import { Copy, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { copyToClipboard } from "@/lib/marketingHelpers";
import { toast } from "sonner";

interface ClusterStrategyCardProps {
  strategy: {
    cluster_name: string;
    cluster_size: number;
    personalized_messages: string[];
    recommended_channels: string[];
    emotional_triggers: string[];
    expected_conversion: number;
  };
}

export function ClusterStrategyCard({ strategy }: ClusterStrategyCardProps) {
  const handleCopyMessages = async () => {
    const messages = strategy.personalized_messages.join('\n\n');
    const success = await copyToClipboard(messages);
    if (success) {
      toast.success("Mensagens copiadas!");
    } else {
      toast.error("Erro ao copiar mensagens");
    }
  };

  return (
    <Card className="border-t-4 border-t-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-2">{strategy.cluster_name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{strategy.cluster_size.toLocaleString('pt-BR')} clientes</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMessages}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conversão Esperada */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Conversão Esperada
            </span>
            <span className="font-semibold">{strategy.expected_conversion}%</span>
          </div>
          <Progress value={strategy.expected_conversion} className="h-2" />
        </div>

        {/* Mensagens Personalizadas */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Mensagens Personalizadas</h4>
          <div className="space-y-2">
            {strategy.personalized_messages.map((message, index) => (
              <div
                key={index}
                className="p-3 bg-secondary/30 rounded-lg text-sm border-l-2 border-primary"
              >
                {message}
              </div>
            ))}
          </div>
        </div>

        {/* Canais Recomendados */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Canais Recomendados</h4>
          <div className="flex flex-wrap gap-2">
            {strategy.recommended_channels.map((channel) => (
              <Badge key={channel} variant="secondary">
                {channel}
              </Badge>
            ))}
          </div>
        </div>

        {/* Gatilhos Emocionais */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Gatilhos Emocionais</h4>
          <div className="flex flex-wrap gap-2">
            {strategy.emotional_triggers.map((trigger) => (
              <Badge key={trigger} variant="outline" className="border-primary/50">
                {trigger}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
