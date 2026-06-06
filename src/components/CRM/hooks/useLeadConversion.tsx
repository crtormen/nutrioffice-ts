import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useAuth } from "@/infra/firebase";

export function useLeadConversion() {
  const { dbUid, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function convertLead(leadId: string): Promise<boolean> {
    if (!dbUid || !user) return false;
    setIsLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken(true);
      const response = await fetch(
        `/api/users/${dbUid}/leads/${leadId}/convert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao converter lead");
      }

      const { customerId } = await response.json();
      navigate(ROUTES.CUSTOMERS.DETAILS(customerId));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return { convertLead, isLoading, error };
}
