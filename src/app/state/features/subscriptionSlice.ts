import { firestoreApi } from "../firestoreApi";
import {
  ISubscription,
  IInvoice,
  IPaymentHistory,
  PlanTier,
} from "@/domain/entities";
import { SubscriptionService } from "@/app/services/SubscriptionService";

export const subscriptionSlice = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch subscription with real-time updates
    fetchSubscription: builder.query<ISubscription | null, string>({
      queryFn: () => ({ data: null }),
      providesTags: ["Subscription"],
      async onCacheEntryAdded(
        uid,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        let unsubscribe: (() => void) | undefined;
        try {
          await cacheDataLoaded;

          const service = SubscriptionService(uid);
          if (!service) {
            console.warn("SubscriptionService not available for uid:", uid);
            return;
          }

          unsubscribe = service.getSubscription((subscription) => {
            updateCachedData(() => subscription);
          });
        } catch (error) {
          console.error("Error in fetchSubscription cache entry:", error);
        }

        await cacheEntryRemoved;
        unsubscribe?.();
      },
    }),

    // Fetch invoices with real-time updates
    fetchInvoices: builder.query<IInvoice[], string>({
      queryFn: () => ({ data: [] }),
      providesTags: ["Invoices"],
      async onCacheEntryAdded(
        uid,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        let unsubscribe: (() => void) | undefined;
        try {
          await cacheDataLoaded;

          const service = SubscriptionService(uid);
          if (!service) {
            console.warn("SubscriptionService not available for uid:", uid);
            return;
          }

          unsubscribe = service.getInvoices((invoices) => {
            updateCachedData(() => invoices);
          });
        } catch (error) {
          console.error("Error in fetchInvoices cache entry:", error);
        }

        await cacheEntryRemoved;
        unsubscribe?.();
      },
    }),

    // Fetch payment history with real-time updates
    fetchPaymentHistory: builder.query<IPaymentHistory[], string>({
      queryFn: () => ({ data: [] }),
      providesTags: ["PaymentHistory"],
      async onCacheEntryAdded(
        uid,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        let unsubscribe: (() => void) | undefined;
        try {
          await cacheDataLoaded;

          const service = SubscriptionService(uid);
          if (!service) {
            console.warn("SubscriptionService not available for uid:", uid);
            return;
          }

          unsubscribe = service.getPaymentHistory((history) => {
            updateCachedData(() => history);
          });
        } catch (error) {
          console.error("Error in fetchPaymentHistory cache entry:", error);
        }

        await cacheEntryRemoved;
        unsubscribe?.();
      },
    }),

    // Update subscription
    updateSubscription: builder.mutation<
      void,
      { uid: string; subscription: Partial<ISubscription> }
    >({
      queryFn: async ({ uid, subscription }) => {
        try {
          const service = SubscriptionService(uid);
          if (!service) {
            return { error: { status: 400, data: "Invalid uid" } };
          }

          await service.updateSubscription(subscription);
          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["Subscription"],
    }),

    // Initialize free tier for new users
    initializeFreeTier: builder.mutation<void, string>({
      queryFn: async (uid) => {
        try {
          const service = SubscriptionService(uid);
          if (!service) {
            return { error: { status: 400, data: "Invalid uid" } };
          }

          await service.initializeFreeTier();
          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["Subscription"],
    }),

    // Check if user can add more customers
    canAddCustomer: builder.query<boolean, { uid: string; currentCount: number }>({
      queryFn: async ({ uid, currentCount }) => {
        try {
          const service = SubscriptionService(uid);
          if (!service) {
            return { error: { status: 400, data: "Invalid uid" } };
          }

          const canAdd = await service.canAddCustomer(currentCount);
          return { data: canAdd };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
    }),

    // Get required plan tier based on customer count
    getRequiredPlanTier: builder.query<PlanTier, { uid: string; customerCount: number }>({
      queryFn: ({ uid, customerCount }) => {
        try {
          const service = SubscriptionService(uid);
          if (!service) {
            return { error: { status: 400, data: "Invalid uid" } };
          }

          const tier = service.getRequiredPlanTier(customerCount);
          return { data: tier };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
    }),

    // Create invoice
    createInvoice: builder.mutation<
      string,
      { uid: string; invoice: Omit<IInvoice, "id" | "createdAt"> }
    >({
      queryFn: async ({ uid, invoice }) => {
        try {
          const service = SubscriptionService(uid);
          if (!service) {
            return { error: { status: 400, data: "Invalid uid" } };
          }

          const invoiceId = await service.createInvoice(invoice);
          return { data: invoiceId };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["Invoices"],
    }),

    // Update invoice
    updateInvoice: builder.mutation<
      void,
      { uid: string; invoiceId: string; updates: Partial<IInvoice> }
    >({
      queryFn: async ({ uid, invoiceId, updates }) => {
        try {
          const service = SubscriptionService(uid);
          if (!service) {
            return { error: { status: 400, data: "Invalid uid" } };
          }

          await service.updateInvoice(invoiceId, updates);
          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: ["Invoices"],
    }),
  }),
});

export const {
  useFetchSubscriptionQuery,
  useFetchInvoicesQuery,
  useFetchPaymentHistoryQuery,
  useUpdateSubscriptionMutation,
  useInitializeFreeTierMutation,
  useCanAddCustomerQuery,
  useLazyCanAddCustomerQuery,
  useGetRequiredPlanTierQuery,
  useLazyGetRequiredPlanTierQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
} = subscriptionSlice;
