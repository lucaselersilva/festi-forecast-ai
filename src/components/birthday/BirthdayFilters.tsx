import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BirthdayFiltersProps {
  onFilterChange: (filters: {
    month: number;
    year: number;
    clusters: string[];
    ageRanges: string[];
  }) => void;
}

// Constantes calculadas UMA ÚNICA VEZ quando o módulo é carregado
const INITIAL_MONTH = new Date().getMonth() + 1;
const INITIAL_YEAR = new Date().getFullYear();

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

export function BirthdayFilters({ onFilterChange }: BirthdayFiltersProps) {
  const [month, setMonth] = useState(INITIAL_MONTH);
  const [year, setYear] = useState(INITIAL_YEAR);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([]);
  const [availableClusters, setAvailableClusters] = useState<string[]>([]);
  const [availableAgeRanges, setAvailableAgeRanges] = useState<string[]>([]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    console.log('📊 Filtros atualizados:', { month, year, selectedClusters, selectedAgeRanges });
    onFilterChange({ month, year, clusters: selectedClusters, ageRanges: selectedAgeRanges });
  }, [month, year, selectedClusters, selectedAgeRanges, onFilterChange]);

  const loadFilterOptions = async () => {
    const { data: clusters } = await supabase
      .from('vw_valle_cluster_analysis')
      .select('cluster_comportamental');

    const { data: rfmData } = await supabase
      .from('vw_valle_rfm')
      .select('faixa_etaria')
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

  const clearFilters = () => {
    setMonth(INITIAL_MONTH);
    setYear(INITIAL_YEAR);
    setSelectedClusters([]);
    setSelectedAgeRanges([]);
  };

  const hasActiveFilters = selectedClusters.length > 0 || selectedAgeRanges.length > 0;

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        </div>
      </CardContent>
    </Card>
  );
}