import { createSelector } from "@reduxjs/toolkit";
import { parse } from "date-fns";
import { Timestamp } from "firebase/firestore";

import { ConsultasService } from "@/app/services/ConsultasService";
import { IConsulta, IConsultaFirebase } from "@/domain/entities";

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
      fetchAllConsultas: builder.query<IConsulta[], args>({
        providesTags: ["Consultas"],
        keepUnusedDataFor: 3600,
        queryFn: async ({ uid }) => {
          if (!uid) return { error: "Args not provided" };

          try {
            const querySnapshot = await ConsultasService(uid)?.getAllOnce();
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
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
      addConsulta: builder.mutation<
        IConsulta,
        { uid: string | undefined; newConsulta: IConsulta }
      >({
        queryFn: async ({ uid, newConsulta }) => {
          if (!uid || !newConsulta.id)
            return { error: new Error("No ID defined") };
          // eslint-disable-next-line camelcase
          const {
            // eslint-disable-next-line camelcase
            customer_id,
            createdAt,
            online,
            date,
            gender,
            idade,
            name,
            peso,
            results,
          } = newConsulta;

          const consulta: IConsultaFirebase = {
            // eslint-disable-next-line camelcase
            customer_id,
            date: date
              ? Timestamp.fromDate(parse(date, "dd/MM/yyyy", new Date()))
              : undefined,
            createdAt: createdAt
              ? Timestamp.fromDate(parse(createdAt, "dd/MM/yyyy", new Date()))
              : undefined,
            gender,
            online,
            idade,
            name,
            peso: Number(peso),
            results,
          };

          try {
            await ConsultasService(uid)?.setOne(newConsulta.id, consulta);
            return { data: newConsulta };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const selectLastConsulta = (uid: string, customerId: string) =>
  createSelector(
    consultasSlice.endpoints.fetchAllConsultas.select({ uid, customerId }),
    ({ data: consultas }) => (consultas ? consultas[0] : undefined),
  );

export const { useFetchAllConsultasQuery, useAddConsultaMutation } =
  consultasSlice;
