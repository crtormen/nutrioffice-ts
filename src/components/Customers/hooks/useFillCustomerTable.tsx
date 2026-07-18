import { useEffect, useState } from "react";

import { useFetchCustomersQuery } from "@/app/state/features/customersSlice";
import { useAuth } from "@/infra/firebase";

import { CustomerData } from "../columns";

export const useFillCustomerTable = (showInactive = false) => {
  const [customers, setCustomers] = useState<CustomerData[] | undefined>([]);
  const { dbUid } = useAuth();

  const result = useFetchCustomersQuery(dbUid);

  useEffect(() => {
    const setTableData = (): CustomerData[] | undefined => {
      if (!result.data) return undefined;

      return result.data
        .filter((record) => showInactive || record.isActive !== false)
        .map((record) => ({
          id: record.id,
          name: record.name,
          email: record.email,
          phone: record.phone,
          cpf: record.cpf,
          credits: record.credits,
          isActive: record.isActive,
        }));
    };
    const customersData = setTableData();
    setCustomers(customersData);
  }, [result.data, showInactive]);

  return { customers, result };
};
