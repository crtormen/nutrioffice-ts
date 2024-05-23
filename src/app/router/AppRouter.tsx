import React from 'react'
import { Routes, Route } from 'react-router-dom'
import RequireAuthLayout from '@/components/Layout/ShadcnLayout/RequireAuthLayout'
import LoginPage from '@/pages/infra/LoginPage'
import Dashboard from '@/pages/infra/DashboardPage'
import CustomersPage from '@/pages/customers/CustomersPage'
import CustomerDetailsPage from '@/pages/customers/CustomerDetailsPage'
import NotFoundPage from '@/pages/infra/NotFoundPage'
import NewCustomerPage from '@/pages/customers/NewCustomerPage'

function App(): JSX.Element {
  return (
    <Routes>
      <Route
        path="/"
        element={<RequireAuthLayout />}
        errorElement={<NotFoundPage />}
      >
        <Route index element={<Dashboard />} />
        <Route path="customers">
          <Route index element={<CustomersPage />} />
          <Route path=":id/*" element={<CustomerDetailsPage />} />
          <Route path="create" element={<NewCustomerPage />} />
        </Route>
        {/* <Route path="customer">
        </Route> */}
        {/* protect:
          home
          admin
          consultas
          finances
          anamnese
          newpaciente
        */}
      </Route>
      <Route path="/login" element={<LoginPage />} />
      {/* <Route path="*" element={<NotFoundPage />} /> */}
      {/* login
          register
          unauthorized
          linkpage
          cadastropaciente
          
        */}
    </Routes>
  )
}

export default App
