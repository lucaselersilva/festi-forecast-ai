import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Cake, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BirthdayFilters } from "@/components/birthday/BirthdayFilters";
import { BirthdayMetrics } from "@/components/birthday/BirthdayMetrics";
import { BirthdayTable } from "@/components/birthday/BirthdayTable";
import { BirthdayCustomerDetails } from "@/components/birthday/BirthdayCustomerDetails";
import { 
  BirthdayCustomer,
  BirthdayMetrics as MetricsType,
  getMonthBirthdays,
  calculateBirthdayMetrics,
  exportBirthdayList
} from "@/lib/birthdayHelpers";

export function ZigBirthdays() {
  const [customers, setCustomers] = useState<BirthdayCustomer[]>([]);
  const [metrics, setMetrics] = useState<MetricsType>({
    totalCelebrantes: 0,
    consumoMedio: 0,
    recenciaMedia: 0,
    taxaPresencaMedia: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<BirthdayCustomer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    clusters: [] as string[],
    ageRanges: [] as string[],
  });
  const { toast } = useToast();
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBirthdayData();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentFilters]);

  const loadBirthdayData = async () => {
    if (isLoadingRef.current) {
      console.log('Load already in progress, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    try {
      const data = await getMonthBirthdays(currentFilters);
      setCustomers(data);
      
      const calculatedMetrics = calculateBirthdayMetrics(data);
      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Error loading birthday data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportBirthdayList(customers, currentFilters.month, currentFilters.year);
      toast({
        title: "Lista exportada com sucesso!",
        description: `${result.count} aniversariantes exportados para ${result.fileName}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = useCallback((filters: typeof currentFilters) => {
    setCurrentFilters(filters);
  }, []);

  const handleViewDetails = (customer: BirthdayCustomer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            Aniversariantes do Mês
          </CardTitle>
          <CardDescription>
            Ative seus clientes aniversariantes com campanhas especiais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Filtre por mês e cluster para encontrar oportunidades de reativação
            </p>
            <Button
              onClick={handleExport}
              disabled={exporting || customers.length === 0}
              variant="outline"
            >
              <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-bounce' : ''}`} />
              {exporting ? 'Exportando...' : 'Exportar Lista'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <BirthdayFilters onFilterChange={handleFilterChange} />

      {customers.length === 0 ? (
        <Alert>
          <AlertDescription>
            Nenhum aniversariante encontrado para os filtros selecionados. 
            Tente selecionar outro mês ou remover alguns filtros.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <BirthdayMetrics metrics={metrics} />
          <BirthdayTable customers={customers} onViewDetails={handleViewDetails} />
        </>
      )}

      <BirthdayCustomerDetails
        customer={selectedCustomer}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}