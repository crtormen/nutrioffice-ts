import { createSelector } from "@reduxjs/toolkit";

import { FinancesService } from "@/app/services/FinancesService";
import { IFinance } from "@/domain/entities";

import { firestoreApi } from "../firestoreApi";

type QueryArgs = {
  uid: string;
};

export const financesSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Finances"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchAllFinances: builder.query<IFinance[], QueryArgs>({
        providesTags: ["Finances"],
        keepUnusedDataFor: 3600,
        queryFn: async ({ uid }) => {
          if (!uid) return { error: "Args not provided" };

          try {
            const querySnapshot = await FinancesService(uid)?.getAllOnce();
            const finances: IFinance[] = [];

            querySnapshot?.forEach((doc) => {
              finances.push({
                ...doc.data() as IFinance,
                id: doc.id,
              });
            });

            return {
              data: finances,
            };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const {
  useFetchAllFinancesQuery,
} = financesSlice;

export const selectLastFinance = (uid: string) =>
  createSelector(
    financesSlice.endpoints.fetchAllFinances.select({ uid }),
    ({ data: finances }) => (finances ? finances[0] : undefined),
  );
