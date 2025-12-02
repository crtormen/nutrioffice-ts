import { createSelector } from "@reduxjs/toolkit";

import { AnamnesisService } from "@/app/services/AnamnesisService";
import { IAnamnesis } from "@/domain/entities";

import { firestoreApi } from "../firestoreApi";

type queryArgs = {
  uid?: string;
  customerId?: string;
};

type mutationArgs = {
  uid?: string;
  customerId?: string;
  newAnamnesis?: IAnamnesis;
};

type updateArgs = {
  uid?: string;
  customerId?: string;
  anamnesisId?: string;
  updatedAnamnesis?: Partial<IAnamnesis>;
};

type deleteArgs = {
  uid?: string;
  customerId?: string;
  anamnesisId?: string;
};

export const anamnesisSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Anamnesis"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchAnamnesis: builder.query<IAnamnesis[], queryArgs>({
        providesTags: ["Anamnesis"],
        keepUnusedDataFor: 3600,
        queryFn: async ({ uid, customerId }) => {
          if (!uid || !customerId) return { error: "Args not provided" };

          try {
            const querySnapshot = await AnamnesisService(
              uid,
              customerId,
            )?.getAllOnce();
            const anamnesis: IAnamnesis[] = [];

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
      addAnamnesis: builder.mutation<IAnamnesis, mutationArgs>({
        invalidatesTags: ["Anamnesis"],
        queryFn: async ({ uid, customerId, newAnamnesis }) => {
          if (!uid || !customerId || !newAnamnesis)
            return { error: "Args not provided" };

          try {
            await AnamnesisService(uid, customerId)?.addOne(newAnamnesis);
            return { data: newAnamnesis };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
      updateAnamnesis: builder.mutation<void, updateArgs>({
        invalidatesTags: ["Anamnesis"],
        queryFn: async ({ uid, customerId, anamnesisId, updatedAnamnesis }) => {
          if (!uid || !customerId || !anamnesisId || !updatedAnamnesis)
            return { error: "Args not provided" };

          try {
            await AnamnesisService(uid, customerId)?.updateOne(
              anamnesisId,
              updatedAnamnesis,
            );
            return { data: undefined };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
      deleteAnamnesis: builder.mutation<void, deleteArgs>({
        invalidatesTags: ["Anamnesis"],
        queryFn: async ({ uid, customerId, anamnesisId }) => {
          if (!uid || !customerId || !anamnesisId)
            return { error: "Args not provided" };

          try {
            await AnamnesisService(uid, customerId)?.deleteOne(anamnesisId);
            return { data: undefined };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const {
  useFetchAnamnesisQuery,
  useAddAnamnesisMutation,
  useUpdateAnamnesisMutation,
  useDeleteAnamnesisMutation,
} = anamnesisSlice;

export const selectAnamnesis = (uid?: string, customerId?: string) =>
  createSelector(
    anamnesisSlice.endpoints.fetchAnamnesis.select({ uid, customerId }),
    ({ data: anamnesis }) => (anamnesis ? anamnesis[0] : undefined),
  );
