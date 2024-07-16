import { useEffect, useState } from "react";

import { useFetchAllConsultasQuery } from "@/app/state/features/consultasSlice";
import { IConsulta } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

import { ConsultaData } from "../columns";

const setTableData = (
  data: IConsulta[] | undefined,
): ConsultaData[] | undefined => {
  if (!data) return undefined;

  return data.map((record, i) => ({
    customerId: record.customer_id,
    name: record.name,
    id: record.id,
    date: record.date,
    index: data.length - i,
  }));
};

export const useFillConsultasTable = () => {
  const [consultas, setConsultas] = useState<ConsultaData[] | undefined>([]);
  const auth = useAuth();
  const uid = auth.user?.uid;

  const { data, isLoading, isSuccess, isError, error } =
    useFetchAllConsultasQuery({ uid });

  useEffect(() => {
    const consultasData = setTableData(data);
    setConsultas(consultasData);
  }, [data]);

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
