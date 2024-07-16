import { useParams } from "react-router-dom";

import { useFetchConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { useAuth } from "@/infra/firebase";

export const useSetCustomerConsultas = () => {
  const { id: customerId } = useParams();
  const { user } = useAuth();

  if (!user || !customerId) return undefined;

  const { data: consultas } = useFetchConsultasQuery({
    uid: user.uid,
    customerId,
  });

  if (!consultas) return undefined;

  return consultas;
};
