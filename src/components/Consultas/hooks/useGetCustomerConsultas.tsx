import { useAppSelector } from "@/app/state";
import {
  selectConsultaById,
  useFetchCustomerConsultasQuery,
} from "@/app/state/features/customerConsultasSlice";
import type { ICustomerConsulta } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

export const useGetCustomerConsultaData = (
  customerId: string | undefined,
  consultaId: string | undefined,
) => {
  const { dbUid } = useAuth();

  useFetchCustomerConsultasQuery({ uid: dbUid, customerId });
  const selector = selectConsultaById(dbUid, customerId, consultaId);
  const consultaData: ICustomerConsulta | undefined = useAppSelector(selector);

  return consultaData;
};
