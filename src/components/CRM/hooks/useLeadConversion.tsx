import { useState } from "react";

import { useAuth } from "@/infra/firebase";

export function useLeadConversion() {
  const { dbUid, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function convertLead(leadId: string): Promise<{ success: boolean; customerId?: string }> {
    if (!dbUid || !user) return { success: false };
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // 400 = already converted — still a success for navigation purposes
        if (response.status === 400 && data.customerId) {
          return { success: true, customerId: data.customerId };
        }
        throw new Error(data.error ?? "Erro ao converter lead");
      }

      return { success: true, customerId: data.customerId };
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { convertLead, isLoading, error };
}
