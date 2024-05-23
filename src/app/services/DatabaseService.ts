/* eslint-disable accessor-pairs */
import { db } from '@/infra/firebase'
import { Unsubscribe } from 'firebase/auth'
import {
  addDoc,
  getDocs,
  deleteDoc,
  collection,
  getDoc,
  doc,
  DocumentData,
  onSnapshot,
  CollectionReference,
  QuerySnapshot,
  Query,
} from 'firebase/firestore'

export const createCollection = <T = DocumentData>(collectionPath: string) => {
  return collection(db, collectionPath) as CollectionReference<T>
}

export class DatabaseService<T> {
  readonly collection
  _query!: Query

  constructor(collectionRef: CollectionReference<T>, q?: Query) {
    this.collection = collectionRef
    if (q) this._query = q
  }

  set query(q: Query) {
    this._query = q
  }

  async getAllOnce(): Promise<QuerySnapshot<DocumentData>> {
    const querySnapshot = await getDocs(this._query)
    return querySnapshot
  }

  getAll(callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const unsubscribe = onSnapshot(this._query, callback)
    return unsubscribe
  }

  async addOne(data: T) {
    console.log(data)
    const docRef = await addDoc(this.collection, data)
    return docRef
  }

  async deleteOne(id: string) {
    await deleteDoc(doc(this.collection, id))
  }

  // async updateOne(id: string, data: UpdateData<T>) {
  //   await updateDoc(doc(this.collection, id), data);
  // }

  async getOne(id: string) {
    const docRef = doc(this.collection!, 'customer_id', id)
    const snapshot = await getDoc(docRef)

    if (!snapshot.exists()) return

    return snapshot.data()
  }
}
// getAll(
//   callback: (snapshot: QuerySnapshot) => void,
//   converter?: FirestoreDataConverter<T>
// ): Unsubscribe {
//   const q = query(
//     this.collection.withConverter({
//       toFirestore({
//         id,
//         ...data
//       }: PartialWithFieldValue<ICustomer>): DocumentData {
//         return data;
//       },
//       fromFirestore(
//         snapshot: QueryDocumentSnapshot<ICustomerFirebase>,
//         options: SnapshotOptions
//       ): ICustomer {
//         const data = snapshot.data(options);
//         return {
//           id: snapshot.id,
//           ...data,
//           birthday: dateInString(data.birthday),
//           createdAt: dateInString(data.createdAt),
//         };
//       },
//     })
//   );
// const q = converter
//   ? query(this.collection.withConverter(converter))
//   : query(this.collection);

//   const unsubscribe = onSnapshot(q, callback);
//   return unsubscribe;
// }
