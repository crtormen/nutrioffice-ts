import { useEffect, useState } from "react";

import { useFetchCustomersQuery } from "@/app/state/features/customersSlice";
import { useAuth } from "@/infra/firebase";

import { CustomerData } from "../columns";

export const useFillCustomerTable = () => {
  const [customers, setCustomers] = useState<CustomerData[] | undefined>([]);
  const { dbUid } = useAuth();

  const result = useFetchCustomersQuery(dbUid);

  useEffect(() => {
    const setTableData = (): CustomerData[] | undefined => {
      if (!result.data) return undefined;

      return result.data.map((record) => ({
        id: record.id,
        name: record.name,
        email: record.email,
        credits: record.credits,
      }));
    };
    const customersData = setTableData();
    setCustomers(customersData);
  }, [result.data]);

  return { customers, result };
};
