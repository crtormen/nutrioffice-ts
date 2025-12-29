import { useEffect, useState } from "react";

import { useFetchAllConsultasQuery } from "@/app/state/features/consultasSlice";
import { IConsulta } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

import { ConsultaData } from "../customerColumns";

const setTableData = (data: IConsulta[]): ConsultaData[] | undefined => {
  const consultaDataList: ConsultaData[] = data.map((record, i) => ({
    customerId: record.customer_id,
    name: record.name || "",
    id: record.id,
    date: record.date,
    index: data.length - i,
    peso: record.peso,
    online: record.online,
    createdAt: record.createdAt,
  }));

  return consultaDataList;
};

export const useFillConsultasTable = () => {
  const [consultas, setConsultas] = useState<ConsultaData[] | undefined>([]);
  const { dbUid } = useAuth();

  const { data, isLoading, isSuccess, isError, error } =
    useFetchAllConsultasQuery({ uid: dbUid });

  useEffect(() => {
    if (!data) {
      return;
    }
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
