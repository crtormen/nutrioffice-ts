import { useParams } from "react-router-dom";

import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { useAuth } from "@/infra/firebase";

export const useSetCustomerConsultas = () => {
  const params = useParams();
  const customerId = params.customerId || params.id;
  const { dbUid } = useAuth();

  if (!dbUid || !customerId) return undefined;

  const { data: consultas } = useFetchCustomerConsultasQuery({
    uid: dbUid,
    customerId,
  });

  if (!consultas) return undefined;

  return consultas;
};
