import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUserRoles() {
  const { user, tenant } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles", user?.id, tenant?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.id) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("tenant_id", tenant.id);

      if (error) throw error;
      return data.map((r) => r.role);
    },
    enabled: !!user?.id && !!tenant?.id,
  });

  const isAdmin = roles.includes("admin");
  const isOwner = roles.includes("owner");

  return {
    roles,
    isAdmin,
    isOwner,
    isLoading,
  };
}
