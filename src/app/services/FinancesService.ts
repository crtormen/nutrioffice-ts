import {
  DocumentData,
  orderBy,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";

import { IFinance, IFinanceFirebase, IPayment } from "@/domain/entities";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const FinancesCollection = (uid: string) => {
  return uid
    ? createCollectionRef<IFinanceFirebase>("users/" + uid + "/finances")
    : null;
};

export const FinancesService = (uid: string | undefined) => {
  if (!uid) return;

  const collection = FinancesCollection(uid);
  if (!collection) return;

  const financesService = new DatabaseService<IFinanceFirebase>(collection);

  financesService.query = query(
    collection.withConverter({
      toFirestore({ createdAt, payments, ...rest }: PartialWithFieldValue<IFinance>): DocumentData {
        const firebaseData: any = {
          ...rest,
          createdAt: createdAt
            ? Timestamp.fromDate(new Date(createdAt as string))
            : Timestamp.now(),
        };

        // Convert payments timestamps if they exist
        if (payments && Array.isArray(payments)) {
          firebaseData.payments = payments.map((payment: any) => ({
            ...payment,
            createdAt: Timestamp.fromDate(new Date(payment.createdAt)),
          }));
        }

        return firebaseData as DocumentData;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IFinanceFirebase>,
        options: SnapshotOptions,
      ): IFinance {
        const data = snapshot.data(options);
        const payments: IPayment[] | undefined = data.payments
          ? data.payments.map((payment) => ({
              ...payment,
              createdAt: payment.createdAt?.toDate?.().toISOString() ||
                         (typeof payment.createdAt === 'string' ? payment.createdAt : ""),
            }))
          : undefined;

        // Handle both Timestamp and string formats for backwards compatibility
        let createdAtString = "";
        if (data.createdAt) {
          if (typeof data.createdAt === 'string') {
            createdAtString = data.createdAt;
          } else if (data.createdAt.toDate) {
            createdAtString = data.createdAt.toDate().toISOString();
          }
        }

        return {
          id: snapshot.id,
          ...data,
          createdAt: createdAtString,
          payments,
        };
      },
    }),
    orderBy("createdAt", "desc"),
  );

  return financesService;
};
