import React from 'react'
import CustomersTable from '@/components/Customers/CustomersTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CustomersPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
            <Button
              className="inline-flex items-center gap-1.5 text-xs bg-primary text-white rounded-full px-1.5 py-1"
              onClick={() => navigate('create')}
            >
              <Plus className="size-3" />
              Novo Cliente
            </Button>
          </div>
          <p className="text-muted-foreground">Lista de clientes</p>
        </div>
      </div>
      <div className="container mx-auto py-10">
        <CustomersTable />
      </div>
    </div>
  )
}

export default CustomersPage
