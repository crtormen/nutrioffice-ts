import {
  DocumentData,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import { IUser } from "@/domain/entities";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const UserCollection = (uid: string | undefined) => {
  return uid
    ? createCollectionRef<IUser>("users/" + uid)
    : createCollectionRef<IUser>("users");
};

export const UserService = (uid?: string) => {
  const collection = UserCollection(uid);
  if (!collection) return;

  const userService = new DatabaseService<IUser>(collection);

  userService.query = query(
    collection.withConverter({
      toFirestore({ ...data }: PartialWithFieldValue<IUser>): DocumentData {
        return data;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IUser>,
        options: SnapshotOptions,
      ): IUser {
        const data = snapshot.data(options);
        return {
          id: snapshot.id,
          ...data,
        };
      },
    }),
  );

  return userService;
};
