import {
  DocumentData,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import { IGoal, IGoalFirebase } from "@/domain/entities";
import { dateInString } from "@/lib/utils";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const GoalsCollection = (uid: string, customerId: string) => {
  return uid
    ? createCollectionRef<IGoalFirebase>(
        "users/" + uid + "/customers/" + customerId + "/goals",
      )
    : null;
};

export const GoalsService = (uid: string, customerId: string) => {
  if (!uid) return;
  const collection = GoalsCollection(uid, customerId);
  if (!collection) return;

  const goalsService = new DatabaseService<IGoalFirebase>(collection);

  goalsService.query = query(
    collection.withConverter({
      toFirestore({ ...data }: PartialWithFieldValue<IGoal>): DocumentData {
        return data;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IGoalFirebase>,
        options: SnapshotOptions,
      ): IGoal {
        const data = snapshot.data(options);

        return {
          ...data,
          id: snapshot.id,
          createdAt: dateInString(data.createdAt),
          endDate: dateInString(data.endDate),
        };
      },
    }),
  );
  return goalsService;
};
