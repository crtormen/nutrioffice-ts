import {
  DocumentData,
  orderBy,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";

import { IInstallment, IInstallmentFirebase } from "@/domain/entities";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const InstallmentsCollection = (uid: string) => {
  return uid
    ? createCollectionRef<IInstallmentFirebase>(`users/${uid}/installments`)
    : null;
};

export const InstallmentsService = (uid: string | undefined) => {
  if (!uid) return null;

  const collection = InstallmentsCollection(uid);
  if (!collection) return null;

  const installmentsService = new DatabaseService<IInstallmentFirebase>(collection);

  installmentsService.query = query(
    collection.withConverter({
      toFirestore({ dueDate, paidDate, ...rest }: PartialWithFieldValue<IInstallment>): DocumentData {
        const firebaseData: any = {
          ...rest,
          dueDate: dueDate
            ? Timestamp.fromDate(new Date(dueDate as string))
            : Timestamp.now(),
        };

        // Convert paidDate if it exists
        if (paidDate) {
          firebaseData.paidDate = Timestamp.fromDate(new Date(paidDate as string));
        }

        return firebaseData as DocumentData;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IInstallmentFirebase>,
        options: SnapshotOptions,
      ): IInstallment {
        const data = snapshot.data(options);
        return {
          id: snapshot.id,
          ...data,
          dueDate: data.dueDate?.toDate().toISOString() || "",
          paidDate: data.paidDate?.toDate().toISOString(),
        };
      },
    }),
    orderBy("dueDate", "asc"),
  );

  return installmentsService;
};
