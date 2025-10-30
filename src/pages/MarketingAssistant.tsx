import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingForm } from "@/components/marketing/MarketingForm";
import { PlanViewer } from "@/components/marketing/PlanViewer";
import { PlanEditor } from "@/components/marketing/PlanEditor";
import { PlansList } from "@/components/marketing/PlansList";
import { GeneratingLoader } from "@/components/marketing/GeneratingLoader";
import { MarketingPlan } from "@/lib/marketingHelpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

type ViewMode = "form" | "list" | "viewer" | "editor" | "generating";

interface EventFormData {
  event_name: string;
  event_date: string;
  event_city: string;
  event_venue?: string;
  event_genre: string;
  target_audience: string;
  capacity: number;
  ticket_price: number;
  budget: number;
  description?: string;
}

export default function MarketingAssistant() {
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [currentPlan, setCurrentPlan] = useState<MarketingPlan | null>(null);
  const [currentEventData, setCurrentEventData] = useState<EventFormData | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const { tenantId } = useTenant();

  const handleGeneratePlan = async (eventData: EventFormData) => {
    setViewMode("generating");
    setCurrentEventData(eventData);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marketing-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao gerar plano");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao gerar plano");
      }

      setCurrentPlan(result.data);
      setViewMode("viewer");
      toast.success("Plano gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar plano de marketing");
      setViewMode("form");
    }
  };

  const handleSavePlan = async () => {
    if (!currentPlan || !currentEventData) return;

    try {
      const { data, error } = await supabase.from("marketing_plans").insert({
        event_name: currentEventData.event_name,
        event_date: currentEventData.event_date,
        event_city: currentEventData.event_city,
        event_venue: currentEventData.event_venue,
        event_genre: currentEventData.event_genre,
        target_audience: currentEventData.target_audience,
        capacity: currentEventData.capacity,
        ticket_price: currentEventData.ticket_price,
        budget: currentEventData.budget,
        description: currentEventData.description,
        marketing_plan: currentPlan as any,
        general_strategy: currentPlan.general_strategy as any,
        cluster_strategies: currentPlan.cluster_strategies as any,
        status: "active",
        tenant_id: tenantId,
      }).select().single();

      if (error) throw error;

      setCurrentPlanId(data.id);
      toast.success("Plano salvo com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar plano");
    }
  };

  const handleViewPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from("marketing_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (error) throw error;

      setCurrentPlan(data.marketing_plan as unknown as MarketingPlan);
      setCurrentEventData({
        event_name: data.event_name,
        event_date: data.event_date,
        event_city: data.event_city,
        event_venue: data.event_venue,
        event_genre: data.event_genre,
        target_audience: data.target_audience,
        capacity: data.capacity,
        ticket_price: data.ticket_price,
        budget: data.budget,
        description: data.description,
      });
      setCurrentPlanId(planId);
      setViewMode("viewer");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar plano");
    }
  };

  const handleEditPlan = async (planId: string) => {
    await handleViewPlan(planId);
    setViewMode("editor");
  };

  const handleDuplicatePlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from("marketing_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (error) throw error;

      setCurrentEventData({
        event_name: data.event_name + " (Cópia)",
        event_date: data.event_date,
        event_city: data.event_city,
        event_venue: data.event_venue,
        event_genre: data.event_genre,
        target_audience: data.target_audience,
        capacity: data.capacity,
        ticket_price: data.ticket_price,
        budget: data.budget,
        description: data.description,
      });
      setCurrentPlan(null);
      setCurrentPlanId(null);
      setViewMode("form");
      toast.info("Plano duplicado. Ajuste os dados e gere um novo plano.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao duplicar plano");
    }
  };

  const handleUpdatePlan = async (plan: MarketingPlan, eventData: any) => {
    if (!currentPlanId) return;

    try {
      const { error } = await supabase
        .from("marketing_plans")
        .update({
          event_name: eventData.event_name,
          event_date: eventData.event_date,
          event_city: eventData.event_city,
          event_venue: eventData.event_venue,
          marketing_plan: plan as any,
          general_strategy: plan.general_strategy as any,
          cluster_strategies: plan.cluster_strategies as any,
        })
        .eq("id", currentPlanId);

      if (error) throw error;

      setCurrentPlan(plan);
      setCurrentEventData(eventData);
      setViewMode("viewer");
      toast.success("Plano atualizado!");
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Assistente de Marketing</h1>
        <p className="text-muted-foreground">
          Gere planos de marketing personalizados com inteligência artificial
        </p>
      </div>

      {viewMode === "form" && (
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="new">Novo Plano</TabsTrigger>
            <TabsTrigger value="list">Meus Planos</TabsTrigger>
          </TabsList>
          <TabsContent value="new">
            <MarketingForm onSubmit={handleGeneratePlan} />
          </TabsContent>
          <TabsContent value="list">
            <PlansList
              onView={handleViewPlan}
              onEdit={handleEditPlan}
              onDuplicate={handleDuplicatePlan}
            />
          </TabsContent>
        </Tabs>
      )}

      {viewMode === "list" && (
        <PlansList
          onView={handleViewPlan}
          onEdit={handleEditPlan}
          onDuplicate={handleDuplicatePlan}
        />
      )}

      {viewMode === "generating" && <GeneratingLoader />}

      {viewMode === "viewer" && currentPlan && currentEventData && (
        <PlanViewer
          plan={currentPlan}
          eventName={currentEventData.event_name}
          onBack={() => setViewMode("form")}
          onSave={!currentPlanId ? handleSavePlan : undefined}
          onEdit={() => setViewMode("editor")}
          isSaved={!!currentPlanId}
        />
      )}

      {viewMode === "editor" && currentPlan && currentEventData && (
        <PlanEditor
          plan={currentPlan}
          eventData={currentEventData}
          onSave={handleUpdatePlan}
          onCancel={() => setViewMode("viewer")}
        />
      )}
    </div>
  );
}
