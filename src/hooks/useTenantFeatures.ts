import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";

export function useTenantFeatures() {
  const { tenantId } = useTenant();

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["tenant-features", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from("tenant_features")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const isFeatureEnabled = (featureKey: string) => {
    const feature = features.find((f) => f.feature_key === featureKey);
    return feature?.enabled ?? false;
  };

  return {
    features,
    isFeatureEnabled,
    isLoading,
  };
}
