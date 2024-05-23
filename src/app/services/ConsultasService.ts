import { IConsulta, IConsultaFirebase } from '@/domain/entities'
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

const ConsultasCollection = (uid: string, customerId: string) => {
  return uid
    ? createCollection<IConsultaFirebase>(
        'users/' + uid + '/customers/' + customerId + '/consultas',
      )
    : null
}

export const ConsultasService = (uid: string, customerId: string) => {
  const collection = ConsultasCollection(uid, customerId)
  if (!collection) return

  const consultasService = new DatabaseService<IConsultaFirebase, IConsulta>(
    collection,
  )

  consultasService.query = query(
    collection.withConverter({
      toFirestore({ ...data }: PartialWithFieldValue<IConsulta>): DocumentData {
        return data
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IConsultaFirebase>,
        options: SnapshotOptions,
      ): IConsulta {
        const data = snapshot.data(options)
        return {
          id: snapshot.id,
          ...data,
          date: dateInString(data.date),
        }
      },
    }),
    orderBy('date', 'desc'),
  )
  return consultasService
}
