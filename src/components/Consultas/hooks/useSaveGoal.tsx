import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { useAddGoalMutation } from "@/app/state/features/goalsSlice";
import type { IGoal } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

export const useSaveGoal = () => {
  const { customerId } = useParams();
  const { dbUid } = useAuth();
  const [addGoal, { isLoading: isSaving }] = useAddGoalMutation();

  const handleSaveGoal = useCallback(
    async (goal: IGoal) => {
      try {
        const response = await addGoal({
          uid: dbUid,
          customerId,
          newGoal: goal,
        }).unwrap();

        return response.id;
      } catch (err: unknown) {
        throw new Error(err as string);
      }
    },
    [addGoal, customerId, dbUid],
  );

  return { handleSaveGoal, isSaving };
};
