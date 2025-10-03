import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Lightbulb, Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import HypothesisChips from "./HypothesisChips";

interface Props {
  dataProfile: any;
  onGenerateHypotheses: () => void;
  hypotheses: any[];
  approvedHypotheses: any[];
  setApprovedHypotheses: (hyps: any[]) => void;
  onTest: () => void;
  loading: boolean;
}

export default function DataProfilePreview({
  dataProfile,
  onGenerateHypotheses,
  hypotheses,
  approvedHypotheses,
  setApprovedHypotheses,
  onTest,
  loading
}: Props) {
  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">DataProfile - Segmentos Identificados</h2>
        </div>

        {/* Segmentos */}
        {dataProfile.segments && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Segmentos Encontrados:
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {dataProfile.segments.attended_similar && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">🎵 Frequentaram Similar</div>
                  <div className="text-2xl font-bold">{dataProfile.segments.attended_similar.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Gasto médio: R${dataProfile.segments.attended_similar.avg_monetary?.toFixed(0)}
                  </div>
                </div>
              )}
              
              {dataProfile.segments.high_value && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">⭐ Alto Valor</div>
                  <div className="text-2xl font-bold">{dataProfile.segments.high_value.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Gasto médio: R${dataProfile.segments.high_value.avg_monetary?.toFixed(0)}
                  </div>
                </div>
              )}
              
              {dataProfile.segments.at_risk && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">⚠️ Em Risco</div>
                  <div className="text-2xl font-bold">{dataProfile.segments.at_risk.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Inatividade média: {dataProfile.segments.at_risk.avg_recency?.toFixed(0)} dias
                  </div>
                </div>
              )}
              
              {dataProfile.segments.high_bar_spenders && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">🍺 Alto Consumo Bar</div>
                  <div className="text-2xl font-bold">{dataProfile.segments.high_bar_spenders.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Gasto médio bar: R${dataProfile.segments.high_bar_spenders.avg_spend?.toFixed(0)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Eventos Análogos */}
        {dataProfile.analogous_events && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Benchmarks de Eventos Similares:
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Eventos</div>
                <div className="text-2xl font-bold">{dataProfile.analogous_events.total_found}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Ocupação Média</div>
                <div className="text-2xl font-bold">
                  {(dataProfile.analogous_events.avg_occupancy * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Receita Média</div>
                <div className="text-2xl font-bold">
                  R${dataProfile.analogous_events.avg_revenue?.toFixed(0)}
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Preço Médio</div>
                <div className="text-2xl font-bold">
                  R${dataProfile.analogous_events.avg_ticket_price?.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RFM Percentiles */}
        {dataProfile.rfm_percentiles && (
          <div>
            <h3 className="font-semibold mb-2">Percentis RFM (Base Total):</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium">Recency</div>
                <div className="text-muted-foreground">
                  P25: {dataProfile.rfm_percentiles.R.p25.toFixed(0)}d |
                  P50: {dataProfile.rfm_percentiles.R.p50.toFixed(0)}d |
                  P75: {dataProfile.rfm_percentiles.R.p75.toFixed(0)}d
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Frequency</div>
                <div className="text-muted-foreground">
                  P25: {dataProfile.rfm_percentiles.F.p25.toFixed(0)} |
                  P50: {dataProfile.rfm_percentiles.F.p50.toFixed(0)} |
                  P75: {dataProfile.rfm_percentiles.F.p75.toFixed(0)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Monetary</div>
                <div className="text-muted-foreground">
                  P25: R${dataProfile.rfm_percentiles.M.p25.toFixed(0)} |
                  P50: R${dataProfile.rfm_percentiles.M.p50.toFixed(0)} |
                  P75: R${dataProfile.rfm_percentiles.M.p75.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Population */}
        {dataProfile.population && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Base Total de Clientes</div>
            <div className="text-2xl font-bold">{dataProfile.population.total_customers?.toLocaleString()}</div>
          </div>
        )}

        {hypotheses.length === 0 && (
          <Button
            onClick={onGenerateHypotheses}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            {loading ? 'Gerando...' : 'Gerar Hipóteses'}
          </Button>
        )}
      </Card>

      {hypotheses.length > 0 && (
        <HypothesisChips
          hypotheses={hypotheses}
          approvedHypotheses={approvedHypotheses}
          setApprovedHypotheses={setApprovedHypotheses}
          onTest={onTest}
          loading={loading}
        />
      )}
    </div>
  );
}