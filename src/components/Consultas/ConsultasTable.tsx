import { Loader2 } from "lucide-react";
import { useState } from "react";
import { parse, isWithinInterval, isValid } from "date-fns";

import { useFillConsultasTable } from "@/components/Consultas/hooks";
import { DataTable } from "@/components/ui/data-table";

import { columns } from "./customerColumns";
import { ConsultaSearchInput } from "./ConsultaSearchInput";
import { consultaFuzzyFilter } from "./consultaFilter";
import { DateRangePicker, DateRange } from "./DateRangePicker";

export const ConsultasTable = () => {
  const { consultas, isLoading } = useFillConsultasTable();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Filter consultas by date range
  const filteredConsultas = consultas?.filter((consulta) => {
    if (!dateRange.from && !dateRange.to) return true;
    if (!consulta.date) return false;

    // Parse the date string (format: dd/MM/yyyy)
    const consultaDate = parse(consulta.date, "dd/MM/yyyy", new Date());
    if (!isValid(consultaDate)) return false;

    if (dateRange.from && dateRange.to) {
      return isWithinInterval(consultaDate, {
        start: dateRange.from,
        end: dateRange.to,
      });
    } else if (dateRange.from) {
      return consultaDate >= dateRange.from;
    } else if (dateRange.to) {
      return consultaDate <= dateRange.to;
    }

    return true;
  });

  return isLoading ? (
    <Loader2 className="mx-auto size-8 animate-spin items-center text-zinc-500" />
  ) : consultas && consultas?.length > 0 ? (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>
      <DataTable
        columns={columns}
        data={filteredConsultas || []}
        customSearchComponent={
          <ConsultaSearchInput value="" onChange={() => {}} />
        }
        globalFilterFn={consultaFuzzyFilter}
      />
    </div>
  ) : (
    <div className="space-y-4">
      <div>
        <h4 className="text-md space-y-2 py-4 font-medium">
          Nenhuma consulta cadastrada.
        </h4>
      </div>
    </div>
  );
};
