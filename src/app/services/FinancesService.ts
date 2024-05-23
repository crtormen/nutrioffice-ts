import { IFinance, IFinanceFirebase, IPayment } from '@/domain/entities'
import { DatabaseService, createCollection } from './DatabaseService'
import {
  query,
  DocumentData,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore'
import { dateInString } from '@/lib/utils'

const FinancesCollection = (uid: string, customerId: string) => {
  return uid
    ? createCollection<IFinanceFirebase>(
        'users/' + uid + '/customers/' + customerId + '/finances',
      )
    : null
}

export const FinancesService = (uid: string, customerId: string) => {
  const collection = FinancesCollection(uid, customerId)
  if (!collection) return

  const financesService = new DatabaseService<IFinanceFirebase, IFinance>(
    collection,
  )

  financesService.query = query(
    collection.withConverter({
      toFirestore({
        id,
        ...data
      }: PartialWithFieldValue<IFinance>): DocumentData {
        return data
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IFinanceFirebase>,
        options: SnapshotOptions,
      ): IFinance {
        const data = snapshot.data(options)
        const payments: IPayment[] | undefined = data.payments
          ? data.payments.map((payment) => ({
              ...payment,
              createdAt: dateInString(payment.createdAt),
            }))
          : undefined
        const returnData = {
          id: snapshot.id,
          ...data,
          createdAt: dateInString(data.createdAt),
          payments,
        }
        return returnData
      },
    }),
  )
  return financesService
}
