import { useAuth } from "@/infra/firebase";
import { useParams } from "react-router-dom";
import { useFetchConsultasQuery } from "@/app/state/features/consultasSlice";

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
