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
import { dateInString } from "@/lib/utils";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const CustomerFinancesCollection = (uid: string, customerId: string) => {
  return uid && customerId
    ? createCollectionRef<IFinanceFirebase>(
        "users/" + uid + "/customers/" + customerId + "/finances",
      )
    : null;
};

export const CustomerFinancesService = (
  uid: string | undefined,
  customerId: string | undefined
) => {
  if (!uid || !customerId) return;
  const collection = CustomerFinancesCollection(uid, customerId);
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
              createdAt: dateInString(payment.createdAt),
            }))
          : undefined;
        const returnData: IFinance = {
          id: snapshot.id,
          ...data,
          createdAt: dateInString(data.createdAt),
          payments,
        };
        return returnData;
      },
    }),
    orderBy("createdAt", "desc")
  );
  return financesService;
};
