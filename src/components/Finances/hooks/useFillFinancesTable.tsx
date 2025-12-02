import { useMemo } from "react";
import { FinanceTableData } from "../financesColumns";
import { useAuth } from "@/infra/firebase";
import { useFetchAllFinancesQuery } from "@/app/state/features/financesSlice";
import { IFinance } from "@/domain/entities";
import { filterFinances } from "../financeFilter";
import { DateRange } from "@/components/Consultas/DateRangePicker";

const transformToTableData = (
  data: IFinance[] | undefined
): FinanceTableData[] => {
  if (!data) return [];

  return data.map((record) => ({
    id: record.id!,
    createdAt: record.createdAt || "",
    customerName: (record as any).name || "Cliente não identificado",
    services: record.items?.map((item) => item.serviceName).join(", ") || "",
    total: record.total || 0,
    pago: record.pago || 0,
    saldo: record.saldo || 0,
    status: record.status,
  }));
};

export const useFillFinancesTable = (
  searchTerm: string = "",
  statusFilter: "all" | "pending" | "partial" | "paid" = "all",
  dateRange?: DateRange
) => {
  const auth = useAuth();
  const uid = auth.dbUid;

  const { data, isLoading, isSuccess, isError, error } = useFetchAllFinancesQuery(
    { uid: uid || "" },
    { skip: !uid }
  );

  // Filter the raw data first
  const filteredData = useMemo(() => {
    if (!data) return [];
    return filterFinances(data, searchTerm, statusFilter, dateRange);
  }, [data, searchTerm, statusFilter, dateRange]);

  // Transform filtered data to table format
  const tableData = useMemo(() => {
    return transformToTableData(filteredData);
  }, [filteredData]);

  return {
    tableData,
    isLoading,
    isSuccess,
    isError,
    error: !uid ? "UID not provided" : error,
  };
};
