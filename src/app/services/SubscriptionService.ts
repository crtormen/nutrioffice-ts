import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  setDoc,
  SnapshotOptions,
  Timestamp,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/infra/firebase";
import {
  ISubscription,
  ISubscriptionFirebase,
  IInvoice,
  IInvoiceFirebase,
  IPaymentHistory,
  IPaymentHistoryFirebase,
  PLAN_CONFIGS,
  PlanTier,
} from "@/domain/entities";

// Converters
const subscriptionConverter = {
  toFirestore({
    currentPeriodStart,
    currentPeriodEnd,
    lastPaymentDate,
    nextBillingDate,
    createdAt,
    updatedAt,
    ...data
  }: PartialWithFieldValue<ISubscription>): DocumentData {
    return {
      ...data,
      currentPeriodStart: currentPeriodStart
        ? Timestamp.fromDate(new Date(currentPeriodStart))
        : null,
      currentPeriodEnd: currentPeriodEnd
        ? Timestamp.fromDate(new Date(currentPeriodEnd))
        : null,
      lastPaymentDate: lastPaymentDate
        ? Timestamp.fromDate(new Date(lastPaymentDate))
        : null,
      nextBillingDate: nextBillingDate
        ? Timestamp.fromDate(new Date(nextBillingDate))
        : null,
      createdAt: createdAt ? Timestamp.fromDate(new Date(createdAt)) : Timestamp.now(),
      updatedAt: updatedAt ? Timestamp.fromDate(new Date(updatedAt)) : Timestamp.now(),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<ISubscriptionFirebase>,
    options: SnapshotOptions
  ): ISubscription {
    const data = snapshot.data(options);
    return {
      planTier: data.planTier,
      status: data.status,
      billingInterval: data.billingInterval,
      currentPeriodStart: data.currentPeriodStart?.toDate().toISOString() || "",
      currentPeriodEnd: data.currentPeriodEnd?.toDate().toISOString() || "",
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      mercadoPagoSubscriptionId: data.mercadoPagoSubscriptionId,
      mercadoPagoCustomerId: data.mercadoPagoCustomerId,
      paymentMethod: data.paymentMethod,
      lastPaymentStatus: data.lastPaymentStatus,
      lastPaymentDate: data.lastPaymentDate?.toDate().toISOString(),
      nextBillingDate: data.nextBillingDate?.toDate().toISOString(),
      createdAt: data.createdAt?.toDate().toISOString() || "",
      updatedAt: data.updatedAt?.toDate().toISOString() || "",
    };
  },
};

const invoiceConverter = {
  toFirestore({
    dueDate,
    paidAt,
    createdAt,
    ...data
  }: PartialWithFieldValue<IInvoice>): DocumentData {
    return {
      ...data,
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
      paidAt: paidAt ? Timestamp.fromDate(new Date(paidAt)) : null,
      createdAt: createdAt ? Timestamp.fromDate(new Date(createdAt)) : Timestamp.now(),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<IInvoiceFirebase>,
    options: SnapshotOptions
  ): IInvoice {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      subscriptionId: data.subscriptionId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      paymentMethod: data.paymentMethod,
      mercadoPagoPaymentId: data.mercadoPagoPaymentId,
      pdfUrl: data.pdfUrl,
      dueDate: data.dueDate?.toDate().toISOString() || "",
      paidAt: data.paidAt?.toDate().toISOString(),
      createdAt: data.createdAt?.toDate().toISOString() || "",
    };
  },
};

const paymentHistoryConverter = {
  toFirestore({
    createdAt,
    ...data
  }: PartialWithFieldValue<IPaymentHistory>): DocumentData {
    return {
      ...data,
      createdAt: createdAt ? Timestamp.fromDate(new Date(createdAt)) : Timestamp.now(),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<IPaymentHistoryFirebase>,
    options: SnapshotOptions
  ): IPaymentHistory {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      event: data.event,
      planTier: data.planTier,
      amount: data.amount,
      metadata: data.metadata,
      createdAt: data.createdAt?.toDate().toISOString() || "",
    };
  },
};

export const SubscriptionService = (uid?: string) => {
  if (!uid) return null;

  const subscriptionDoc = doc(db, `users/${uid}`);
  const invoicesCollection = collection(db, `users/${uid}/invoices`);
  const paymentHistoryCollection = collection(db, `users/${uid}/paymentHistory`);

  return {
    /**
     * Get subscription for a user with real-time updates
     */
    getSubscription: (callback: (subscription: ISubscription | null) => void) => {
      return onSnapshot(subscriptionDoc, (snapshot) => {
        const userData = snapshot.data();
        if (userData?.subscription) {
          const converter = subscriptionConverter.fromFirestore(
            { data: () => userData.subscription } as any,
            {}
          );
          callback(converter);
        } else {
          callback(null);
        }
      });
    },

    /**
     * Get subscription once (no real-time)
     */
    getSubscriptionOnce: async (): Promise<ISubscription | null> => {
      const snapshot = await getDoc(subscriptionDoc);
      const userData = snapshot.data();
      if (userData?.subscription) {
        return subscriptionConverter.fromFirestore(
          { data: () => userData.subscription } as any,
          {}
        );
      }
      return null;
    },

    /**
     * Create or update subscription
     */
    updateSubscription: async (subscription: Partial<ISubscription>) => {
      const firestoreData = subscriptionConverter.toFirestore(subscription as ISubscription);
      await updateDoc(subscriptionDoc, {
        subscription: {
          ...firestoreData,
          updatedAt: Timestamp.now(),
        },
      });
    },

    /**
     * Initialize free tier subscription for new users
     */
    initializeFreeTier: async () => {
      const now = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      const freeSubscription: ISubscription = {
        planTier: "free",
        status: "active",
        billingInterval: "monthly",
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: oneYearLater.toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await setDoc(
        subscriptionDoc,
        {
          subscription: subscriptionConverter.toFirestore(freeSubscription),
        },
        { merge: true }
      );
    },

    /**
     * Get required plan tier based on customer count
     */
    getRequiredPlanTier: (customerCount: number): PlanTier => {
      if (customerCount <= PLAN_CONFIGS.free.maxCustomers) return "free";
      if (customerCount <= PLAN_CONFIGS.starter.maxCustomers) return "starter";
      if (customerCount <= PLAN_CONFIGS.professional.maxCustomers) return "professional";
      return "enterprise";
    },

    /**
     * Check if user can add more customers
     */
    canAddCustomer: async (currentCount: number): Promise<boolean> => {
      const snapshot = await getDoc(subscriptionDoc);
      const userData = snapshot.data();

      // Check permanent free status
      if (userData?.permanentFree) return true;

      const subscription = userData?.subscription;
      if (!subscription) return currentCount < PLAN_CONFIGS.free.maxCustomers;

      const planConfig = PLAN_CONFIGS[subscription.planTier as PlanTier];
      return currentCount < planConfig.maxCustomers;
    },

    /**
     * Get all invoices for a user with real-time updates
     */
    getInvoices: (callback: (invoices: IInvoice[]) => void) => {
      const q = query(
        invoicesCollection.withConverter(invoiceConverter),
        orderBy("createdAt", "desc")
      );

      return onSnapshot(q, (snapshot) => {
        const invoices = snapshot.docs.map((doc) => doc.data());
        callback(invoices);
      });
    },

    /**
     * Get invoices once
     */
    getInvoicesOnce: async (): Promise<IInvoice[]> => {
      const q = query(
        invoicesCollection.withConverter(invoiceConverter),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data());
    },

    /**
     * Create an invoice
     */
    createInvoice: async (invoice: Omit<IInvoice, "id" | "createdAt">) => {
      const invoiceDoc = doc(invoicesCollection);
      await setDoc(
        invoiceDoc.withConverter(invoiceConverter),
        {
          ...invoice,
          createdAt: new Date().toISOString(),
        } as IInvoice
      );
      return invoiceDoc.id;
    },

    /**
     * Update invoice status
     */
    updateInvoice: async (invoiceId: string, updates: Partial<IInvoice>) => {
      const invoiceDoc = doc(invoicesCollection, invoiceId);
      const firestoreData = invoiceConverter.toFirestore(updates as IInvoice);
      await updateDoc(invoiceDoc, firestoreData);
    },

    /**
     * Get payment history with real-time updates
     */
    getPaymentHistory: (callback: (history: IPaymentHistory[]) => void) => {
      const q = query(
        paymentHistoryCollection.withConverter(paymentHistoryConverter),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      return onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map((doc) => doc.data());
        callback(history);
      });
    },

    /**
     * Add payment history entry
     */
    addPaymentHistory: async (
      entry: Omit<IPaymentHistory, "id" | "createdAt">
    ) => {
      const historyDoc = doc(paymentHistoryCollection);
      await setDoc(
        historyDoc.withConverter(paymentHistoryConverter),
        {
          ...entry,
          createdAt: new Date().toISOString(),
        } as IPaymentHistory
      );
    },
  };
};
