import {
  DocumentData,
  orderBy,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import { ILead, ILeadFirebase } from "@/domain/entities";
import { dateInString } from "@/lib/utils";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const LeadsCollection = (uid: string) => {
  return uid
    ? createCollectionRef<ILeadFirebase>("users/" + uid + "/leads")
    : null;
};

export const LeadsService = (uid: string | undefined) => {
  if (!uid) return;
  const collection = LeadsCollection(uid);
  if (!collection) return;

  const leadsService = new DatabaseService<ILeadFirebase>(collection);

  leadsService.query = query(
    collection.withConverter({
      toFirestore({ ...data }: PartialWithFieldValue<ILead>): DocumentData {
        return data;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<ILeadFirebase>,
        options: SnapshotOptions,
      ): ILead {
        const data = snapshot.data(options);
        return {
          id: snapshot.id,
          ...data,
          convertedAt: dateInString(data.convertedAt),
          lastPurchaseDate: dateInString(data.lastPurchaseDate),
          lastAppointmentDate: dateInString(data.lastAppointmentDate),
          createdAt: dateInString(data.createdAt) ?? "",
          updatedAt: dateInString(data.updatedAt) ?? "",
        };
      },
    }),
    orderBy("createdAt", "desc"),
  );

  return leadsService;
};
