import { useEffect, useState } from "react";

import { useFetchCustomerFinancesQuery } from "@/app/state/features/customerFinancesSlice";
import { IFinance } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

import { FinanceData } from "../columns";

const setTableData = (
  data: IFinance[] | undefined,
): FinanceData[] | undefined => {
  if (!data) return [];

  return data.map((record) => ({
    id: record.id!,
    createdAt: record.createdAt || "",
    services: record.items?.map((item) => item.serviceName).join(", ") || "",
    customerId: record.customerId,
    total: record.total,
    pago: record.pago,
    saldo: record.saldo,
    status: record.status,
  }));
};

export const useFillCustomerFinancesTable = (customerId: string) => {
  const [finances, setFinances] = useState<FinanceData[] | undefined>([]);
  const auth = useAuth();
  const uid = auth.dbUid;

  const { data, isLoading, isFetching, isSuccess, isError, error } =
    useFetchCustomerFinancesQuery(
      {
        uid: uid || "",
        customerId,
      },
      {
        skip: !uid, // Skip query if uid is not available
      },
    );

  useEffect(() => {
    if (!uid) return;
    const financesData = setTableData(data);
    setFinances(financesData);
  }, [data, uid]);

  if (!uid) {
    return {
      finances: [],
      data: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: true,
      error: "UID not provided",
    };
  }

  return { finances, data, isLoading, isFetching, isSuccess, isError, error };
};
