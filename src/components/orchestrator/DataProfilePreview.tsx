import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Lightbulb } from "lucide-react";
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
          <h2 className="text-2xl font-bold">DataProfile Preview</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Clientes</div>
            <div className="text-2xl font-bold">{dataProfile.population?.n_customers || 0}</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Período (dias)</div>
            <div className="text-2xl font-bold">{dataProfile.population?.period_days || 0}</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Qualidade</div>
            <div className="text-2xl font-bold">
              {100 - (dataProfile.quality?.missing_pct || 0)}%
            </div>
          </div>
        </div>

        {dataProfile.rfm_percentiles && (
          <div>
            <h3 className="font-semibold mb-2">Percentis RFM:</h3>
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

        {dataProfile.music?.top_genres && dataProfile.music.top_genres.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Top Gêneros:</h3>
            <div className="flex flex-wrap gap-2">
              {dataProfile.music.top_genres.slice(0, 5).map((genre: any, idx: number) => (
                <Badge key={idx} variant="secondary">{genre.name}</Badge>
              ))}
            </div>
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