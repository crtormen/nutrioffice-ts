import { compareAsc, format, parse } from "date-fns";

import { IResults } from "@/domain/entities";
import { ConsultaType } from "@/lib/utils/consultaFilters";

import { useSetCustomerConsultas } from "./useSetCustomerConsultas";

export type chartDataType = {
  date: string;
  [key: string]: string | number | undefined;
};

/**
 * Hook to get chart data filtered by consulta type (online, in-person, or all)
 * Extension of useSetChartData with filtering capabilities
 */
export function useFilteredChartData(
  param: string,
  consultaType: ConsultaType | "all" = "all",
  createdAt?: string,
): chartDataType[] | undefined {
  let consultas = useSetCustomerConsultas();
  if (!consultas) return undefined;

  // Filter by consulta type
  if (consultaType !== "all" && consultaType !== "hybrid") {
    consultas = consultas.filter((consulta) =>
      consultaType === "online" ? consulta.online === true : !consulta.online,
    );
  }

  // Filter by creation date if provided (for goals)
  if (createdAt) {
    consultas = consultas.filter(
      (consulta) =>
        compareAsc(
          parse(consulta.date!, "dd/MM/yyyy", new Date()),
          parse(createdAt, "dd/MM/yyyy", new Date()),
        ) >= 0,
    );
  }

  const chartData = consultas
    .map((consulta) => ({
      date: format(parse(consulta.date!, "dd/MM/yyyy", new Date()), "dd/MM/yy"),
      [param]:
        param === "weight" || param === "peso"
          ? consulta.peso
          : consulta.results
            ? consulta.results[param as keyof IResults]
            : "",
    }))
    .reverse();

  return chartData;
}
