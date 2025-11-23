import React from "react";
import { Route } from "react-router-dom";
const CustomersPage = React.lazy(() => import("@/pages/customers/CustomersPage"));
const CustomerDetailsPage = React.lazy(() => import("@/pages/customers/CustomerDetailsPage"));
const NewCustomerPage = React.lazy(() => import("@/pages/customers/NewCustomerPage"));
import { ROUTES } from "./routes";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";
 
export const CustomerRoutes = (
  <Route path={ROUTES.CUSTOMERS.BASE}>
    <Route index element={
      <RequireAuthLayout allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}>
        <CustomersPage />
      </RequireAuthLayout>
    }/>
    <Route path=":customerId/*" element={
      <RequireAuthLayout allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}>      
        <CustomerDetailsPage />
      </RequireAuthLayout>
    }/>
    <Route path="create" element={
      <RequireAuthLayout allowedRoles={["PROFESSIONAL", "SECRETARY", "ADMIN"]}>
        <NewCustomerPage />
      </RequireAuthLayout>
    }/>
  </Route>
);