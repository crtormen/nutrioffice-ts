import { compareAsc, format, parse, parseISO, isAfter } from "date-fns";

import { IResults } from "@/domain/entities";

import { useSetCustomerConsultas } from "./useSetCustomerConsultas";

export type paramType = "fat" | "mm" | "mg" | "weight";

export type chartDataType = {
  date: string;
  [key: string]: string | number | undefined;
};

export function useSetChartData(
  param: string,
  createdAt?: string,
): chartDataType[] | undefined {
  let consultas = useSetCustomerConsultas();
  if (!consultas) return undefined;

  if (createdAt) {
    const goalStartDate = parse(createdAt, "dd/MM/yyyy", new Date());
    consultas = consultas.filter((consulta) => {
      if (!consulta.date) return false;
      const consultaDate = parseISO(consulta.date);
      return (
        isAfter(consultaDate, goalStartDate) ||
        consultaDate.getTime() === goalStartDate.getTime()
      );
    });
  }

  const chartData = consultas
    .map((consulta) => {
      // Try to parse date - handle both ISO and dd/MM/yyyy formats
      let dateFormatted: string;
      try {
        // First try ISO format
        dateFormatted = format(parseISO(consulta.date!), "dd/MM/yy");
      } catch {
        // If ISO fails, try dd/MM/yyyy format
        try {
          dateFormatted = format(parse(consulta.date!, "dd/MM/yyyy", new Date()), "dd/MM/yy");
        } catch {
          // If both fail, use the date as-is
          dateFormatted = consulta.date!;
        }
      }

      return {
        date: dateFormatted,
        [param]:
          param === "weight"
            ? consulta.peso
            : consulta.results
              ? consulta.results[param as keyof IResults]
              : "",
      };
    })
    .reverse();

  return chartData;
}
