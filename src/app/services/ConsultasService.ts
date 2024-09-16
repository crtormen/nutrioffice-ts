import {
  DocumentData,
  orderBy,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import { IConsulta, IConsultaFirebase } from "@/domain/entities";
import { dateInString } from "@/lib/utils";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const ConsultasCollection = (uid: string) => {
  return uid
    ? createCollectionRef<IConsultaFirebase>("users/" + uid + "/consultas")
    : null;
};

export const ConsultasService = (uid: string | undefined) => {
  if (!uid) return;
  const collection = ConsultasCollection(uid);
  if (!collection) return;

  const consultasService = new DatabaseService<IConsultaFirebase>(collection);

  consultasService.query = query(
    collection.withConverter({
      toFirestore({ ...data }: PartialWithFieldValue<IConsulta>): DocumentData {
        return data;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IConsultaFirebase>,
        options: SnapshotOptions,
      ): IConsulta {
        const data = snapshot.data(options);
        return {
          id: snapshot.id,
          ...data,
          createdAt: dateInString(data.createdAt),
          date: dateInString(data.date),
          peso: data.peso?.toString(),
        };
      },
    }),
    orderBy("date", "desc"),
  );
  return consultasService;
};
