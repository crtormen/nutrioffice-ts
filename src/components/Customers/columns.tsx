import { EntityId } from '@reduxjs/toolkit'
import { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type CustomerData = {
  id: EntityId
  name: string | undefined
  email: string | undefined
  credits: number | undefined
}

export const columns: ColumnDef<CustomerData>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <div className="text-right flex">
            Nome
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        </Button>
      )
    },
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div className="text-left font-medium">
          <Link to={`/customers/${customer.id}`}>{row.getValue('name')}</Link>
        </div>
      )
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const customer = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(customer.id.toString())
              }
            >
              Copiar ID do cliente
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
            <DropdownMenuItem>Ver Pagamentos</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
