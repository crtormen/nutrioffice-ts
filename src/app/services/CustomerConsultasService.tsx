import {
  DocumentData,
  orderBy,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import {
  ICustomerConsulta,
  ICustomerConsultaFirebase,
} from "@/domain/entities";
import { dateInString } from "@/lib/utils";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const CustomerConsultasCollection = (uid: string, customerId: string) => {
  return uid
    ? createCollectionRef<ICustomerConsultaFirebase>(
        "users/" + uid + "/customers/" + customerId + "/consultas",
      )
    : null;
};

export const CustomerConsultasService = (uid: string, customerId: string) => {
  const collection = CustomerConsultasCollection(uid, customerId);
  if (!collection) return;

  const customerConsultasService =
    new DatabaseService<ICustomerConsultaFirebase>(collection);

  customerConsultasService.query = query(
    collection.withConverter({
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
          ...data,
          id: snapshot.id,
          date: dateInString(data.date),
          createdAt: dateInString(data.createdAt),
          peso: data.peso?.toString(),
        };
      },
    }),
    orderBy("date", "desc"),
  );
  return customerConsultasService;
};
