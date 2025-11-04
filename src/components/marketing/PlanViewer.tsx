import { ArrowLeft, Download, Edit, Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhaseCard } from "./PhaseCard";
import { ClusterStrategyCard } from "./ClusterStrategyCard";
import { KeywordsCard } from "./KeywordsCard";
import { ReachStrategiesCard } from "./ReachStrategiesCard";
import { TargetAudienceCard } from "./TargetAudienceCard";
import { CompetitiveAnalysisCard } from "./CompetitiveAnalysisCard";
import { SuccessMetricsCard } from "./SuccessMetricsCard";
import { MarketingPlan, generatePlanText, copyToClipboard } from "@/lib/marketingHelpers";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";

interface PlanViewerProps {
  plan: MarketingPlan;
  eventName: string;
  onBack?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  isSaved?: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function PlanViewer({ plan, eventName, onBack, onSave, onEdit, isSaved }: PlanViewerProps) {
  const handleExportText = async () => {
    const text = generatePlanText(plan, eventName);
    const success = await copyToClipboard(text);
    if (success) {
      toast.success("Plano copiado para área de transferência!");
    } else {
      toast.error("Erro ao copiar plano");
    }
  };

  const budgetData = plan.general_strategy.budget_allocation 
    ? Object.entries(plan.general_strategy.budget_allocation).map(
        ([name, value]) => ({ name, value })
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          <h1 className="text-3xl font-bold">{eventName}</h1>
          <p className="text-muted-foreground">Plano de Marketing Completo</p>
        </div>
        <div className="flex gap-2">
          {!isSaved && onSave && (
            <Button onClick={onSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Plano
            </Button>
          )}
          {isSaved && onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          <Button variant="outline" onClick={handleExportText}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Texto
          </Button>
        </div>
      </div>

      {/* Estratégia Geral */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="text-2xl">Estratégia Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overview */}
          <div>
            <h3 className="font-semibold mb-2">Visão Geral</h3>
            <p className="text-muted-foreground leading-relaxed">
              {plan.general_strategy.overview}
            </p>
          </div>

          {/* Mensagens-Chave */}
          <div>
            <h3 className="font-semibold mb-3">Mensagens-Chave</h3>
            <div className="space-y-2">
              {plan.general_strategy.key_messages.map((message, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg"
                >
                  <span className="font-bold text-primary">{index + 1}.</span>
                  <span>{message}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Canais */}
            <div>
              <h3 className="font-semibold mb-3">Canais Prioritários</h3>
              <div className="flex flex-wrap gap-2">
                {plan.general_strategy.channels.map((channel) => (
                  <Badge key={channel} variant="secondary" className="text-sm">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Budget Allocation */}
            <div>
              <h3 className="font-semibold mb-3">Alocação de Orçamento</h3>
              {budgetData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={budgetData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ value }) => `${value}%`}
                    >
                      {budgetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados de orçamento</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Palavras-Chave */}
      {plan.keywords && (
        <KeywordsCard keywords={plan.keywords} />
      )}

      {/* Público-Alvo */}
      {plan.target_audience && (
        <TargetAudienceCard audience={plan.target_audience} />
      )}

      {/* Análise Competitiva */}
      {plan.competitive_analysis && (
        <CompetitiveAnalysisCard analysis={plan.competitive_analysis} />
      )}

      {/* Estratégias de Alcance */}
      {plan.reach_strategies && plan.reach_strategies.length > 0 && (
        <ReachStrategiesCard strategies={plan.reach_strategies} />
      )}

      {/* Métricas de Sucesso */}
      {plan.success_metrics && plan.success_metrics.length > 0 && (
        <SuccessMetricsCard metrics={plan.success_metrics} />
      )}

      {/* Timeline de Fases */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Timeline do Plano</h2>
        <div className="space-y-4">
          {plan.phases.map((phase) => (
            <PhaseCard key={phase.phase_number} phase={phase} />
          ))}
        </div>
      </div>

      {/* Estratégias por Cluster */}
      {plan.cluster_strategies && plan.cluster_strategies.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Estratégias por Cluster</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.cluster_strategies.map((strategy, index) => (
              <ClusterStrategyCard key={index} strategy={strategy} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
