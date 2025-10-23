import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ObjectiveForm from "@/components/orchestrator/ObjectiveForm";
import DataProfilePreview from "@/components/orchestrator/DataProfilePreview";
import FindingsViewer from "@/components/orchestrator/FindingsViewer";
import StrategyCard from "@/components/orchestrator/StrategyCard";
import { Target, TrendingUp, Sparkles, Loader2 } from "lucide-react";

const STEPS = ["Setup", "Resultados"];

export default function Orchestrator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [runId, setRunId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<any>({});
  const [goal, setGoal] = useState<string>("boost_revenue");
  const [constraints, setConstraints] = useState<any>({});
  const [dataProfile, setDataProfile] = useState<any>(null);
  const [findings, setFindings] = useState<any>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const { toast } = useToast();

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleGenerateComplete = async () => {
    setLoading(true);
    
    try {
      // Step 1: Generate Plan
      setLoadingStep("Gerando plano de dados...");
      const { data: planData, error: planError } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'plan',
          payload: { newEvent, goal, constraints }
        }
      });

      if (planError) throw planError;
      
      const generatedRunId = planData.runId;
      const plan = planData.plan;
      setRunId(generatedRunId);

      // Step 2: Execute Plan
      setLoadingStep("Coletando dados...");
      const { data: executeData, error: executeError } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'execute',
          payload: { runId: generatedRunId, plan }
        }
      });

      if (executeError) throw executeError;
      
      const profile = executeData.dataProfile;
      setDataProfile(profile);

      // Step 3: Generate Hypotheses
      setLoadingStep("Gerando hipóteses...");
      const { data: hypothesesData, error: hypothesesError } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'hypotheses',
          payload: { runId: generatedRunId, dataProfile: profile }
        }
      });

      if (hypothesesError) throw hypothesesError;
      
      const allHypotheses = hypothesesData.hypotheses.hypotheses || [];

      // Step 4: Test ALL Hypotheses (sem aprovação manual)
      setLoadingStep("Testando hipóteses...");
      const { data: testData, error: testError } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'test',
          payload: { runId: generatedRunId, dataProfile: profile, approvedHypotheses: allHypotheses }
        }
      });

      if (testError) throw testError;
      
      const generatedFindings = testData.findings.findings || testData.findings;
      setFindings(generatedFindings);

      // Step 5: Generate Strategies
      setLoadingStep("Gerando estratégias...");
      const { data: strategiesData, error: strategiesError } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'strategize',
          payload: { runId: generatedRunId, findings: generatedFindings, constraints }
        }
      });

      if (strategiesError) throw strategiesError;
      
      const generatedStrategies = Array.isArray(strategiesData.strategies) 
        ? strategiesData.strategies 
        : [];
      setStrategies(generatedStrategies);

      // Step 6: Auto-save
      setLoadingStep("Salvando análise...");
      await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'save',
          payload: { runId: generatedRunId }
        }
      });

      setCurrentStep(1);
      
      toast({
        title: "✅ Análise Completa",
        description: `${generatedStrategies.length} estratégias geradas e salvas`
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setRunId(null);
    setNewEvent({});
    setGoal("boost_revenue");
    setConstraints({});
    setDataProfile(null);
    setFindings(null);
    setStrategies([]);
  };

  const handleExport = () => {
    const exportData = { dataProfile, findings, strategies };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${runId}.json`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Orquestrador de Análise</h1>
          <p className="text-muted-foreground">
            Sistema integrado: análise completa em um clique
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            {STEPS.map((step, idx) => (
              <div
                key={step}
                className={`flex items-center gap-2 ${
                  idx === currentStep ? 'text-primary font-semibold' : ''
                } ${idx < currentStep ? 'text-success' : 'text-muted-foreground'}`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  idx === currentStep ? 'border-primary bg-primary/10' : 
                  idx < currentStep ? 'border-success bg-success/10' : 'border-muted'
                }`}>
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </Card>

      {/* Step 1: Setup */}
      {currentStep === 0 && (
        <ObjectiveForm
          newEvent={newEvent}
          setNewEvent={setNewEvent}
          goal={goal}
          setGoal={setGoal}
          constraints={constraints}
          setConstraints={setConstraints}
          onGenerate={handleGenerateComplete}
          loading={loading}
        />
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Processando Análise</h3>
              <p className="text-muted-foreground">{loadingStep}</p>
              <p className="text-xs text-muted-foreground mt-2">
                ⏱️ Isso pode levar 30-60 segundos
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Resultados */}
      {currentStep === 1 && !loading && (
        <div className="space-y-6">
          {/* Data Profile */}
          {dataProfile && (
            <Card className="p-6 space-y-6">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  DataProfile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Segmentos */}
                {dataProfile.segments && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {dataProfile.segments.attended_similar && (
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">🎵 Frequentaram Similar</div>
                        <div className="text-2xl font-bold">{dataProfile.segments.attended_similar.count}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Média: R${dataProfile.segments.attended_similar.avg_monetary?.toFixed(0)}
                        </div>
                      </div>
                    )}
                    
                    {dataProfile.segments.high_value && (
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">⭐ Alto Valor</div>
                        <div className="text-2xl font-bold">{dataProfile.segments.high_value.count}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Média: R${dataProfile.segments.high_value.avg_monetary?.toFixed(0)}
                        </div>
                      </div>
                    )}
                    
                    {dataProfile.segments.at_risk && (
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">⚠️ Em Risco</div>
                        <div className="text-2xl font-bold">{dataProfile.segments.at_risk.count}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Inatividade: {dataProfile.segments.at_risk.avg_recency?.toFixed(0)}d
                        </div>
                      </div>
                    )}
                    
                    {dataProfile.segments.high_bar_spenders && (
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">🍺 Alto Consumo Bar</div>
                        <div className="text-2xl font-bold">{dataProfile.segments.high_bar_spenders.count}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Média bar: R${dataProfile.segments.high_bar_spenders.avg_spend?.toFixed(0)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Benchmarks */}
                {dataProfile.analogous_events && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Benchmarks de Eventos Similares</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground">Eventos Similares</div>
                        <div className="text-xl font-bold">{dataProfile.analogous_events.total_found}</div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground">Ocupação Média</div>
                        <div className="text-xl font-bold">
                          {(dataProfile.analogous_events.avg_occupancy * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground">Receita Média</div>
                        <div className="text-xl font-bold">
                          R${(dataProfile.analogous_events.avg_revenue / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground">Preço Médio</div>
                        <div className="text-xl font-bold">
                          R${dataProfile.analogous_events.avg_ticket_price?.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Findings & Strategies Combined */}
          {findings && (
            <Card className="p-6 space-y-6">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Insights & Estratégias
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                {/* Findings Summary */}
                <div className="prose prose-sm max-w-none">
                  {findings.key_segments && Array.isArray(findings.key_segments) && findings.key_segments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">🎯 Segmentos Identificados:</h4>
                      {findings.key_segments.slice(0, 3).map((seg: any, idx: number) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          • <strong>{seg.name}</strong> ({seg.size} clientes): {seg.evidence?.[0]}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {findings.opportunities && Array.isArray(findings.opportunities) && findings.opportunities.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="font-semibold text-sm">💡 Oportunidades:</h4>
                      {findings.opportunities.slice(0, 2).map((opp: any, idx: number) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          • {opp.hypothesis} - <em>{opp.est_impact}</em>
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Strategies */}
                {Array.isArray(strategies) && strategies.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h3 className="font-semibold text-lg">🚀 Estratégias Recomendadas</h3>
                    <div className="grid gap-4">
                      {strategies.map((strategy, idx) => (
                        <StrategyCard
                          key={idx}
                          strategy={strategy}
                          runId={runId!}
                          eventId={null}
                          constraints={constraints}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={handleReset}>
              Nova Análise
            </Button>
            <Button onClick={handleExport}>
              Exportar JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
