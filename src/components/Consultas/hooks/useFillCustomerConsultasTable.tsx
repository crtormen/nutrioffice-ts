import { useEffect, useState } from "react";

import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { ICustomerConsulta } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

import { ConsultaData } from "../customerColumns";

const setTableData = (
  data: ICustomerConsulta[],
  customerId: string,
): ConsultaData[] | undefined => {
  if (!data) return undefined;

  return data.map((record, i) => ({
    id: record.id,
    customerId,
    name: "", // Name comes from customer, not consulta
    date: record.date,
    index: data.length - i,
    peso: record.peso?.toString(),
    online: record.online,
    createdAt: record.createdAt,
  }));
};

export const useFillCustomerConsultasTable = (customerId?: string) => {
  const [consultas, setConsultas] = useState<ConsultaData[] | undefined>([]);
  const { dbUid } = useAuth();

  const { data, isLoading, isSuccess, isError, error } =
    useFetchCustomerConsultasQuery({ uid: dbUid, customerId });

  useEffect(() => {
    if (!data || !customerId) {
      return;
    }
    const consultasData = setTableData(data, customerId);
    setConsultas(consultasData);
  }, [data, customerId]);

  if (error)
    return {
      consultas: [],
      data: [],
      isLoading: false,
      isSuccess: false,
      isError: true,
      error: "UID not provided",
    };

  return { consultas, data, isLoading, isSuccess, isError, error };
};
