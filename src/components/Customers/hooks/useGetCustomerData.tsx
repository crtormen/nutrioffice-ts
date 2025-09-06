import { useAppSelector } from "@/app/state";
import {
  selectCustomerById,
  useFetchCustomersQuery,
} from "@/app/state/features/customersSlice";
import { ICustomer } from "@/domain/entities/customer";
import { useAuth } from "@/infra/firebase";

export const useGetCustomerData = (customerId: string | undefined) => {
  const { dbUid } = useAuth();

  useFetchCustomersQuery(dbUid);
  const selector = selectCustomerById(dbUid, customerId);
  const customerData: ICustomer | undefined = useAppSelector(selector);

  return customerData;
};
