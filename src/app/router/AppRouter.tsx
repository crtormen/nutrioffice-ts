import React from "react";
import { Route, Routes } from "react-router-dom";

import NotAuthLayout from "@/pages/_layouts/NotAuthLayout";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";
import NewAnamnesisPage from "@/pages/anamnesis/NewAnamnesisPage";
import CustomerDetailsPage from "@/pages/customers/CustomerDetailsPage";
import CustomersPage from "@/pages/customers/CustomersPage";
import NewCustomerPage from "@/pages/customers/NewCustomerPage";
import Dashboard from "@/pages/infra/DashboardPage";
import LoginPage from "@/pages/infra/LoginPage";
import NotFoundPage from "@/pages/infra/NotFoundPage";
import SignUpPage from "@/pages/infra/SignUpPage";
import AccountPage from "@/pages/users/AccountPage";

function App(): JSX.Element {
  return (
    <Routes>
      <Route
        path="/*"
        element={<RequireAuthLayout />}
        errorElement={<NotFoundPage />}
      >
        <Route index element={<Dashboard />} />
        <Route path="customers">
          <Route index element={<CustomersPage />} />
          <Route path=":id/*" element={<CustomerDetailsPage />} />
          <Route path="create" element={<NewCustomerPage />} />
        </Route>
        <Route path="anamnesis">
          <Route path="create" element={<NewAnamnesisPage />} />
        </Route>
        <Route path="user">
          <Route path="profile/*" element={<AccountPage />} />
        </Route>
      </Route>
      <Route
        path="/*"
        element={<NotAuthLayout />}
        errorElement={<NotFoundPage />}
      >
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignUpPage />} />
      </Route>
      {/* 
          unauthorized
          linkpage
          cadastropaciente
        */}
    </Routes>
  );
}

export default App;
