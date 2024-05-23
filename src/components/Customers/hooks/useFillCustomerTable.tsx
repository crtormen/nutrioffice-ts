import { useEffect, useState } from "react";
import { CustomerData } from "../columns";
import { useAuth } from "@/infra/firebase";
import { useFetchCustomersQuery } from "@/app/state/features/customersSlice";

export const useFillCustomerTable = () => {
  const [customers, setCustomers] = useState<CustomerData[] | undefined>([]);
  const auth = useAuth();
  const uid = auth.user?.uid;

  const result = useFetchCustomersQuery(uid);

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
