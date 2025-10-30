import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";

interface BirthdayFiltersProps {
  onFilterChange: (filters: {
    month: number;
    clusters: string[];
    ageRanges: string[];
    weeks: number[];
    presencasRanges: string[];
  }) => void;
}

// Constantes calculadas UMA ÚNICA VEZ quando o módulo é carregado
const INITIAL_MONTH = new Date().getMonth() + 1;

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const WEEKS = [
  { value: 1, label: '1ª Semana (1-7)' },
  { value: 2, label: '2ª Semana (8-14)' },
  { value: 3, label: '3ª Semana (15-21)' },
  { value: 4, label: '4ª Semana (22+)' },
];

const PRESENCAS_RANGES = [
  { value: 'baixa', label: 'Baixa (1-5)', min: 1, max: 5 },
  { value: 'media', label: 'Média (6-15)', min: 6, max: 15 },
  { value: 'alta', label: 'Alta (16+)', min: 16, max: 999999 },
];

export function BirthdayFilters({ onFilterChange }: BirthdayFiltersProps) {
  const [month, setMonth] = useState(INITIAL_MONTH);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [selectedPresencasRanges, setSelectedPresencasRanges] = useState<string[]>([]);
  const [availableClusters, setAvailableClusters] = useState<string[]>([]);
  const [availableAgeRanges, setAvailableAgeRanges] = useState<string[]>([]);
  const { tenantId } = useTenant();

  useEffect(() => {
    if (tenantId) {
      loadFilterOptions();
    }
  }, [tenantId]);

  useEffect(() => {
    console.log('📊 Filtros atualizados:', { month, selectedClusters, selectedAgeRanges, selectedWeeks, selectedPresencasRanges });
    onFilterChange({ 
      month, 
      clusters: selectedClusters, 
      ageRanges: selectedAgeRanges, 
      weeks: selectedWeeks,
      presencasRanges: selectedPresencasRanges
    });
  }, [month, selectedClusters, selectedAgeRanges, selectedWeeks, selectedPresencasRanges, onFilterChange]);

  const loadFilterOptions = async () => {
    if (!tenantId) return;

    // @ts-ignore - Deep type instantiation from Supabase
    const { data: clusters } = await supabase
      .from('vw_valle_cluster_analysis')
      .select('cluster_comportamental')
      .eq('tenant_id', tenantId);

    // @ts-ignore - Deep type instantiation from Supabase
    const { data: rfmData } = await supabase
      .from('vw_valle_rfm')
      .select('faixa_etaria')
      .eq('tenant_id', tenantId)
      .not('faixa_etaria', 'is', null);

    if (clusters) {
      setAvailableClusters(clusters.map(c => c.cluster_comportamental));
    }

    if (rfmData) {
      const uniqueAges = [...new Set(rfmData.map(d => d.faixa_etaria).filter(Boolean))];
      setAvailableAgeRanges(uniqueAges as string[]);
    }
  };

  const toggleCluster = (cluster: string) => {
    setSelectedClusters(prev =>
      prev.includes(cluster) ? prev.filter(c => c !== cluster) : [...prev, cluster]
    );
  };

  const toggleAgeRange = (range: string) => {
    setSelectedAgeRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  const toggleWeek = (week: number) => {
    setSelectedWeeks(prev =>
      prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]
    );
  };

  const togglePresencasRange = (range: string) => {
    setSelectedPresencasRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  const clearFilters = () => {
    setMonth(INITIAL_MONTH);
    setSelectedClusters([]);
    setSelectedAgeRanges([]);
    setSelectedWeeks([]);
    setSelectedPresencasRanges([]);
  };

  const hasActiveFilters = selectedClusters.length > 0 || selectedAgeRanges.length > 0 || selectedWeeks.length > 0 || selectedPresencasRanges.length > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Filtros</h3>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Mês</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableClusters.length > 0 && (
            <div className="space-y-2">
              <Label>Clusters Comportamentais</Label>
              <div className="flex flex-wrap gap-2">
                {availableClusters.map(cluster => (
                  <Badge
                    key={cluster}
                    variant={selectedClusters.includes(cluster) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => toggleCluster(cluster)}
                  >
                    {cluster}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {availableAgeRanges.length > 0 && (
            <div className="space-y-2">
              <Label>Faixa Etária</Label>
              <div className="flex flex-wrap gap-2">
                {availableAgeRanges.map(range => (
                  <Badge
                    key={range}
                    variant={selectedAgeRanges.includes(range) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => toggleAgeRange(range)}
                  >
                    {range}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Semana do Mês</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKS.map(week => (
                <Badge
                  key={week.value}
                  variant={selectedWeeks.includes(week.value) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => toggleWeek(week.value)}
                >
                  {week.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Frequência de Visitas</Label>
            <div className="flex flex-wrap gap-2">
              {PRESENCAS_RANGES.map(range => (
                <Badge
                  key={range.value}
                  variant={selectedPresencasRanges.includes(range.value) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => togglePresencasRange(range.value)}
                >
                  {range.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}