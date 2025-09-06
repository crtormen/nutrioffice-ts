import {
  DocumentData,
  orderBy,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import { ICustomer, ICustomerFirebase } from "@/domain/entities";
import { dateInString } from "@/lib/utils";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const CustomersCollection = (uid: string) => {
  return uid
    ? createCollectionRef<ICustomerFirebase>("users/" + uid + "/customers")
    : null;
};

export const CustomersService = (uid: string | undefined) => {
  if (!uid) return;
  const collection = CustomersCollection(uid);
  if (!collection) return;

  const customerService = new DatabaseService<ICustomerFirebase>(collection);

  customerService.query = query(
    collection.withConverter({
      toFirestore({ ...data }: PartialWithFieldValue<ICustomer>): DocumentData {
        return data;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<ICustomerFirebase>,
        options: SnapshotOptions,
      ): ICustomer {
        const data = snapshot.data(options);
        return {
          id: snapshot.id,
          ...data,
          birthday: dateInString(data.birthday),
          createdAt: dateInString(data.createdAt),
        };
      },
    }),
    orderBy("name", "asc"),
  );

  return customerService;
};
