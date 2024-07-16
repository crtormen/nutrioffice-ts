import { useParams } from "react-router-dom";

import { useAppSelector } from "@/app/state";
import {
  selectLastConsulta,
  useFetchConsultasQuery,
} from "@/app/state/features/customerConsultasSlice";
import { IConsulta } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

export function useSetLastConsulta(): IConsulta | undefined {
  const { id: customerId } = useParams();
  const { user } = useAuth();

  if (!user || !customerId) return undefined;

  const consulta = useAppSelector(selectLastConsulta(user.uid, customerId));

  return consulta;
}
