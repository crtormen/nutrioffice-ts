import { createSelector } from "@reduxjs/toolkit";

import { FinancesService } from "@/app/services/FinancesService";
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

export const financesSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Finances", "Customers"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchFinances: builder.query<IFinance[], QueryArgs>({
        providesTags: ["Finances"],
        keepUnusedDataFor: 3600,
        queryFn: async ({ uid, customerId }) => {
          if (!uid || !customerId) return { error: "Args not provided" };

          try {
            const querySnapshot = await FinancesService(
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
      addFinance: builder.mutation<void, AddFinanceArgs>({
        invalidatesTags: ["Finances", "Customers"],
        queryFn: async ({ uid, customerId, finance }) => {
          try {
            // Add finance record (converter will handle the transformation)
            await FinancesService(uid, customerId)?.addOne(finance as any);

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

export const { useFetchFinancesQuery, useAddFinanceMutation } = financesSlice;

export const selectFinances = (uid: string, customerId: string) =>
  createSelector(
    financesSlice.endpoints.fetchFinances.select({ uid, customerId }),
    ({ data: finances }) => (finances ? finances[0] : undefined),
  );
