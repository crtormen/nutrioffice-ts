import { useEffect, useState } from 'react'
import { ConsultaData } from '../columns'
import { useAuth } from '@/infra/firebase'
import { useFetchConsultasQuery } from '@/app/state/features/consultasSlice'
import { IConsulta } from '@/domain/entities'

const setTableData = (
  data: IConsulta[] | undefined,
): ConsultaData[] | undefined => {
  if (!data) return undefined

  return data.map((record, i) => ({
    id: record.id,
    date: record.date,
    index: data.length - i,
  }))
}

export const useFillCustomerConsultaTable = (customerId: string) => {
  const [consultas, setConsultas] = useState<ConsultaData[] | undefined>([])
  const auth = useAuth()
  const uid = auth.user?.uid
  if (!uid)
    return {
      consultas: [],
      data: [],
      isLoading: false,
      isSuccess: false,
      isError: true,
      error: 'UID not provided',
    }

  const { data, isLoading, isSuccess, isError, error } = useFetchConsultasQuery(
    { uid, customerId },
  )

  useEffect(() => {
    const consultasData = setTableData(data)
    setConsultas(consultasData)
  }, [data])

  return { consultas, data, isLoading, isSuccess, isError, error }
}
