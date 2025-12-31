import {
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import { firestoreApi } from "../firestoreApi";
import { IInstallment, IPayment, IPaymentFirebase, IInstallmentFirebase } from "@/domain/entities";
import {
  OVERDUE_GRACE_PERIOD_DAYS,
  OVERDUE_TRACKABLE_METHODS,
} from "@/domain/entities/finances";
import { InstallmentsService } from "@/app/services/InstallmentsService";
import { PaymentsService } from "@/app/services/PaymentsService";
import { FinancesService } from "@/app/services/FinancesService";
import { CustomerFinancesService } from "@/app/services/CustomerFinancesService";

/**
 * PHASE 1 MIGRATION HELPER: Convert old numeric payment methods to strings
 * Old V1 system used numbers (1 = dinheiro, 2 = cartão, etc)
 * New system uses strings ("dinheiro", "credito", "pix", etc)
 */
function convertLegacyPaymentMethod(method: string | number): string {
  // If already a string, return as is
  if (typeof method === "string") {
    return method;
  }

  // Convert old numeric methods to new string format
  const methodMap: Record<number, string> = {
    1: "dinheiro",
    2: "credito",
    3: "debito",
    4: "pix",
    5: "transferencia",
  };

  return methodMap[method] || "outro";
}

export const paymentsSlice = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all payments for a finance record
    // PHASE 1 MIGRATION: Backwards-compatible read layer for embedded payments
    fetchFinancePayments: builder.query<
      IPayment[],
      { uid: string; financeId: string }
    >({
      queryFn: () => ({ data: [] }),
      providesTags: ["Payments"],
      onCacheEntryAdded: async (
        { uid, financeId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) => {
        await cacheDataLoaded;
        const service = PaymentsService(uid);
        const financesService = FinancesService(uid);
        if (!service) return;

        // Query payments for specific finance
        const q = query(
          service.collection,
          where("financeId", "==", financeId),
          orderBy("createdAt", "desc"),
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          updateCachedData((draft) => {
            draft.splice(0, draft.length);

            // Add payments from separate collection
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              draft.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate().toISOString() || "",
              } as IPayment);
            });

            // BACKWARDS COMPATIBILITY: If no payments found in separate collection,
            // check for embedded payments in the finance document
            if (draft.length === 0 && financesService) {
              financesService.getOne(financeId).then((finance) => {
                if (finance?.payments && finance.payments.length > 0) {
                  // Extract embedded payments and add to cache
                  // Handle both string (already converted) and Timestamp (raw from Firestore)
                  const legacyPayments = finance.payments.map((payment, index): IPayment => {
                    const createdAt = payment.createdAt
                      ? typeof payment.createdAt === "string"
                        ? payment.createdAt
                        : (payment.createdAt as any).toDate().toISOString()
                      : "";

                    return {
                      id: `legacy_${financeId}_${index}`,
                      financeId: financeId,
                      customerId: finance.customerId,
                      createdAt,
                      method: convertLegacyPaymentMethod(payment.method as any),
                      valor: payment.valor,
                      obs: payment.obs,
                      hasInstallments: false,
                    };
                  });

                  updateCachedData((innerDraft) => {
                    innerDraft.splice(0, innerDraft.length);
                    innerDraft.push(...legacyPayments);
                  });
                }
              }).catch((error) => {
                console.warn("Error checking for embedded payments:", error);
              });
            }
          });
        });

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    // Add payment to existing finance
    addPaymentToFinance: builder.mutation<
      void,
      {
        uid: string;
        payment: Omit<IPayment, "id">;
        installments?: Omit<IInstallment, "id" | "paymentId">[];
      }
    >({
      queryFn: async ({ uid, payment, installments }) => {

        const paymentsService = PaymentsService(uid);
        const installmentsService = InstallmentsService(uid);
        const financesService = FinancesService(uid);

        if (!paymentsService || !installmentsService || !financesService) {
          console.error("Services not initialized!");
          return { error: { error: "Services not initialized", status: "CUSTOM_ERROR" } };
        }

        try {
          // 1. Add payment document - convert to Firebase type
          const paymentData: Omit<IPaymentFirebase, "id"> = {
            ...payment,
            createdAt: Timestamp.fromDate(new Date(payment.createdAt)),
          };
          const paymentRef = await paymentsService.addOne(paymentData);

          // 2. Add installments if present - convert to Firebase type
          if (installments && installments.length > 0) {
            const installmentPromises = installments.map((inst) => {
              const installmentData: Omit<IInstallmentFirebase, "id" | "paymentId"> & { paymentId: string } = {
                ...inst,
                paymentId: paymentRef.id,
                dueDate: Timestamp.fromDate(new Date(inst.dueDate)),
                paidDate: inst.paidDate ? Timestamp.fromDate(new Date(inst.paidDate)) : undefined,
              };
              return installmentsService.addOne(installmentData);
            });
            await Promise.all(installmentPromises);
          }

          // 3. Update finance totals in both collections
          const customerFinancesService = CustomerFinancesService(uid, payment.customerId);

          // Try global Finances collection first
          let financeDoc = await financesService.getOne(payment.financeId);

          // If not found in global, try CustomerFinances subcollection
          if (!financeDoc && customerFinancesService) {
            financeDoc = await customerFinancesService.getOne(payment.financeId);
          }

          if (financeDoc) {
            const newPago = (financeDoc.pago || 0) + payment.valor;
            const newSaldo = financeDoc.total - newPago;
            const newStatus: "pending" | "partial" | "paid" =
              newSaldo <= 0 ? "paid" : newPago > 0 ? "partial" : "pending";

            const updateData = {
              pago: newPago,
              saldo: newSaldo,
              status: newStatus,
            };

            // Update CustomerFinances subcollection (this always exists)
            if (customerFinancesService) {
              await customerFinancesService.updateOne(payment.financeId, updateData);
            }

            // Update global Finances collection using setOne with merge
            // This will update if exists, or create partial document if doesn't exist
            await financesService.setOne(payment.financeId, updateData, true);
          } else {
            console.warn("Finance document not found in any collection!");
          }

          return { data: undefined };
        } catch (error: any) {
          console.error("Payment mutation error:", error);
          return { error: { error: error.message, status: "CUSTOM_ERROR" } };
        }
      },
      // Don't invalidate "CustomerFinances" - it uses real-time listeners that auto-update
      // Invalidating would clear the cache before the listener repopulates it
      invalidatesTags: ["Payments", "Installments", "Finances"],
    }),

    // Fetch installments for a payment
    fetchPaymentInstallments: builder.query<
      IInstallment[],
      { uid: string; paymentId: string }
    >({
      queryFn: () => ({ data: [] }),
      providesTags: ["Installments"],
      onCacheEntryAdded: async (
        { uid, paymentId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) => {
        await cacheDataLoaded;
        const service = InstallmentsService(uid);
        if (!service) return;

        // Query installments for specific payment
        const q = query(
          service.collection,
          where("paymentId", "==", paymentId),
          orderBy("installmentNumber", "asc"),
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          updateCachedData((draft) => {
            draft.splice(0, draft.length);
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              draft.push({
                id: doc.id,
                ...data,
                dueDate: data.dueDate?.toDate().toISOString() || "",
                paidDate: data.paidDate?.toDate().toISOString(),
              } as IInstallment);
            });
          });
        });

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    // Fetch installments for a finance record
    fetchFinanceInstallments: builder.query<
      IInstallment[],
      { uid: string; financeId: string }
    >({
      queryFn: () => ({ data: [] }),
      providesTags: ["Installments"],
      onCacheEntryAdded: async (
        { uid, financeId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) => {
        await cacheDataLoaded;
        const service = InstallmentsService(uid);
        if (!service) return;

        // Query installments for specific finance
        const q = query(
          service.collection,
          where("financeId", "==", financeId),
          orderBy("dueDate", "asc"),
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          updateCachedData((draft) => {
            draft.splice(0, draft.length);
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              draft.push({
                id: doc.id,
                ...data,
                dueDate: data.dueDate?.toDate().toISOString() || "",
                paidDate: data.paidDate?.toDate().toISOString(),
              } as IInstallment);
            });
          });
        });

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    // Update installment status (mark as paid)
    updateInstallmentStatus: builder.mutation<
      void,
      {
        uid: string;
        installmentId: string;
        status: "pending" | "paid" | "reconciled";
        paidDate?: string;
        bankTransactionId?: string;
      }
    >({
      queryFn: async ({ uid, installmentId, status, paidDate, bankTransactionId }) => {
        const service = InstallmentsService(uid);
        if (!service) return { error: { error: "Service not initialized", status: "CUSTOM_ERROR" } };

        try {
          const updateData: Partial<IInstallmentFirebase> = {
            status,
          };

          if (paidDate) {
            updateData.paidDate = Timestamp.fromDate(new Date(paidDate));
          }

          if (bankTransactionId) {
            updateData.bankTransactionId = bankTransactionId;
          }

          await service.updateOne(installmentId, updateData);
          return { data: undefined };
        } catch (error: any) {
          return { error: { error: error.message, status: "CUSTOM_ERROR" } };
        }
      },
      invalidatesTags: ["Installments"],
    }),

    // Fetch installments by period (for filtering/reports)
    fetchInstallmentsByPeriod: builder.query<
      IInstallment[],
      {
        uid: string;
        from: string;
        to: string;
      }
    >({
      queryFn: async ({ uid, from, to }) => {
        const service = InstallmentsService(uid);
        if (!service) return { data: [] };

        try {
          const q = query(
            service.collection,
            where("dueDate", ">=", Timestamp.fromDate(new Date(from))),
            where("dueDate", "<=", Timestamp.fromDate(new Date(to))),
            orderBy("dueDate", "asc"),
          );

          const snapshot = await getDocs(q);
          const installments = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              dueDate: data.dueDate?.toDate().toISOString() || "",
              paidDate: data.paidDate?.toDate().toISOString(),
            } as IInstallment;
          });
          return { data: installments };
        } catch (error: any) {
          return { error: { error: error.message, status: "CUSTOM_ERROR" } };
        }
      },
      providesTags: ["Installments"],
    }),

    // Fetch overdue installments with grace period
    fetchOverdueInstallments: builder.query<
      IInstallment[],
      { uid: string; methodFilter?: string[] }
    >({
      queryFn: async ({ uid, methodFilter }) => {
        const service = InstallmentsService(uid);
        if (!service) return { data: [] };

        try {
          // Calculate cutoff with grace period
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const graceCutoff = new Date(today);
          graceCutoff.setDate(graceCutoff.getDate() - OVERDUE_GRACE_PERIOD_DAYS);

          const q = query(
            service.collection,
            where("dueDate", "<", Timestamp.fromDate(graceCutoff)),
            where("status", "==", "pending"),
            orderBy("dueDate", "asc"),
          );

          const snapshot = await getDocs(q);
          const installments = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              dueDate: data.dueDate?.toDate().toISOString() || "",
              paidDate: data.paidDate?.toDate().toISOString(),
            } as IInstallment;
          });

          // Filter by payment method if specified
          if (methodFilter && methodFilter.length > 0) {
            // Need to fetch payments to get methods
            const paymentsService = PaymentsService(uid);
            if (!paymentsService) return { data: installments };

            const paymentsSnap = await paymentsService.getAllOnce();
            const paymentMethodMap = new Map(
              paymentsSnap.docs.map((doc) => [
                doc.id,
                (doc.data() as IPayment).method,
              ]),
            );

            return {
              data: installments.filter((inst) =>
                methodFilter.includes(paymentMethodMap.get(inst.paymentId) || ""),
              ),
            };
          }

          return { data: installments };
        } catch (error: any) {
          return { error: { error: error.message, status: "CUSTOM_ERROR" } };
        }
      },
      providesTags: ["Installments"],
    }),

    // Fetch overdue installments grouped by customer
    fetchOverdueByCustomer: builder.query<
      Array<{
        customerId: string;
        totalOverdue: number;
        oldestDueDate: string;
        installmentCount: number;
      }>,
      { uid: string }
    >({
      queryFn: async ({ uid }, { dispatch }) => {
        try {
          // Fetch overdue installments for trackable methods only
          const result: any = await dispatch(
            paymentsSlice.endpoints.fetchOverdueInstallments.initiate({
              uid,
              methodFilter: [...OVERDUE_TRACKABLE_METHODS],
            }),
          );

          const installments: IInstallment[] = result.data || [];

          // Group by customer
          const customerMap = new Map<
            string,
            {
              totalOverdue: number;
              oldestDueDate: string;
              installmentCount: number;
            }
          >();

          installments.forEach((inst) => {
            const existing = customerMap.get(inst.customerId) || {
              totalOverdue: 0,
              oldestDueDate: inst.dueDate,
              installmentCount: 0,
            };

            customerMap.set(inst.customerId, {
              totalOverdue: existing.totalOverdue + inst.valor,
              oldestDueDate:
                inst.dueDate < existing.oldestDueDate
                  ? inst.dueDate
                  : existing.oldestDueDate,
              installmentCount: existing.installmentCount + 1,
            });
          });

          // Convert to array and sort by oldest due date
          const data = Array.from(customerMap.entries())
            .map(([customerId, info]) => ({ customerId, ...info }))
            .sort((a, b) => a.oldestDueDate.localeCompare(b.oldestDueDate));

          return { data };
        } catch (error: any) {
          return { error: { error: error.message, status: "CUSTOM_ERROR" } };
        }
      },
      providesTags: ["Installments"],
    }),
  }),
});

export const {
  useFetchFinancePaymentsQuery,
  useAddPaymentToFinanceMutation,
  useFetchPaymentInstallmentsQuery,
  useFetchFinanceInstallmentsQuery,
  useUpdateInstallmentStatusMutation,
  useFetchInstallmentsByPeriodQuery,
  useFetchOverdueInstallmentsQuery,
  useFetchOverdueByCustomerQuery,
} = paymentsSlice;
