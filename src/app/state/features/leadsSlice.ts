import { createSelector } from "@reduxjs/toolkit";
import { Timestamp } from "firebase/firestore";

import { LeadsService } from "@/app/services/LeadsService";
import { ILead, ILeadFirebase } from "@/domain/entities";

import { firestoreApi } from "../firestoreApi";

export const leadsSlice = firestoreApi
  .enhanceEndpoints({ addTagTypes: ["Leads"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchLeads: builder.query<ILead[], string | undefined>({
        providesTags: ["Leads"],
        keepUnusedDataFor: 3600,
        queryFn: () => ({ data: [] }),
        onCacheEntryAdded: async (
          uid,
          { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
        ) => {
          let unsubscribe: (() => void) | undefined;
          try {
            await cacheDataLoaded;
            unsubscribe = LeadsService(uid)?.getAll((snapshot) => {
              const leads = snapshot!.docs?.map((doc) => {
                const d = doc.data();
                return {
                  id: doc.id,
                  ...d,
                  createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
                  updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate().toISOString() : d.updatedAt,
                  convertedAt: d.convertedAt instanceof Timestamp ? d.convertedAt.toDate().toISOString() : d.convertedAt,
                  lastPurchaseDate: d.lastPurchaseDate instanceof Timestamp ? d.lastPurchaseDate.toDate().toISOString() : d.lastPurchaseDate,
                  lastAppointmentDate: d.lastAppointmentDate instanceof Timestamp ? d.lastAppointmentDate.toDate().toISOString() : d.lastAppointmentDate,
                } as ILead;
              });
              updateCachedData((draft) => {
                draft.splice(0, draft.length, ...leads);
              });
            });
          } catch {
            throw new Error("Something went wrong fetching leads.");
          }
          await cacheEntryRemoved;
          unsubscribe?.();
        },
      }),

      fetchLeadsOnce: builder.query<ILead[], string>({
        providesTags: ["Leads"],
        queryFn: async (uid) => {
          try {
            const snapshot = await LeadsService(uid)?.getAllOnce();
            const leads: ILead[] = (snapshot?.docs ?? []).map((doc) => {
              const d = doc.data();
              return {
                id: doc.id,
                ...d,
                createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
                updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate().toISOString() : d.updatedAt,
                convertedAt: d.convertedAt instanceof Timestamp ? d.convertedAt.toDate().toISOString() : d.convertedAt,
                lastPurchaseDate: d.lastPurchaseDate instanceof Timestamp ? d.lastPurchaseDate.toDate().toISOString() : d.lastPurchaseDate,
                lastAppointmentDate: d.lastAppointmentDate instanceof Timestamp ? d.lastAppointmentDate.toDate().toISOString() : d.lastAppointmentDate,
              } as ILead;
            });
            return { data: leads };
          } catch (err) {
            return { error: err };
          }
        },
      }),

      addLead: builder.mutation<
        void,
        { uid: string; lead: Omit<ILead, "id" | "createdAt" | "updatedAt"> }
      >({
        invalidatesTags: ["Leads"],
        queryFn: async ({ uid, lead }) => {
          try {
            const now = Timestamp.now();
            const { convertedAt: _c, lastPurchaseDate: _lp, lastAppointmentDate: _la, ...rest } = lead;
            const newLead: Omit<ILeadFirebase, "id"> = {
              ...rest,
              tags: rest.tags ?? [],
              isConverted: false,
              createdAt: now,
              updatedAt: now,
            };
            await LeadsService(uid)?.addOne(newLead as ILeadFirebase);
            return { data: undefined };
          } catch (err) {
            return { error: err };
          }
        },
      }),

      updateLead: builder.mutation<
        void,
        { uid: string; leadId: string; updates: Partial<ILead> }
      >({
        queryFn: async ({ uid, leadId, updates }) => {
          try {
            const { createdAt, convertedAt, lastPurchaseDate, lastAppointmentDate, ...rest } = updates;
            const firestoreUpdates: Partial<ILeadFirebase> = {
              ...rest,
              updatedAt: Timestamp.now(),
            };
            if (convertedAt) firestoreUpdates.convertedAt = Timestamp.fromDate(new Date(convertedAt));
            if (lastPurchaseDate) firestoreUpdates.lastPurchaseDate = Timestamp.fromDate(new Date(lastPurchaseDate));
            if (lastAppointmentDate) firestoreUpdates.lastAppointmentDate = Timestamp.fromDate(new Date(lastAppointmentDate));
            await LeadsService(uid)?.updateOne(leadId, firestoreUpdates);
            return { data: undefined };
          } catch (err) {
            return { error: err };
          }
        },
      }),

      deleteLead: builder.mutation<void, { uid: string; leadId: string }>({
        invalidatesTags: ["Leads"],
        queryFn: async ({ uid, leadId }) => {
          try {
            await LeadsService(uid)?.deleteOne(leadId);
            return { data: undefined };
          } catch (err) {
            return { error: err };
          }
        },
      }),

      archiveLead: builder.mutation<void, { uid: string; leadId: string; isArchived: boolean }>({
        invalidatesTags: ["Leads"],
        queryFn: async ({ uid, leadId, isArchived }) => {
          try {
            await LeadsService(uid)?.updateOne(leadId, { isArchived });
            return { data: undefined };
          } catch (err) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const selectLeadById = (
  uid: string | undefined,
  leadId: string | undefined,
) =>
  createSelector(
    leadsSlice.endpoints.fetchLeads.select(uid),
    ({ data: leads }) => leads?.find((l) => l.id === leadId),
  );

export const {
  useFetchLeadsQuery,
  useFetchLeadsOnceQuery,
  useAddLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useArchiveLeadMutation,
} = leadsSlice;
