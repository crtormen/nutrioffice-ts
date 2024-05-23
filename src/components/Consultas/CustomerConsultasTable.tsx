import { useFillCustomerConsultaTable } from '@/components/Consultas/hooks'
import { columns } from './columns'
import { DataTable } from '@/components/ui/data-table'
import { Loader2 } from 'lucide-react'

export const CustomerConsultasTable = (customerId: string) => {
  const { consultas, isLoading } = useFillCustomerConsultaTable(customerId)

  return isLoading ? (
    <Loader2 className="size-8 animate-spin text-zinc-500 items-center mx-auto" />
  ) : (
    consultas && <DataTable columns={columns} data={consultas} />
  )
}
