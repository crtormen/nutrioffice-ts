import React from "react";
import { Route, Routes } from "react-router-dom";

import { ConsultaProvider } from "@/components/Consultas/context/ConsultaContext";
import NotAuthLayout from "@/pages/_layouts/NotAuthLayout";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";
import NewAnamnesisPage from "@/pages/anamnesis/NewAnamnesisPage";
import ConsultasPage from "@/pages/consultas/ConsultasPage";
import NewConsultaPage from "@/pages/consultas/NewConsultaPage";
import CustomerDetailsPage from "@/pages/customers/CustomerDetailsPage";
import CustomersPage from "@/pages/customers/CustomersPage";
import NewCustomerPage from "@/pages/customers/NewCustomerPage";
import Dashboard from "@/pages/infra/DashboardPage";
import LoginPage from "@/pages/infra/LoginPage";
import NotFoundPage from "@/pages/infra/NotFoundPage";
import SignUpPage from "@/pages/infra/SignUpPage";
import AccountPage from "@/pages/user/AccountPage";
import SettingsPage from "@/pages/user/SettingsPage";

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
          <Route path=":customerId/*" element={<CustomerDetailsPage />} />
          <Route path="create" element={<NewCustomerPage />} />
        </Route>
        <Route path="anamnesis">
          <Route path="create" element={<NewAnamnesisPage />} />
        </Route>
        <Route path="consultas">
          <Route index element={<ConsultasPage />} />
          <Route
            path=":customerId/create"
            element={
              <ConsultaProvider>
                <NewConsultaPage />
              </ConsultaProvider>
            }
          />
          {/* <Route path=":customerId/*" element={<CustomerConsultaPage />} /> */}
        </Route>
        <Route path="user">
          <Route path="profile/*" element={<AccountPage />} />
          <Route path="settings/*" element={<SettingsPage />} />
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
