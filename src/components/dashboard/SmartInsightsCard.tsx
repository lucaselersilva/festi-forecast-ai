import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SmartInsightsCardProps {
  events: any[];
  metrics: any;
  dataSource?: 'events' | 'valle_clientes';
}

export default function SmartInsightsCard({ events, metrics, dataSource = 'events' }: SmartInsightsCardProps) {
  const [insights, setInsights] = useState<{ positive: string; negative: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateAIInsights = async () => {
    if (events.length === 0) return;
    
    setLoading(true);
    try {
      // Preparar dados agregados para enviar à IA
      const generoStats: Record<string, { consumo: number, count: number }> = {};
      events.forEach(item => {
        const genero = dataSource === 'valle_clientes' 
          ? (item.genero || 'Não informado')
          : item.genre;
        
        if (!generoStats[genero]) generoStats[genero] = { consumo: 0, count: 0 };
        generoStats[genero].consumo += dataSource === 'valle_clientes' 
          ? (item.consumo || 0) 
          : (item.revenue || 0);
        generoStats[genero].count += 1;
      });

      const topGeneros = Object.entries(generoStats)
        .map(([genero, data]) => ({
          genero,
          clientes: data.count,
          consumo: data.consumo
        }))
        .sort((a, b) => b.consumo - a.consumo)
        .slice(0, 5);

      const requestBody = {
        metrics: {
          totalClientes: events.length,
          consumoMedio: metrics?.consumoMedio || 0,
          consumoTotal: metrics?.consumoTotal || 0,
          taxaAppAtivo: metrics?.taxaAppAtivo || 0,
          recenciaMedia: metrics?.recenciaMedia || 0,
          presencaMedia: metrics?.presencaMedia || 0,
          topGeneros
        },
        dataSource
      };

      console.log('🤖 Chamando IA para gerar insights...', requestBody);

      const { data, error } = await supabase.functions.invoke('generate-dashboard-insights', {
        body: requestBody
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('✅ Insights gerados:', data);
      setInsights(data);

    } catch (error: any) {
      console.error('❌ Erro ao gerar insights:', error);
      
      toast({
        title: "Erro ao Gerar Insights",
        description: error.message || "Não foi possível gerar insights. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Insights Automáticos com IA
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={generateAIInsights}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? 'Gerando...' : insights ? 'Gerar Novos' : 'Gerar Insights'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights && !loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Clique em "Gerar Insights" para análises automáticas com IA</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          </div>
        ) : insights ? (
          <div className="space-y-3">
            {/* Insight Positivo */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">Ponto Forte</p>
                <p className="text-sm text-green-800 dark:text-green-200">{insights.positive}</p>
              </div>
            </div>

            {/* Insight Negativo/Oportunidade */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">Oportunidade</p>
                <p className="text-sm text-orange-800 dark:text-orange-200">{insights.negative}</p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
