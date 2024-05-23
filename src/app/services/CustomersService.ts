import { ICustomer, ICustomerFirebase } from '@/domain/entities'
import { DatabaseService, createCollection } from './DatabaseService'
import {
  query,
  DocumentData,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
  orderBy,
} from 'firebase/firestore'
import { dateInString } from '@/lib/utils'

const CustomersCollection = (uid: string | undefined) => {
  return uid
    ? createCollection<ICustomerFirebase>('users/' + uid + '/customers')
    : null
}

export const CustomersService = (uid: string | undefined) => {
  const collection = CustomersCollection(uid)
  if (!collection) return

  const customerService = new DatabaseService<ICustomerFirebase>(collection)

  customerService.query = query(
    collection.withConverter({
      toFirestore({
        id,
        ...data
      }: PartialWithFieldValue<ICustomer>): DocumentData {
        return data
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<ICustomerFirebase>,
        options: SnapshotOptions,
      ): ICustomer {
        const data = snapshot.data(options)
        return {
          id: snapshot.id,
          ...data,
          birthday: dateInString(data.birthday),
          createdAt: dateInString(data.createdAt),
        }
      },
    }),
    orderBy('name', 'asc'),
  )

  return customerService
}

// interface Backpack<Type> {
//   add: (obj: Type) => void;
//   get: () => Type;
// }

// This line is a shortcut to tell TypeScript there is a
// constant called `backpack`, and to not worry about where it came from.
// declare const backpack: Backpack<string>;

// object is a string, because we declared it above as the variable part of Backpack.
// const object = backpack.get();

// Since the backpack variable is a string, you can't pass a number to the add function.
// backpack.add(23);
