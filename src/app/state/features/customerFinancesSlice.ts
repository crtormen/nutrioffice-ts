import { createSelector } from "@reduxjs/toolkit";

import { CustomerFinancesService } from "@/app/services/CustomerFinancesService";
import { CustomersService } from "@/app/services/CustomersService";
import { IFinance } from "@/domain/entities";

import { firestoreApi } from "../firestoreApi";

type QueryArgs = {
  uid: string;
  customerId: string;
};

type AddFinanceArgs = {
  uid: string;
  customerId: string;
  finance: Omit<IFinance, "id">;
};

export const customerFinancesSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["CustomerFinances", "Customers"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchCustomerFinances: builder.query<IFinance[], QueryArgs>({
        providesTags: ["CustomerFinances"],
        keepUnusedDataFor: 3600,
        queryFn: async ({ uid, customerId }) => {
          if (!uid || !customerId) return { error: "Args not provided" };

          try {
            const querySnapshot = await CustomerFinancesService(
              uid,
              customerId,
            )?.getAllOnce();
            const finances: IFinance[] = [];

            querySnapshot?.forEach((doc) => {
              finances.push(doc.data() as IFinance);
            });

            return {
              data: finances,
            };
          } catch (err) {
            return { error: err };
          }
        },
      }),
      addCustomerFinance: builder.mutation<void, AddFinanceArgs>({
        invalidatesTags: ["CustomerFinances", "Customers", "Finances"],
        queryFn: async ({ uid, customerId, finance }) => {
          try {
            // Add finance record (converter will handle the transformation)
            await CustomerFinancesService(uid, customerId)?.addOne(finance as any);

            // Update customer credits if credits were granted
            if (finance.creditsGranted > 0) {
              const customerDoc = await CustomersService(uid)?.getOne(customerId);
              const currentCredits = customerDoc?.credits || 0;
              await CustomersService(uid)?.updateOne(customerId, {
                credits: currentCredits + finance.creditsGranted,
              });
            }

            return { data: undefined };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const {
  useFetchCustomerFinancesQuery,
  useAddCustomerFinanceMutation,
} = customerFinancesSlice;

export const selectCustomerFinances = (uid: string, customerId: string) =>
  createSelector(
    customerFinancesSlice.endpoints.fetchCustomerFinances.select({ uid, customerId }),
    ({ data: finances }) => (finances ? finances[0] : undefined),
  );
