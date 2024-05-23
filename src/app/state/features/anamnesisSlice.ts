import { IAnamnesis } from "@/domain/entities";
import { firestoreApi } from "../firestoreApi";
import { AnamnesisService } from "@/app/services/AnamnesisService";
import { createSelector } from "@reduxjs/toolkit";

type args = {
  uid: string;
  customerId: string;
};

export const anamnesisSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Anamnesis"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchAnamnesis: builder.query<IAnamnesis[], args>({
        providesTags: ["Anamnesis"],
        keepUnusedDataFor: 3600,
        queryFn: async ({ uid, customerId }) => {
          if (!uid || !customerId) return { error: "Args not provided" };

          try {
            const querySnapshot = await AnamnesisService(
              uid,
              customerId
            )?.getAllOnce();
            let anamnesis: IAnamnesis[] = [];

            querySnapshot?.forEach((doc) => {
              anamnesis.push(doc.data());
            });

            return {
              data: anamnesis,
            };
          } catch (err) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const { useFetchAnamnesisQuery } = anamnesisSlice;

export const selectAnamnesis = (uid: string, customerId: string) =>
  createSelector(
    anamnesisSlice.endpoints.fetchAnamnesis.select({ uid, customerId }),
    ({ data: anamnesis }) => (anamnesis ? anamnesis[0] : undefined)
  );
