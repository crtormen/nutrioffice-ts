import {
  DocumentData,
  orderBy,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";

import { IPayment, IPaymentFirebase } from "@/domain/entities";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const PaymentsCollection = (uid: string) => {
  return uid
    ? createCollectionRef<IPaymentFirebase>(`users/${uid}/payments`)
    : null;
};

export const PaymentsService = (uid: string | undefined) => {
  if (!uid) return null;

  const collection = PaymentsCollection(uid);
  if (!collection) return null;

  const paymentsService = new DatabaseService<IPaymentFirebase>(collection);

  paymentsService.query = query(
    collection.withConverter({
      toFirestore({ createdAt, ...rest }: PartialWithFieldValue<IPayment>): DocumentData {
        return {
          ...rest,
          createdAt: createdAt
            ? Timestamp.fromDate(new Date(createdAt as string))
            : Timestamp.now(),
        } as DocumentData;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IPaymentFirebase>,
        options: SnapshotOptions,
      ): IPayment {
        const data = snapshot.data(options);
        return {
          id: snapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate().toISOString() || "",
        };
      },
    }),
    orderBy("createdAt", "desc"),
  );

  return paymentsService;
};
