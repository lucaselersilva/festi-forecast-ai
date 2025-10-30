import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BirthdayFilters } from "@/components/birthday/BirthdayFilters";
import { BirthdayMetrics } from "@/components/birthday/BirthdayMetrics";
import { BirthdayTable } from "@/components/birthday/BirthdayTable";
import { BirthdayClusterCard } from "@/components/birthday/BirthdayClusterCard";
import { ClusteringLoader } from "@/components/birthday/ClusteringLoader";
import { BirthdayCustomer, getBirthdayCustomers, generateClusterActions, getClusterActions, exportBirthdayList } from "@/lib/birthdayHelpers";
import { Sparkles, Download, Cake } from "lucide-react";

export default function Birthdays() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<BirthdayCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingActions, setGeneratingActions] = useState(false);
  const [clusterActions, setClusterActions] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    clusters: [] as string[],
    ageRanges: [] as string[],
    weeks: [] as number[]
  });

  useEffect(() => {
    loadCustomers();
    loadExistingActions();
  }, [filters]);

  const filterByWeeks = (customers: BirthdayCustomer[]): BirthdayCustomer[] => {
    if (filters.weeks.length === 0) return customers;
    
    return customers.filter(customer => {
      if (!customer.aniversario) return false;
      
      const day = new Date(customer.aniversario).getDate();
      
      return filters.weeks.some(week => {
        if (week === 1) return day >= 1 && day <= 7;
        if (week === 2) return day >= 8 && day <= 14;
        if (week === 3) return day >= 15 && day <= 21;
        if (week === 4) return day >= 22;
        return false;
      });
    });
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getBirthdayCustomers(
        filters.month,
        filters.clusters,
        filters.ageRanges
      );
      
      const filteredData = filterByWeeks(data);
      setCustomers(filteredData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar aniversariantes",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingActions = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const actions = await getClusterActions(filters.month, currentYear);
      setClusterActions(actions);
    } catch (error) {
      console.error('Error loading existing actions:', error);
    }
  };

  const handleGenerateActions = async () => {
    setGeneratingActions(true);
    try {
      const currentYear = new Date().getFullYear();
      await generateClusterActions(filters.month, currentYear);
      await loadExistingActions();
      toast({
        title: "✨ Ações geradas!",
        description: "Estratégias personalizadas criadas para cada cluster"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar ações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGeneratingActions(false);
    }
  };

  const handleExport = () => {
    exportBirthdayList(customers, filters.month);
    toast({
      title: "Lista exportada!",
      description: "Download iniciado"
    });
  };

  const handleViewDetails = (customer: BirthdayCustomer) => {
    toast({
      title: "Detalhes do Cliente",
      description: `${customer.nome} - ${customer.email || customer.telefone || 'Sem contato'}`
    });
  };

  const groupByCluster = () => {
    const groups: Record<string, BirthdayCustomer[]> = {};
    customers.forEach(customer => {
      const cluster = customer.cluster_comportamental || 'Sem Cluster';
      if (!groups[cluster]) {
        groups[cluster] = [];
      }
      groups[cluster].push(customer);
    });
    return groups;
  };

  const clusteredCustomers = groupByCluster();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
            <Cake className="h-10 w-10 text-primary" />
            Aniversariantes
          </h1>
          <p className="text-muted-foreground mt-2">
            Análise completa e ações personalizadas por cluster
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={customers.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Lista
          </Button>
          <Button onClick={handleGenerateActions} disabled={generatingActions || customers.length === 0}>
            <Sparkles className="mr-2 h-4 w-4" />
            {generatingActions ? 'Gerando...' : 'Gerar Ações com IA'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <BirthdayFilters onFilterChange={setFilters} />

      {/* Loading state */}
      {generatingActions && <ClusteringLoader />}

      {/* Metrics */}
      {!loading && customers.length > 0 && (
        <BirthdayMetrics metrics={{
          totalCelebrantes: customers.length,
          consumoMedio: customers.reduce((sum, c) => sum + (c.consumo || 0), 0) / customers.length,
          recenciaMedia: customers.reduce((sum, c) => sum + (c.recency_days || 0), 0) / customers.length,
          taxaPresencaMedia: customers.reduce((sum, c) => sum + (c.presencas || 0), 0) / customers.length
        }} />
      )}

      {/* Cluster Actions */}
      {clusterActions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">🎯 Estratégias por Cluster</h2>
          <div className="grid gap-4">
            {clusterActions.map((clusterAction) => {
              const clusterCustomers = clusteredCustomers[clusterAction.cluster_name] || [];
              return (
                <BirthdayClusterCard
                  key={clusterAction.cluster_name}
                  cluster={{
                    name: clusterAction.cluster_name,
                    size: clusterAction.cluster_size,
                    ...clusterAction.analysis,
                    ...clusterAction.actions
                  }}
                  customers={clusterCustomers}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Birthday Table */}
      {!loading && customers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Lista Completa de Aniversariantes</CardTitle>
          </CardHeader>
          <CardContent>
            <BirthdayTable customers={customers} onViewDetails={handleViewDetails} />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && customers.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Cake className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum aniversariante encontrado</h3>
              <p className="text-muted-foreground">
                Não há clientes com aniversário no mês selecionado com os filtros aplicados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}