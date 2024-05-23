import { IResults } from "@/domain/entities";
import { useSetCustomerConsultas } from "./useSetCustomerConsultas";
import { compareAsc, format, parse } from "date-fns";

export type paramType = "fat" | "mm" | "mg" | "weight";

export type chartDataType = {
  date: string;
  [key: string]: string | number | undefined;
};

export function useSetChartData(
  param: string,
  createdAt?: string
): chartDataType[] | undefined {
  let consultas = useSetCustomerConsultas();
  if (!consultas) return undefined;

  if (createdAt) {
    consultas = consultas.filter(
      (consulta) =>
        compareAsc(
          parse(consulta.date!, "dd/MM/yyyy", new Date()),
          parse(createdAt, "dd/MM/yyyy", new Date())
        ) >= 0
    );
  }

  let chartData = consultas
    .map((consulta) => ({
      date: format(parse(consulta.date!, "dd/MM/yyyy", new Date()), "dd/MM/yy"),
      [param]:
        param === "weight"
          ? consulta.peso
          : consulta.results
          ? consulta.results[param as keyof IResults]
          : "",
    }))
    .reverse();

  return chartData;
}
