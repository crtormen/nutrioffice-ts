import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DataTable } from "@/components/ui/data-table";
import { FinanceSearchInput } from "./FinanceSearchInput";
import { DateRangePicker, DateRange } from "@/components/Consultas/DateRangePicker";
import { financesColumns } from "./financesColumns";
import { useFillFinancesTable } from "./hooks/useFillFinancesTable";

export const FinancesTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "partial" | "paid">("all");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  // Hook now handles filtering and transformation internally
  const { tableData, isLoading } = useFillFinancesTable(searchTerm, statusFilter, dateRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando vendas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FinanceSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por cliente ou serviço..."
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={financesColumns} data={tableData} />
    </div>
  );
};
