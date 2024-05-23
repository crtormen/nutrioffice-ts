import { useEffect, useState } from "react";
import { FinanceData } from "../columns";
import { useAuth } from "@/infra/firebase";
import { useFetchFinancesQuery } from "@/app/state/features/financesSlice";
import { IFinance } from "@/domain/entities";

const setTableData = (
  data: IFinance[] | undefined
): FinanceData[] | undefined => {
  if (!data) return undefined;

  return data.map((record) => ({
    id: record.id,
    createdAt: record.createdAt,
    pacotes: record.pacotes,
    pago: record.pago,
  }));
};

export const useFillCustomerFinancesTable = (customerId: string) => {
  const [finances, setFinances] = useState<FinanceData[] | undefined>([]);
  const auth = useAuth();
  const uid = auth.user?.uid;
  if (!uid)
    return {
      finances: [],
      data: [],
      isLoading: false,
      isSuccess: false,
      isError: true,
      error: "UID not provided",
    };

  const { data, isLoading, isSuccess, isError, error } = useFetchFinancesQuery({
    uid,
    customerId,
  });

  useEffect(() => {
    const financesData = setTableData(data);
    setFinances(financesData);
  }, [data]);

  return { finances, data, isLoading, isSuccess, isError, error };
};
