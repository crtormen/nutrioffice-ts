import { useAuth } from "@/infra/firebase";
import { useParams } from "react-router-dom";
import {
  selectLastConsulta,
  useFetchConsultasQuery,
} from "@/app/state/features/consultasSlice";
import { IConsulta } from "@/domain/entities";
import { useAppSelector } from "@/app/state";

export function useSetLastConsulta(): IConsulta | undefined {
  const { id: customerId } = useParams();
  const { user } = useAuth();

  if (!user || !customerId) return undefined;

  const consulta = useAppSelector(selectLastConsulta(user.uid, customerId));

  return consulta;
}
