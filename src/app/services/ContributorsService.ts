import {
  DocumentData,
  orderBy,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";

import { IContributor, Abilities } from "@/domain/entities";
import { dateInString } from "@/lib/utils";

import { createCollectionRef, DatabaseService } from "./DatabaseService";

/**
 * Firestore interface for Contributor with Timestamp
 */
export interface IContributorFirebase {
  name: string;
  email: string;
  phone: string;
  roles: Abilities;
  permissions?: string[];
  addedAt?: Timestamp;
}

/**
 * Contributor with converted dates
 */
export interface IContributorWithId extends IContributor {
  id: string;
  addedAt?: string;
}

/**
 * Create contributors collection reference
 */
const ContributorsCollection = (uid: string) => {
  return uid
    ? createCollectionRef<IContributorFirebase>(
        `users/${uid}/contributors`
      )
    : null;
};

/**
 * Contributors Service
 * Manages contributors subcollection for a professional user
 *
 * Usage:
 * const service = ContributorsService(professionalUid);
 * service?.getAll((contributors) => { ... });
 */
export const ContributorsService = (uid: string | undefined) => {
  if (!uid) return null;

  const collection = ContributorsCollection(uid);
  if (!collection) return null;

  const contributorService = new DatabaseService<IContributorFirebase>(
    collection
  );

  // Set up query with converter
  contributorService.query = query(
    collection.withConverter({
      toFirestore({
        ...data
      }: PartialWithFieldValue<IContributorWithId>): DocumentData {
        // Remove id from data when writing to Firestore
        const { id, addedAt, ...firestoreData } = data;
        return firestoreData;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IContributorFirebase>,
        options: SnapshotOptions
      ): IContributorWithId {
        const data = snapshot.data(options);
        return {
          id: snapshot.id,
          ...data,
          addedAt: dateInString(data.addedAt),
        };
      },
    }),
    orderBy("name", "asc")
  );

  return contributorService;
};
