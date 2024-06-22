import { createSelector } from "@reduxjs/toolkit";

import { ConsultasService } from "@/app/services/ConsultasService";
import { IConsulta } from "@/domain/entities";

import { firestoreApi } from "../firestoreApi";

type args = {
  uid?: string;
  customerId?: string;
};

export const consultasSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["Consultas"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchConsultas: builder.query<IConsulta[], args>({
        providesTags: ["Consultas"],
        keepUnusedDataFor: 3600,
        queryFn: async ({ uid, customerId }) => {
          if (!uid || !customerId) return { error: "Args not provided" };

          try {
            const querySnapshot = await ConsultasService(
              uid,
              customerId,
            )?.getAllOnce();
            const consultas: IConsulta[] = [];

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

export const { useFetchConsultasQuery } = consultasSlice;

export const selectLastConsulta = (uid: string, customerId: string) =>
  createSelector(
    consultasSlice.endpoints.fetchConsultas.select({ uid, customerId }),
    ({ data: consultas }) => (consultas ? consultas[0] : undefined),
  );
