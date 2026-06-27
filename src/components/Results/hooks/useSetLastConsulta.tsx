import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { useAppSelector } from "@/app/state";
import {
  selectLastConsulta,
  useFetchCustomerConsultasQuery,
} from "@/app/state/features/customerConsultasSlice";
import { ICustomerConsulta } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

export function useSetLastConsulta(): ICustomerConsulta | undefined {
  const { id: customerId } = useParams();
  const { user } = useAuth();

  const selector = useMemo(
    () => selectLastConsulta(user?.uid ?? "", customerId ?? ""),
    [user?.uid, customerId],
  );
  const consulta = useAppSelector(selector);

  if (!user || !customerId) return undefined;
  return consulta;
}
