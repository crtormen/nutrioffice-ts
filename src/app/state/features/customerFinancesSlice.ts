import { createSelector } from "@reduxjs/toolkit";
import { Timestamp } from "firebase/firestore";

import { CustomerFinancesService } from "@/app/services/CustomerFinancesService";
import { CustomersService } from "@/app/services/CustomersService";
import { FinancesService } from "@/app/services/FinancesService";
import { PaymentsService } from "@/app/services/PaymentsService";
import { InstallmentsService } from "@/app/services/InstallmentsService";
import { IFinance, IPayment, IInstallment, IPaymentFirebase, IInstallmentFirebase, type IFinanceFirebase } from "@/domain/entities";
import { calculateInstallmentDueDate } from "@/lib/utils";

import { firestoreApi } from "../firestoreApi";

type QueryArgs = {
  uid: string;
  customerId: string;
};

type PaymentInput = Omit<IPayment, "id" | "financeId" | "customerId">;

type AddFinanceArgs = {
  uid: string;
  customerId: string;
  finance: Omit<IFinance, "id">;
  payments?: PaymentInput[];
};

export const customerFinancesSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ["CustomerFinances", "Customers"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchCustomerFinances: builder.query<IFinance[], QueryArgs>({
        queryFn: () => ({ data: [] }),
        providesTags: ["CustomerFinances"],
        onCacheEntryAdded: async (
          { uid, customerId },
          { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
        ) => {
          let unsubscribe;
          try {
            await cacheDataLoaded;
            const service = CustomerFinancesService(uid, customerId);
            if (!service) return;

            unsubscribe = service.getAll((snapshot) => {
              updateCachedData((draft) => {
                draft.splice(0, draft.length);
                snapshot.forEach((doc) => {
                  const data = doc.data() as IFinance;
                  draft.push(data);
                });
              });
            });

          } catch (err) {
            throw new Error(`Something went wrong with customerFinances. ${err}`);
          }
          await cacheEntryRemoved;
          unsubscribe && unsubscribe();
        },
      }),
      addCustomerFinance: builder.mutation<void, AddFinanceArgs>({
        invalidatesTags: ["Finances"],
        queryFn: async ({ uid, customerId, finance, payments }) => {
          try {
            const paymentsService = PaymentsService(uid);
            const installmentsService = InstallmentsService(uid);
            const financesService = FinancesService(uid);

            // Calculate totals from payments
            let totalPago = 0;
            if (payments && payments.length > 0) {
              totalPago = payments.reduce((sum, p) => sum + p.valor, 0);
            }

            const financeWithPaymentTotals = {
              ...finance,
              pago: totalPago,
              saldo: finance.total - totalPago,
              createdAt: Timestamp.now(),
              status:
                totalPago >= finance.total
                  ? "paid"
                  : totalPago > 0
                    ? "partial"
                    : "pending",
            } as Omit<IFinanceFirebase, "id">;

            // 1. Add finance record to CustomerFinances collection
            const financeRef = await CustomerFinancesService(uid, customerId)?.addOne(financeWithPaymentTotals);

            if (!financeRef) {
              throw new Error("Failed to create finance record");
            }

            // 2. Also write to global Finances collection using setOne
            if (financesService) {
              try {
                await financesService.setOne(
                  financeRef.id,
                  financeWithPaymentTotals,
                  false // Don't merge, create new document
                );
              } catch (error) {
                console.error("Error writing to global Finances collection:", error);
                throw error;
              }
            }

            // 2. Create payments in global collection and installments if needed
            if (payments && payments.length > 0 && paymentsService && installmentsService) {
              for (const paymentInput of payments) {
                // Create payment in global collection - convert to Firebase type
                const paymentData: Omit<IPaymentFirebase, "id"> = {
                  ...paymentInput,
                  financeId: financeRef.id,
                  customerId,
                  createdAt: Timestamp.fromDate(new Date(paymentInput.createdAt)),
                };

                const paymentRef = await paymentsService.addOne(paymentData);

                // Create installments if payment has installments
                if (paymentInput.hasInstallments && paymentInput.installmentsCount && paymentInput.installmentsCount > 1) {
                  const installmentAmount = paymentInput.valor / paymentInput.installmentsCount;
                  const paymentDate = new Date(paymentInput.createdAt);

                  for (let i = 0; i < paymentInput.installmentsCount; i++) {
                    const installmentData: Omit<IInstallmentFirebase, "id"> = {
                      paymentId: paymentRef.id,
                      financeId: financeRef.id,
                      customerId,
                      installmentNumber: i + 1,
                      valor: installmentAmount,
                      dueDate: Timestamp.fromDate(
                        calculateInstallmentDueDate(paymentDate, i)
                      ),
                      status: "pending",
                    };

                    await installmentsService.addOne(installmentData);
                  }
                }
              }
            }

            // 3. Update customer credits if credits were granted
            if (finance.creditsGranted > 0) {
              const customerDoc = await CustomersService(uid)?.getOne(customerId);
              const currentCredits = customerDoc?.credits || 0;
              await CustomersService(uid)?.updateOne(customerId, {
                credits: currentCredits + finance.creditsGranted,
              });
            }

            return { data: undefined };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
      deleteFinance: builder.mutation<void, QueryArgs & { financeId: string }>({
        invalidatesTags: ["Finances"],
        queryFn: async ({ uid, customerId, financeId }) => {
          try {
            const paymentsService = PaymentsService(uid);
            const installmentsService = InstallmentsService(uid);

            // 1. Get finance record to check for credits
            const financeDoc = await CustomerFinancesService(uid, customerId)?.getOne(financeId);

            // 2. Delete all installments associated with this finance
            if (installmentsService) {
              const installments = await installmentsService.getAllOnce();
              const financeInstallments = installments.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as IInstallment))
                .filter(inst => inst.financeId === financeId);

              for (const installment of financeInstallments) {
                await installmentsService.deleteOne(installment.id as string);
              }
            }

            // 3. Delete all payments associated with this finance
            if (paymentsService) {
              const payments = await paymentsService.getAllOnce();
              const financePayments = payments.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as IPayment))
                .filter(payment => payment.financeId === financeId);

              for (const payment of financePayments) {
                await paymentsService.deleteOne(payment.id as string);
              }
            }

            // 4. Remove credits from customer if they were granted
            if (financeDoc && financeDoc.creditsGranted > 0) {
              const customerDoc = await CustomersService(uid)?.getOne(customerId);
              const currentCredits = customerDoc?.credits || 0;
              await CustomersService(uid)?.updateOne(customerId, {
                credits: Math.max(0, currentCredits - financeDoc.creditsGranted),
              });
            }

            // 5. Delete the finance record from CustomerFinances collection
            await CustomerFinancesService(uid, customerId)?.deleteOne(financeId);

            // 6. Also delete from global Finances collection
            const financesService = FinancesService(uid);
            if (financesService) {
              await financesService.deleteOne(financeId);
            }

            return { data: undefined };
          } catch (err: unknown) {
            return { error: err };
          }
        },
      }),
    }),
  });

export const {
  useFetchCustomerFinancesQuery,
  useAddCustomerFinanceMutation,
  useDeleteFinanceMutation,
} = customerFinancesSlice;

export const selectCustomerFinances = (uid: string, customerId: string) =>
  createSelector(
    customerFinancesSlice.endpoints.fetchCustomerFinances.select({ uid, customerId }),
    ({ data: finances }) => (finances ? finances[0] : undefined),
  );
