import { useAuth } from "@/contexts/AuthContext";

export function useTenant() {
  const { tenant, profile } = useAuth();

  return {
    tenant,
    tenantId: tenant?.id,
    profile,
  };
}
