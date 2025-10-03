import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ObjectiveForm from "@/components/orchestrator/ObjectiveForm";
import DataPlanCard from "@/components/orchestrator/DataPlanCard";
import DataProfilePreview from "@/components/orchestrator/DataProfilePreview";
import HypothesisChips from "@/components/orchestrator/HypothesisChips";
import FindingsViewer from "@/components/orchestrator/FindingsViewer";
import StrategyCard from "@/components/orchestrator/StrategyCard";
import { Target, TrendingUp } from "lucide-react";

const STEPS = [
  "Objetivo & Contexto",
  "Plano de Dados",
  "Hipóteses",
  "Findings",
  "Estratégias",
  "Persistir"
];

export default function Orchestrator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [runId, setRunId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<any>({});
  const [goal, setGoal] = useState<string>("boost_revenue");
  const [constraints, setConstraints] = useState<any>({});
  const [plan, setPlan] = useState<any>(null);
  const [dataProfile, setDataProfile] = useState<any>(null);
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [approvedHypotheses, setApprovedHypotheses] = useState<any[]>([]);
  const [findings, setFindings] = useState<any>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'plan',
          payload: { newEvent, goal, constraints }
        }
      });

      if (error) throw error;
      
      setRunId(data.runId);
      setPlan(data.plan);
      setCurrentStep(1);
      
      toast({
        title: "✅ Plano gerado",
        description: "Plano de dados criado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'execute',
          payload: { runId, plan }
        }
      });

      if (error) throw error;
      
      setDataProfile(data.dataProfile);
      setCurrentStep(2);
      
      toast({
        title: "✅ Dados coletados",
        description: "DataProfile criado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHypotheses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'hypotheses',
          payload: { runId, dataProfile }
        }
      });

      if (error) throw error;
      
      setHypotheses(data.hypotheses.hypotheses || []);
      
      toast({
        title: "✅ Hipóteses geradas",
        description: `${data.hypotheses.hypotheses?.length || 0} hipóteses criadas`
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestHypotheses = async () => {
    if (approvedHypotheses.length === 0) {
      toast({
        title: "Atenção",
        description: "Aprove pelo menos uma hipótese",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'test',
          payload: { runId, dataProfile, approvedHypotheses }
        }
      });

      if (error) throw error;
      
      setFindings(data.findings.findings || data.findings);
      setCurrentStep(3);
      
      toast({
        title: "✅ Findings gerados",
        description: "Análise completa"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStrategies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'strategize',
          payload: { runId, findings, constraints }
        }
      });

      if (error) throw error;
      
      setStrategies(data.strategies || []);
      setCurrentStep(4);
      
      toast({
        title: "✅ Estratégias geradas",
        description: `${data.strategies?.length || 0} estratégias criadas`
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('orchestrator', {
        body: {
          action: 'save',
          payload: { runId }
        }
      });

      if (error) throw error;
      
      setCurrentStep(5);
      
      toast({
        title: "✅ Salvo com sucesso",
        description: "Análise e estratégias persistidas"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Orquestrador de Análise</h1>
          <p className="text-muted-foreground">Sistema guiado por dados: Planner → Analyst → Strategist</p>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            {STEPS.map((step, idx) => (
              <div
                key={step}
                className={`flex items-center gap-2 ${
                  idx === currentStep ? 'text-primary font-semibold' : ''
                } ${idx < currentStep ? 'text-green-600' : ''}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  idx === currentStep ? 'border-primary bg-primary/10' : 
                  idx < currentStep ? 'border-green-600 bg-green-600/10' : 'border-muted'
                }`}>
                  {idx + 1}
                </span>
                <span className="hidden md:inline">{step}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </Card>

      {/* Step Content */}
      {currentStep === 0 && (
        <ObjectiveForm
          newEvent={newEvent}
          setNewEvent={setNewEvent}
          goal={goal}
          setGoal={setGoal}
          constraints={constraints}
          setConstraints={setConstraints}
          onGenerate={handleGeneratePlan}
          loading={loading}
        />
      )}

      {currentStep === 1 && plan && (
        <DataPlanCard
          plan={plan}
          onExecute={handleExecutePlan}
          loading={loading}
        />
      )}

      {currentStep === 2 && dataProfile && (
        <DataProfilePreview
          dataProfile={dataProfile}
          onGenerateHypotheses={handleGenerateHypotheses}
          hypotheses={hypotheses}
          approvedHypotheses={approvedHypotheses}
          setApprovedHypotheses={setApprovedHypotheses}
          onTest={handleTestHypotheses}
          loading={loading}
        />
      )}

      {currentStep === 3 && findings && (
        <FindingsViewer
          findings={findings}
          onGenerateStrategies={handleGenerateStrategies}
          loading={loading}
        />
      )}

      {currentStep === 4 && strategies.length > 0 && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Estratégias Geradas</h2>
              </div>
              <Button onClick={handleSave} disabled={loading}>
                Salvar Tudo
              </Button>
            </div>
          </Card>
          
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
      )}

      {currentStep === 5 && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-fit rounded-full bg-green-100 p-4 mb-4">
            <TrendingUp className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Análise Completa!</h2>
          <p className="text-muted-foreground mb-6">
            DataProfile, Findings e Estratégias foram salvos no Supabase.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => {
              setCurrentStep(0);
              setRunId(null);
              setNewEvent({});
              setPlan(null);
              setDataProfile(null);
              setHypotheses([]);
              setApprovedHypotheses([]);
              setFindings(null);
              setStrategies([]);
            }}>
              Nova Análise
            </Button>
            <Button onClick={() => {
              // Export functionality
              const exportData = { dataProfile, findings, strategies };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analysis-${runId}.json`;
              a.click();
            }}>
              Exportar JSON
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}