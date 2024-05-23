import { IFinance } from '@/domain/entities'
import { firestoreApi } from '../firestoreApi'
import { FinancesService } from '@/app/services/FinancesService'
import { createSelector } from '@reduxjs/toolkit'

type args = {
  uid: string
  customerId: string
}

export const financesSlice = firestoreApi
  .enhanceEndpoints({
    addTagTypes: ['Finances'],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      fetchFinances: builder.query<IFinance[], args>({
        providesTags: ['Finances'],
        keepUnusedDataFor: 3600,
        queryFn: async ({ uid, customerId }) => {
          if (!uid || !customerId) return { error: 'Args not provided' }

          try {
            const querySnapshot = await FinancesService(
              uid,
              customerId,
            )?.getAllOnce()
            const finances: IFinance[] = []

            querySnapshot?.forEach((doc) => {
              finances.push({
                id: doc.id,
                ...doc.data(),
              })
            })

            return {
              data: finances,
            }
          } catch (err) {
            return { error: err }
          }
        },
      }),
    }),
  })

export const { useFetchFinancesQuery } = financesSlice

export const selectFinances = (uid: string, customerId: string) =>
  createSelector(
    financesSlice.endpoints.fetchFinances.select({ uid, customerId }),
    ({ data: finances }) => (finances ? finances[0] : undefined),
  )
