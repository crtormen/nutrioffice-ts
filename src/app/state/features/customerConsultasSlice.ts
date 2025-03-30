import { createSelector } from "@reduxjs/toolkit";
import { parse } from "date-fns";
import {
  DocumentData,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";

import { CustomerConsultasService } from "@/app/services/CustomerConsultasService";
import {
  ICustomerConsulta,
  ICustomerConsultaFirebase,
  type IFolds,
  type IImages,
  type IMeasures,
  type IResults,
  type IStructure,
} from "@/domain/entities";
import { dateInString } from "@/lib/utils";

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
      updateCustomerConsulta: builder.mutation<
        ICustomerConsulta,
        {
          uid: string;
          customerId: string | undefined;
          consulta: ICustomerConsulta;
        }
      >({
        queryFn: async ({ uid, customerId, consulta }) => {
          if (!uid || !customerId || !consulta.id)
            return { error: "Args not provided" };

          const {
            id,
            createdAt,
            date,
            // eslint-disable-next-line camelcase
            pending,
            online,
            updateCredits,
            howmuch,
            obs,
            peso,
            idade,
            anexos,
            images,
            dobras,
            medidas,
            results,
            meals,
            structure,
          } = consulta;

          const updatedConsulta: ICustomerConsultaFirebase = {
            // eslint-disable-next-line camelcase
            date: date
              ? Timestamp.fromDate(parse(date, "dd/MM/yyyy", new Date()))
              : undefined,
            createdAt: createdAt
              ? Timestamp.fromDate(parse(createdAt, "dd/MM/yyyy", new Date()))
              : undefined,
            pending,
            online,
            updateCredits,
            howmuch,
            obs,
            peso: Number(peso),
            idade,
            anexos,
            images,
            dobras,
            medidas,
            results,
            meals,
            structure,
          };

          console.log(updatedConsulta);

          try {
            await CustomerConsultasService(uid, customerId)?.updateOne(
              id,
              updatedConsulta,
            );
            console.log("Feito");
            return { data: consulta };
          } catch (err: unknown) {
            console.error("Não Feito", err);
            return { error: err };
          }
        },
      }),
      addCustomerConsulta: builder.mutation<
        ICustomerConsulta,
        {
          uid: string;
          customerId: string | undefined;
          newConsulta: ICustomerConsulta;
        }
      >({
        queryFn: async ({ uid, customerId, newConsulta }) => {
          if (!uid || !customerId) return { error: "Args not provided" };

          const {
            date = "",
            // eslint-disable-next-line camelcase
            pending = true,
            online = false,
            updateCredits = true,
            howmuch = 0,
            obs = "",
            peso = "",
            idade = 0,
            anexos = [],
            images = {} as IImages,
            dobras = {} as IFolds,
            medidas = {} as IMeasures,
            results = {} as IResults,
            meals = [],
            structure = {} as IStructure,
          } = newConsulta;

          const consulta: ICustomerConsultaFirebase = {
            // eslint-disable-next-line camelcase
            date: date
              ? Timestamp.fromDate(parse(date, "dd/MM/yyyy", new Date()))
              : undefined,
            createdAt: Timestamp.fromDate(new Date()),
            pending,
            online,
            updateCredits,
            howmuch,
            obs,
            peso: Number(peso),
            idade,
            anexos,
            images,
            dobras,
            medidas,
            results,
            meals,
            structure,
          };

          try {
            const response = await CustomerConsultasService(
              uid,
              customerId,
            )?.addOne(consulta);
            const data = response?.withConverter({
              toFirestore({
                ...data
              }: PartialWithFieldValue<ICustomerConsulta>): DocumentData {
                return data;
              },
              fromFirestore(
                snapshot: QueryDocumentSnapshot<ICustomerConsultaFirebase>,
                options: SnapshotOptions,
              ): ICustomerConsulta {
                const data = snapshot.data(options);
                return {
                  id: snapshot.id,
                  ...data,
                  date: dateInString(data.date),
                  createdAt: dateInString(data.createdAt),
                  peso: data.peso?.toString(),
                };
              },
            });
            return { data };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const selectLastConsulta = (uid: string, customerId: string) =>
  createSelector(
    customerConsultasSlice.endpoints.fetchConsultas.select({
      uid,
      customerId,
    }),
    ({ data: consultas }) => (consultas ? consultas[0] : undefined),
  );

export const {
  useFetchConsultasQuery,
  useAddCustomerConsultaMutation,
  useUpdateCustomerConsultaMutation,
} = customerConsultasSlice;
