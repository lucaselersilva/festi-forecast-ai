import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, TrendingUp, AlertTriangle, Target } from "lucide-react";

interface Props {
  findings: any;
  onGenerateStrategies: () => void;
  loading: boolean;
}

export default function FindingsViewer({ findings, onGenerateStrategies, loading }: Props) {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Passo 4: Findings</h2>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-6">
          {/* Key Segments */}
          {findings.key_segments && findings.key_segments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Segmentos-Chave</h3>
              </div>
              {findings.key_segments.map((segment: any, idx: number) => (
                <div key={idx} className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{segment.name}</h4>
                    <Badge variant="outline">{segment.size} clientes</Badge>
                  </div>
                  {segment.rfm && (
                    <div className="text-sm text-muted-foreground">
                      RFM: R={segment.rfm.R || 'N/A'}, F={segment.rfm.F || 'N/A'}, M={segment.rfm.M || 'N/A'}
                    </div>
                  )}
                  {segment.evidence && segment.evidence.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Evidências:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {segment.evidence.map((ev: string, eidx: number) => (
                          <li key={eidx} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Opportunities */}
          {findings.opportunities && findings.opportunities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold">Oportunidades</h3>
              </div>
              {findings.opportunities.map((opp: any, idx: number) => (
                <div key={idx} className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">{opp.hypothesis}</h4>
                  {opp.est_impact && (
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                      Impacto: {opp.est_impact}
                    </Badge>
                  )}
                  {opp.evidence && opp.evidence.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Evidências:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {opp.evidence.map((ev: string, eidx: number) => (
                          <li key={eidx} className="flex items-start gap-2">
                            <span className="text-green-600">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Risks */}
          {findings.risks && findings.risks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold">Riscos</h3>
              </div>
              {findings.risks.map((risk: any, idx: number) => (
                <div key={idx} className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">{risk.desc}</h4>
                  {risk.evidence && risk.evidence.length > 0 && (
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {risk.evidence.map((ev: string, eidx: number) => (
                        <li key={eidx} className="flex items-start gap-2">
                          <span className="text-orange-600">•</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Button
        onClick={onGenerateStrategies}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Gerando...' : 'Gerar Estratégias'}
      </Button>
    </Card>
  );
}