import { IGoal, IGoalFirebase, IPayment } from "@/domain/entities";
import { DatabaseService, createCollection } from "./DatabaseService";
import {
  query,
  DocumentData,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import { dateInString } from "@/lib/utils";

const GoalsCollection = (uid: string, customerId: string) => {
  return uid
    ? createCollection<IGoalFirebase>(
        "users/" + uid + "/customers/" + customerId + "/goals"
      )
    : null;
};

export const GoalsService = (uid: string, customerId: string) => {
  const collection = GoalsCollection(uid, customerId);
  if (!collection) return;

  const goalsService = new DatabaseService<IGoalFirebase, IGoal>(collection);

  goalsService.query = query(
    collection.withConverter({
      toFirestore({ id, ...data }: PartialWithFieldValue<IGoal>): DocumentData {
        return data;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IGoalFirebase>,
        options: SnapshotOptions
      ): IGoal {
        const data = snapshot.data(options);

        return {
          ...data,
          id: snapshot.id,
          createdAt: dateInString(data.createdAt),
          endDate: dateInString(data.endDate),
        };
      },
    })
  );
  return goalsService;
};
