import { useAuth } from "@/infra/firebase";
import {
  selectCustomerById,
  useFetchCustomersQuery,
} from "@/app/state/features/customersSlice";
import { useAppSelector } from "@/app/state";
import { ICustomer } from "@/domain/entities/customer";

export const useGetCustomerData = (customerId: string) => {
  const auth = useAuth();
  const uid = auth.user?.uid;

  const result = useFetchCustomersQuery(uid);
  const selector = selectCustomerById(uid, customerId);
  const customerData: ICustomer | undefined = useAppSelector(selector);

  return customerData;
};
