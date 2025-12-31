import { useParams } from "react-router-dom";

import { useFetchGoalsQuery } from "@/app/state/features/goalsSlice";
import { useAuth } from "@/infra/firebase";

export const useSetCustomerGoals = () => {
  const { id: customerId } = useParams();
  const { user } = useAuth();

  if (!user || !customerId) return undefined;

  const { data: goals } = useFetchGoalsQuery({
    uid: user.uid,
    customerId,
  });

  if (!goals) return undefined;

  return goals;
};
