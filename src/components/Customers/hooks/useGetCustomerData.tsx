import { useMemo } from "react";

import { useAppSelector } from "@/app/state";
import {
  selectCustomerById,
  useFetchCustomersQuery,
} from "@/app/state/features/customersSlice";
import { ICustomer } from "@/domain/entities/customer";
import { useAuth } from "@/infra/firebase";

export const useGetCustomerData = (customerId: string | undefined) => {
  const { dbUid } = useAuth();

  useFetchCustomersQuery(dbUid || "", {
    skip: !dbUid,
  });
  const selector = useMemo(() => selectCustomerById(dbUid, customerId), [dbUid, customerId]);
  const customerData: ICustomer | undefined = useAppSelector(selector);

  return customerData;
};
