import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, Activity, Eye } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { ClusterMembersDialog } from "./ClusterMembersDialog";

interface ClusterData {
  cluster_comportamental: string;
  total_clientes: number;
  consumo_medio: number;
  presencas_media: number;
  recency_media: number;
  com_app_ativo: number;
  propensity_media: number;
  generos: string[];
  faixas_etarias: string[];
}

const clusterIcons: Record<string, any> = {
  'VIPs / High Rollers': '👑',
  'Frequentes Econômicos': '🎯',
  'Ocasional Premium': '💎',
  'Dormientes / Risco de churn': '⚠️',
  'Novatos': '🆕',
  'Ocasional Regular': '📊',
};

const clusterDescriptions: Record<string, string> = {
  'VIPs / High Rollers': 'Clientes mais valiosos com alta frequência e consumo',
  'Frequentes Econômicos': 'Fiéis mas gastam pouco - potencial de upgrade',
  'Ocasional Premium': 'Aparecem pouco mas gastam muito quando vêm',
  'Dormientes / Risco de churn': 'Podem ter abandonado - reativação urgente',
  'Novatos': 'Novos clientes - fase de onboarding',
  'Ocasional Regular': 'Comportamento regular - manter engajamento',
};

export function ZigClusters() {
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { tenantId } = useTenant();

  const handleViewMembers = (clusterName: string) => {
    setSelectedCluster(clusterName);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (tenantId) {
      loadClusters();
    }
  }, [tenantId]);

  const loadClusters = async () => {
    if (!tenantId) return;
    
    try {
      // @ts-ignore - Deep type instantiation from Supabase
      const { data, error } = await supabase
        .from('vw_valle_cluster_analysis')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      setClusters(data || []);
    } catch (error) {
      console.error('Error loading clusters:', error);
      toast({
        title: "Erro ao carregar clusters",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalClients = clusters.reduce((sum, c) => sum + c.total_clientes, 0);

  return (
    <>
      <ClusterMembersDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clusterName={selectedCluster || ""}
      />
      
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Visão Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold">{totalClients.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Clusters Identificados</p>
              <p className="text-2xl font-bold">{clusters.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Consumo Médio</p>
              <p className="text-2xl font-bold">
                R$ {(clusters.reduce((sum, c) => sum + (c.consumo_medio * c.total_clientes), 0) / totalClients).toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Presenças Médias</p>
              <p className="text-2xl font-bold">
                {(clusters.reduce((sum, c) => sum + (c.presencas_media * c.total_clientes), 0) / totalClients).toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clusters.map((cluster) => {
          const percentage = (cluster.total_clientes / totalClients) * 100;
          
          return (
            <Card key={cluster.cluster_comportamental} className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => handleViewMembers(cluster.cluster_comportamental)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{clusterIcons[cluster.cluster_comportamental]}</span>
                      {cluster.cluster_comportamental}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {clusterDescriptions[cluster.cluster_comportamental]}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-semibold">{cluster.total_clientes}</p>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-semibold">R$ {cluster.consumo_medio.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Consumo médio</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-semibold">{cluster.presencas_media.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Presenças</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="font-semibold">{(cluster.propensity_media * 100).toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">Propensão</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">App Ativo</p>
                    <Badge variant="outline" className="text-xs">
                      {cluster.com_app_ativo} clientes ({((cluster.com_app_ativo / cluster.total_clientes) * 100).toFixed(0)}%)
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Recência Média</p>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(cluster.recency_media)} dias
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMembers(cluster.cluster_comportamental);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Membros
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
    </>
  );
}
