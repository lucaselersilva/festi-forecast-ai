import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Mail, MessageSquare, Bell, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Strategy {
  id: string;
  cluster_comportamental: string;
  strategy_title: string;
  strategy_description: string;
  message_template: string;
  recommended_channel: string;
  expected_conversion_rate: number;
  priority: number;
}

interface ClusterData {
  cluster_comportamental: string;
  total_clientes: number;
}

const channelIcons: Record<string, any> = {
  'Email': Mail,
  'WhatsApp': MessageSquare,
  'Push': Bell,
  'SMS': MessageSquare,
};

export function ZigReactivation() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [strategiesRes, clustersRes] = await Promise.all([
        supabase.from('valle_reactivation_strategies').select('*').order('priority', { ascending: true }),
        supabase.from('vw_valle_cluster_analysis').select('cluster_comportamental, total_clientes'),
      ]);

      if (strategiesRes.error) throw strategiesRes.error;
      if (clustersRes.error) throw clustersRes.error;

      console.log('Strategies loaded:', strategiesRes.data?.length || 0);
      setStrategies(strategiesRes.data || []);
      setClusters(clustersRes.data || []);
      
      return strategiesRes.data || [];
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const generateStrategies = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('valle-reactivation', {
        body: { action: 'generate_strategies' }
      });

      if (error) throw error;

      toast({
        title: "Estratégias geradas!",
        description: `${data.strategies_created} estratégias criadas com IA`,
      });

      // Aguardar commit no banco + retry logic
      let retries = 0;
      let loadedData = [];
      
      while (retries < 3) {
        await new Promise(resolve => setTimeout(resolve, 500));
        loadedData = await loadData();
        
        if (loadedData.length > 0) {
          console.log('Strategies successfully loaded after', retries + 1, 'attempts');
          break;
        }
        
        retries++;
      }

      if (loadedData.length === 0) {
        console.warn('No strategies loaded after 3 retries');
      }
    } catch (error) {
      console.error('Error generating strategies:', error);
      toast({
        title: "Erro ao gerar estratégias",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getClusterSize = (cluster: string) => {
    return clusters.find(c => c.cluster_comportamental === cluster)?.total_clientes || 0;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Estratégias de Reativação com IA
          </CardTitle>
          <CardDescription>
            Mensagens personalizadas por cluster comportamental usando Machine Learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={generateStrategies}
            disabled={generating}
            className="w-full md:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Gerando estratégias...' : 'Gerar Estratégias com IA'}
          </Button>
        </CardContent>
      </Card>

      {strategies.length === 0 && !generating && (
        <Alert>
          <AlertDescription>
            Nenhuma estratégia gerada ainda. Clique no botão acima para gerar estratégias
            personalizadas usando IA para cada cluster de clientes.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {strategies.map((strategy) => {
          const ChannelIcon = channelIcons[strategy.recommended_channel] || Mail;
          const clusterSize = getClusterSize(strategy.cluster_comportamental);
          const estimatedReach = Math.round(clusterSize * strategy.expected_conversion_rate);

          return (
            <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {strategy.cluster_comportamental}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <ChannelIcon className="h-3 w-3" />
                        {strategy.recommended_channel}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="bg-green-500/10 text-green-700 dark:text-green-400"
                      >
                        Conversão: {(strategy.expected_conversion_rate * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{strategy.strategy_title}</CardTitle>
                    <CardDescription>{strategy.strategy_description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Template de Mensagem
                  </h4>
                  <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-line">
                    {strategy.message_template}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Público-alvo</p>
                    <p className="font-semibold">{clusterSize.toLocaleString()} clientes</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-muted-foreground">Alcance estimado</p>
                    <p className="font-semibold text-green-600">
                      ~{estimatedReach} reativações
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
