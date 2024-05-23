import { useFillCustomerTable } from './hooks'
import { columns } from './columns'
import { DataTable } from '@/components/ui/data-table'
import { Loader2 } from 'lucide-react'

const CustomersTable = () => {
  const {
    customers,
    result: { isLoading },
  } = useFillCustomerTable()

  return isLoading ? (
    <Loader2 className="size-8 animate-spin text-zinc-500 items-center mx-auto" />
  ) : (
    customers && (
      <DataTable
        columns={columns}
        data={customers}
        filterField="name"
        filterPlaceholder="nome"
      />
    )
  )
}
export default CustomersTable
