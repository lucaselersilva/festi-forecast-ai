import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClusteringConfig } from "@/components/ClusteringConfig";
import { ClusterQuality } from "@/components/ClusterQuality";
import { ClusterVisualization } from "@/components/ClusterVisualization";
import { SegmentationTypeSelector, SegmentationType } from "@/components/SegmentationTypeSelector";
import { SegmentInsightCard } from "@/components/SegmentInsightCard";
import { ClusterCustomersDialog } from "@/components/ClusterCustomersDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, AlertCircle } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { 
  getRFMSegmentName, 
  getDemographicInsight, 
  getBehavioralInsight, 
  getMusicalInsight,
  getRFMSegmentNameDynamic,
  getDemographicInsightDynamic,
  getBehavioralInsightDynamic,
  getMusicalInsightDynamic,
  Percentiles
} from "@/lib/segmentationHelpers";

export default function Clustering() {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  
  const [segmentationType, setSegmentationType] = useState<SegmentationType>('valle-rfm');
  const [clusteringMethod, setClusteringMethod] = useState<'kmeans' | 'dbscan' | 'gmm'>('kmeans');
  const [clusteringParams, setClusteringParams] = useState({
    k: 4,
    eps: 0.6,
    minSamples: 10,
    nComponents: 4,
    standardize: true,
    randomState: 42,
  });
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [clusteringResult, setClusteringResult] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<Map<number, any>>(new Map());
  const [selectedCluster, setSelectedCluster] = useState<{ name: string; customerIds: number[] } | null>(null);
  const [activeImport, setActiveImport] = useState<{ job_status: string; job_progress: number } | null>(null);

  // Verificar importações ativas periodicamente
  useEffect(() => {
    const checkActiveImport = async () => {
      if (!tenantId) return;
      
      const { data } = await supabase
        .from('import_staging')
        .select('job_status, job_progress')
        .eq('tenant_id', tenantId)
        .in('job_status', ['processing', 'pending'])
        .maybeSingle();
      
      setActiveImport(data);
    };

    checkActiveImport();
    const interval = setInterval(checkActiveImport, 5000); // Verificar a cada 5 segundos
    
    return () => clearInterval(interval);
  }, [tenantId]);

  const handleRunClustering = async () => {
    setClusteringLoading(true);
    try {
      // Verificar se há sessão válida antes de executar
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente para continuar",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
        setClusteringLoading(false);
        return;
      }

      // Verificar se há importação em andamento
      const { data: activeImportCheck } = await supabase
        .from('import_staging')
        .select('job_status, job_progress')
        .eq('tenant_id', tenantId)
        .in('job_status', ['processing', 'pending'])
        .maybeSingle();

      if (activeImportCheck) {
        toast({
          title: "Importação em andamento",
          description: `Aguarde a conclusão da importação (${activeImportCheck.job_progress || 0}%) antes de executar clustering`,
          variant: "destructive",
        });
        setClusteringLoading(false);
        return;
      }
      
      console.log("🔬 Running clustering with method:", clusteringMethod);
      console.log("📊 Segmentation type:", segmentationType);
      
      const response = await supabase.functions.invoke('clustering', {
        body: {
          method: clusteringMethod,
          params: clusteringParams,
          segmentationType: segmentationType
        }
      });

      if (response.error) {
        // Verificar se é erro de autenticação
        const errorMessage = response.error.message || "";
        if (errorMessage.includes("Auth session missing") || 
            errorMessage.includes("Unauthorized") ||
            errorMessage.includes("session_not_found")) {
          toast({
            title: "Sessão expirada",
            description: "Sua sessão expirou. Redirecionando para o login...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = '/auth';
          }, 2000);
          return;
        }
        throw new Error(errorMessage || "Erro ao executar clustering");
      }

      if (response.data.success) {
        console.log('✅ Clustering result:', {
          totalCustomers: response.data.totalCustomers,
          clustersCount: response.data.clusters.length,
          sampleCluster: response.data.clusters[0] ? {
            cluster: response.data.clusters[0].cluster,
            size: response.data.clusters[0].size,
            customerIdsCount: response.data.clusters[0].customerIds?.length || 0,
            hasCustomerIds: !!response.data.clusters[0].customerIds
          } : null
        });
        
        setClusteringResult(response.data);
        toast({
          title: "Clustering concluído!",
          description: `${response.data.clusters.length} clusters identificados com ${response.data.totalCustomers} clientes`,
        });
        
        await generateInsightsForAllClusters(response.data);
      }
    } catch (error) {
      console.error("Clustering error:", error);
      toast({
        title: "Erro no clustering",
        description: error instanceof Error ? error.message : "Falha ao executar algoritmo",
        variant: "destructive",
      });
    } finally {
      setClusteringLoading(false);
    }
  };

  const generateInsightsForAllClusters = async (clusteringData: any) => {
    setIsGeneratingInsights(true);
    
    try {
      console.log(`🤖 Generating AI insights for ${clusteringData.clusters.length} clusters...`);
      
      const clustersData = clusteringData.clusters
        .filter((c: any) => c.cluster !== -1)
        .map((cluster: any) => ({
          id: cluster.cluster,
          name: getClusterName(cluster, segmentationType),
          size: cluster.size,
          percentage: (cluster.size / clusteringData.totalCustomers) * 100,
          avgFeatures: cluster.avgFeatures || [],
          dominantGender: cluster.dominantGender,
          dominantCity: cluster.dominantCity,
          dominantGenre: cluster.dominantGenre
        }));
      
      const { data, error } = await supabase.functions.invoke('generate-segment-insights', {
        body: {
          segmentationType: segmentationType,
          clusters: clustersData,
          percentiles: clusteringData.percentiles,
          totalCustomers: clusteringData.totalCustomers
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.success) {
        const insightsMap = new Map();
        data.insights.forEach((insight: any) => {
          insightsMap.set(insight.clusterId, insight);
        });
        
        setGeneratedInsights(insightsMap);
        
        if (data.failed > 0) {
          toast({ 
            title: "Insights gerados parcialmente", 
            description: `${data.insights.length} de ${data.total} segmentos analisados pela IA`,
            variant: "default"
          });
        } else {
          toast({ 
            title: "Insights gerados com sucesso!", 
            description: `${data.insights.length} segmentos analisados pela IA` 
          });
        }
      }
      
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({ 
        title: "Erro ao gerar insights", 
        description: "Usando insights padrão. Verifique os logs.",
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleExportClusters = async (format: 'csv' | 'json') => {
    if (!clusteringResult) {
      toast({
        title: "Nenhum cluster para exportar",
        description: "Execute a segmentação primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Preparando exportação...",
        description: "Buscando dados dos clientes",
      });

      const allCustomerIds = clusteringResult.clusters
        .flatMap((cluster: any) => cluster.customerIds);
      
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .in('id', allCustomerIds);

      if (error) throw error;

      const customerMap = new Map(customers?.map(c => [c.id, c]) || []);

      const structuredData = clusteringResult.clusters.flatMap((cluster: any) => {
        const clusterName = getClusterName(cluster, segmentationType);
        
        return cluster.customerIds.map((customerId: number) => {
          const customer = customerMap.get(customerId);
          return {
            cluster: clusterName,
            customer_id: customerId,
            name: customer?.name || 'N/A',
            phone: customer?.phone || 'N/A',
            email: customer?.email || 'N/A',
            avg_recency: cluster.avgFeatures?.[0]?.toFixed(1) || 'N/A',
            avg_frequency: cluster.avgFeatures?.[1]?.toFixed(1) || 'N/A',
            avg_monetary: cluster.avgFeatures?.[2]?.toFixed(2) || 'N/A',
          };
        });
      });

      let content = '';
      let filename = '';
      let mimeType = '';

      if (format === 'csv') {
        const headers = 'cluster,customer_id,name,phone,email,avg_recency,avg_frequency,avg_monetary';
        const lines = structuredData.map(row => 
          `"${row.cluster}",${row.customer_id},"${row.name}","${row.phone}","${row.email}",${row.avg_recency},${row.avg_frequency},${row.avg_monetary}`
        );
        content = headers + '\n' + lines.join('\n');
        filename = `clusters-${Date.now()}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      } else {
        content = JSON.stringify(structuredData, null, 2);
        filename = `clusters-${Date.now()}.json`;
        mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportação concluída!",
        description: `${structuredData.length} clientes exportados em ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Falha ao exportar clusters",
        variant: "destructive",
      });
    }
  };

  const getClusterName = (cluster: any, type: SegmentationType): string => {
    if (cluster.cluster === -1) return 'Ruído';
    
    const percentiles: Percentiles | undefined = clusteringResult?.percentiles;
    
    if ((type === 'rfm' || type === 'valle-rfm') && cluster.avgRecency !== undefined) {
      if (percentiles && percentiles.recency && percentiles.frequency && percentiles.monetary) {
        const insight = getRFMSegmentNameDynamic({
          avgRecency: cluster.avgRecency,
          avgFrequency: cluster.avgFrequency,
          avgMonetary: cluster.avgMonetary,
        }, percentiles);
        return insight.name;
      }
      const insight = getRFMSegmentName({
        avgRecency: cluster.avgRecency,
        avgFrequency: cluster.avgFrequency,
        avgMonetary: cluster.avgMonetary,
      });
      return insight.name;
    } else if (type === 'demographic' && cluster.avgAge !== undefined) {
      if (percentiles && percentiles.age) {
        const insight = getDemographicInsightDynamic(
          cluster.avgAge,
          cluster.dominantGender || 'M',
          cluster.dominantCity || '',
          percentiles
        );
        return insight.name;
      }
      const ageSegment = cluster.avgAge < 25 ? '18-24' : 
                        cluster.avgAge < 35 ? '25-34' : 
                        cluster.avgAge < 50 ? '35-49' : '50+';
      const insight = getDemographicInsight(
        ageSegment,
        cluster.dominantGender || 'M',
        cluster.dominantCity || ''
      );
      return insight.name;
    } else if (type === 'behavioral' && cluster.avgDaysBetween !== undefined) {
      if (percentiles && percentiles.purchases && percentiles.daysBetween && percentiles.purchaseValue) {
        const insight = getBehavioralInsightDynamic(
          cluster.avgPurchases || 0,
          cluster.avgDaysBetween,
          cluster.avgPurchaseValue || 0,
          percentiles
        );
        return insight.name;
      }
      const estimatedDaysBefore = cluster.avgPurchaseValue > 150 ? 14 : 
                                  cluster.avgPurchaseValue > 80 ? 7 : 1;
      const insight = getBehavioralInsight(
        cluster.avgDaysBetween,
        estimatedDaysBefore
      );
      return insight.name;
    } else if (type === 'musical' && cluster.dominantGenre) {
      if (percentiles && percentiles.interactions && percentiles.spent) {
        const insight = getMusicalInsightDynamic(
          cluster.dominantGenre,
          cluster.avgInteractions || 0,
          cluster.avgSpent || 0,
          percentiles
        );
        return insight.name;
      }
      const insight = getMusicalInsight(cluster.dominantGenre);
      return insight.name;
    } else if (type === 'multi-dimensional') {
      const rfmSegment = cluster.dominantRfmSegment || 'Segmento';
      const ageSegment = cluster.dominantAgeSegment || '';
      const genre = cluster.dominantGenre || '';
      return `${rfmSegment}${ageSegment ? ' ' + ageSegment : ''}${genre ? ' - ' + genre : ''}`;
    }
    
    return `Cluster ${cluster.cluster}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clustering & Segmentação</h1>
          <p className="text-muted-foreground">
            Análise avançada de segmentação de clientes usando machine learning
          </p>
        </div>
      </div>

      {activeImport && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Importação em andamento</AlertTitle>
          <AlertDescription>
            Uma importação está em processamento ({activeImport.job_progress || 0}%). 
            O clustering ficará disponível após a conclusão da importação.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuração de Clustering</CardTitle>
          <CardDescription>
            Configure o tipo de segmentação e parâmetros do algoritmo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SegmentationTypeSelector 
            value={segmentationType}
            onChange={setSegmentationType}
          />
          
          <ClusteringConfig
            method={clusteringMethod}
            onMethodChange={setClusteringMethod}
            params={clusteringParams}
            onParamChange={(key, value) => setClusteringParams({ ...clusteringParams, [key]: value })}
            onRun={handleRunClustering}
            isLoading={clusteringLoading || isGeneratingInsights}
          />

          <div className="flex gap-4">
            
            {clusteringResult && (
              <>
                <Button 
                  onClick={() => handleExportClusters('csv')}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button 
                  onClick={() => handleExportClusters('json')}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar JSON
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {clusteringResult && (
        <>
          <ClusterQuality 
            silhouetteScore={clusteringResult.quality?.silhouetteScore}
            daviesBouldinScore={clusteringResult.quality?.daviesBouldinScore}
            noiseRatio={clusteringResult.quality?.noiseRatio}
            clusterSizes={clusteringResult.clusters.reduce((acc: any, c: any) => {
              acc[c.cluster] = c.size;
              return acc;
            }, {})}
            method={clusteringMethod}
            clusterNames={new Map(
              clusteringResult.clusters.map((c: any) => [
                c.cluster,
                getClusterName(c, segmentationType)
              ])
            )}
          />
          
          <ClusterVisualization 
            clusters={clusteringResult.clusters.map((c: any) => ({
              cluster: c.cluster,
              name: getClusterName(c, segmentationType),
              size: c.size,
              percentage: (c.size / clusteringResult.totalCustomers) * 100,
              avgRecency: c.avgRecency,
              avgFrequency: c.avgFrequency,
              avgMonetary: c.avgMonetary,
              color: c.color || `hsl(${(c.cluster * 360) / clusteringResult.clusters.length}, 70%, 60%)`
            }))}
            type={segmentationType}
            onClusterClick={(clusterName, customerIds) => {
              console.log('🎯 Cluster clicked:', {
                clusterName,
                customerIdsCount: customerIds.length,
                sampleIds: customerIds.slice(0, 3)
              });
              setSelectedCluster({ name: clusterName, customerIds });
            }}
            customerIds={new Map(
              clusteringResult.clusters.map((c: any) => [
                getClusterName(c, segmentationType),
                c.customerIds
              ])
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusteringResult.clusters
              .filter((c: any) => c.cluster !== -1)
              .map((cluster: any) => {
                const aiInsight = generatedInsights.get(cluster.cluster);
                const clusterName = getClusterName(cluster, segmentationType);
                const clusterSize = cluster.size;
                const clusterPercentage = (cluster.size / clusteringResult.totalCustomers) * 100;
                
                // Get fallback insight if AI insight not available
                let insightData;
                if (aiInsight) {
                  insightData = {
                    name: clusterName,
                    description: aiInsight.description || '',
                    characteristics: aiInsight.characteristics || [],
                    strategies: aiInsight.strategies || [],
                    priority: aiInsight.priority || 'medium',
                    color: cluster.color || `hsl(${(cluster.cluster * 360) / clusteringResult.clusters.length}, 70%, 60%)`
                  };
                } else {
                  // Fallback to static insight
                  if (segmentationType === 'rfm') {
                    const staticInsight = getRFMSegmentName({
                      avgRecency: cluster.avgRecency,
                      avgFrequency: cluster.avgFrequency,
                      avgMonetary: cluster.avgMonetary,
                    });
                    insightData = {
                      ...staticInsight,
                      name: clusterName,
                    };
                  } else {
                    insightData = {
                      name: clusterName,
                      description: `Segmento ${cluster.cluster}`,
                      characteristics: ['Aguardando análise...'],
                      strategies: ['Gerando estratégias...'],
                      priority: 'medium' as const,
                      color: cluster.color || `hsl(${(cluster.cluster * 360) / clusteringResult.clusters.length}, 70%, 60%)`
                    };
                  }
                }
                
                return (
                  <SegmentInsightCard
                    key={cluster.cluster}
                    insight={insightData}
                    size={clusterSize}
                    percentage={clusterPercentage}
                    totalValue={cluster.avgMonetary ? cluster.avgMonetary * clusterSize : undefined}
                    isLoading={isGeneratingInsights}
                  />
                );
              })}
          </div>
        </>
      )}

      <ClusterCustomersDialog
        open={!!selectedCluster}
        onOpenChange={(open) => !open && setSelectedCluster(null)}
        clusterName={selectedCluster?.name || ""}
        customerIds={selectedCluster?.customerIds || []}
        tenantId={tenantId || ""}
      />
    </div>
  );
}
