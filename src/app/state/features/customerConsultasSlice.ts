import { createSelector } from "@reduxjs/toolkit";

import { CustomerConsultasService } from "@/app/services/CustomerConsultasService";
import { ICustomerConsulta } from "@/domain/entities";

import { firestoreApi } from "../firestoreApi";

type args = {
  uid?: string;
  customerId?: string;
};

export const customerConsultasSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Consultas"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchConsultas: builder.query<ICustomerConsulta[], args>({
        providesTags: ["Consultas"],
        keepUnusedDataFor: 3600,
        queryFn: async ({ uid, customerId }) => {
          if (!uid || !customerId) return { error: "Args not provided" };

          try {
            const querySnapshot = await CustomerConsultasService(
              uid,
              customerId,
            )?.getAllOnce();
            const consultas: ICustomerConsulta[] = [];

            querySnapshot?.forEach((doc) => {
              consultas.push({
                id: doc.id,
                ...doc.data(),
              });
            });

            return {
              data: consultas,
            };
          } catch (err) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const { useFetchConsultasQuery } = customerConsultasSlice;

export const selectLastConsulta = (uid: string, customerId: string) =>
  createSelector(
    customerConsultasSlice.endpoints.fetchConsultas.select({
      uid,
      customerId,
    }),
    ({ data: consultas }) => (consultas ? consultas[0] : undefined),
  );
