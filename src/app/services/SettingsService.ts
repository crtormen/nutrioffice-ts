import {
  DocumentData,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import { ISettings } from "@/domain/entities";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

const SettingsCollection = (uid: string | undefined) => {
  return uid
    ? createCollectionRef<ISettings>("users/" + uid + "/settings")
    : null;
};

export const SettingsService = (uid: string | undefined) => {
  const collection = SettingsCollection(uid);
  if (!collection) return;

  const settingService = new DatabaseService<ISettings>(collection);

  settingService.query = query(
    collection.withConverter({
      toFirestore({ ...data }: PartialWithFieldValue<ISettings>): DocumentData {
        return {
          ...data,
          name: undefined,
        };
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<ISettings>,
        snapshotOptions: SnapshotOptions,
      ): ISettings {
        const data = snapshot.data(snapshotOptions);
        // const name = snapshot.id;
        return {
          ...data,
          // default:
          // name,
        };
      },
    }),
  );

  return settingService;
};
