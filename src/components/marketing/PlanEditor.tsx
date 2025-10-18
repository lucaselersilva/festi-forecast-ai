import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingPlan } from "@/lib/marketingHelpers";
import { toast } from "sonner";

interface PlanEditorProps {
  plan: MarketingPlan;
  eventData: {
    event_name: string;
    event_date: string;
    event_city: string;
    event_venue?: string;
  };
  onSave: (plan: MarketingPlan, eventData: any) => Promise<void>;
  onCancel: () => void;
}

export function PlanEditor({ plan, eventData, onSave, onCancel }: PlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState<MarketingPlan>(plan);
  const [editedEventData, setEditedEventData] = useState(eventData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedPlan, editedEventData);
      toast.success("Plano atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar plano");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePhaseAction = (
    phaseIndex: number,
    actionIndex: number,
    field: string,
    value: string
  ) => {
    const newPlan = { ...editedPlan };
    newPlan.phases[phaseIndex].actions[actionIndex] = {
      ...newPlan.phases[phaseIndex].actions[actionIndex],
      [field]: value,
    };
    setEditedPlan(newPlan);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onCancel} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <h1 className="text-3xl font-bold">Editar Plano</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Dados Básicos do Evento */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Evento</Label>
              <Input
                value={editedEventData.event_name}
                onChange={(e) =>
                  setEditedEventData({ ...editedEventData, event_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={editedEventData.event_date}
                onChange={(e) =>
                  setEditedEventData({ ...editedEventData, event_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={editedEventData.event_city}
                onChange={(e) =>
                  setEditedEventData({ ...editedEventData, event_city: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Local</Label>
              <Input
                value={editedEventData.event_venue || ""}
                onChange={(e) =>
                  setEditedEventData({ ...editedEventData, event_venue: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estratégia Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Estratégia Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Overview</Label>
            <Textarea
              value={editedPlan.general_strategy.overview}
              onChange={(e) =>
                setEditedPlan({
                  ...editedPlan,
                  general_strategy: {
                    ...editedPlan.general_strategy,
                    overview: e.target.value,
                  },
                })
              }
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fases */}
      {editedPlan.phases.map((phase, phaseIndex) => (
        <Card key={phaseIndex}>
          <CardHeader>
            <CardTitle>
              Fase {phase.phase_number}: {phase.phase_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Textarea
                value={phase.objective}
                onChange={(e) => {
                  const newPlan = { ...editedPlan };
                  newPlan.phases[phaseIndex].objective = e.target.value;
                  setEditedPlan(newPlan);
                }}
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-lg">Ações</Label>
              {phase.actions.map((action, actionIndex) => (
                <div key={actionIndex} className="p-4 border rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Ação</Label>
                      <Input
                        value={action.action}
                        onChange={(e) =>
                          updatePhaseAction(phaseIndex, actionIndex, "action", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Canal</Label>
                      <Input
                        value={action.channel}
                        onChange={(e) =>
                          updatePhaseAction(phaseIndex, actionIndex, "channel", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={action.message}
                      onChange={(e) =>
                        updatePhaseAction(phaseIndex, actionIndex, "message", e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Timing</Label>
                      <Input
                        value={action.timing}
                        onChange={(e) =>
                          updatePhaseAction(phaseIndex, actionIndex, "timing", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>KPI</Label>
                      <Input
                        value={action.kpi}
                        onChange={(e) =>
                          updatePhaseAction(phaseIndex, actionIndex, "kpi", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
