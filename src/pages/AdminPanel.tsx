import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Building2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FEATURE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  import: "Importar Dados",
  forecast: "Previsão",
  events: "Eventos",
  segments: "Segmentos",
  birthdays: "Aniversários",
  clustering: "Clustering",
  insights: "Insights",
  marketing: "Marketing",
  sponsors: "Patrocínios",
  orchestrator: "Orquestrador",
  settings: "Configurações",
  "zig-casas": "Zig Casas",
};

export default function AdminPanel() {
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ["all-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug, is_active")
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: features = [], isLoading: featuresLoading } = useQuery({
    queryKey: ["tenant-features-admin", selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) return [];

      const { data, error } = await supabase
        .from("tenant_features")
        .select("*")
        .eq("tenant_id", selectedTenantId)
        .order("feature_key");

      if (error) throw error;
      return data;
    },
    enabled: !!selectedTenantId && isAdmin,
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ featureId, enabled }: { featureId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("tenant_features")
        .update({ enabled })
        .eq("id", featureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-features-admin", selectedTenantId] });
      toast({
        title: "Feature atualizada",
        description: "As permissões foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (rolesLoading || tenantsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar features de tenants.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          <p className="text-muted-foreground">Gerencie features e permissões de todas as tenants</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Selecionar Tenant
          </CardTitle>
          <CardDescription>
            Escolha uma tenant para gerenciar suas features habilitadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma tenant..." />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  <div className="flex items-center gap-2">
                    <span>{tenant.name}</span>
                    <Badge variant={tenant.is_active ? "default" : "secondary"}>
                      {tenant.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTenantId && (
        <Card>
          <CardHeader>
            <CardTitle>Features Disponíveis</CardTitle>
            <CardDescription>
              Habilite ou desabilite features para esta tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {featuresLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {FEATURE_LABELS[feature.feature_key] || feature.feature_key}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.feature_key}
                      </p>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={(enabled) =>
                        updateFeatureMutation.mutate({ featureId: feature.id, enabled })
                      }
                      disabled={updateFeatureMutation.isPending}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
