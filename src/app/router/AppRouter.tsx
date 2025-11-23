import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import NotAuthLayout from "@/pages/_layouts/NotAuthLayout";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";
const Dashboard = React.lazy(() => import("@/pages/infra/DashboardPage"));
const LoginPage = React.lazy(() => import("@/pages/infra/LoginPage"));
const NotFoundPage = React.lazy(() => import("@/pages/infra/NotFoundPage"));
const SignUpPage = React.lazy(() => import("@/pages/infra/SignUpPage"));
const UnauthorizedPage = React.lazy(() => import("@/pages/infra/UnauthorizedPage"));
const AccountPage = React.lazy(() => import("@/pages/user/AccountPage"));
const SettingsPage = React.lazy(() => import("@/pages/user/SettingsPage"));
const NewAnamnesisPage = React.lazy(() => import("@/pages/anamnesis/NewAnamnesisPage"));
import { CustomerRoutes } from "./customerRoutes";
import { ConsultaRoutes } from "./consultaRoutes";
import { ROUTES } from "./routes";
import { ChartsDemo } from "@/pages/demo/ChartsDemo";

function App(): JSX.Element {
  return (
    <Routes>
      <Route
        path="/*"
        element={
          <Suspense fallback={<div>Loading...</div>}> 
            <RequireAuthLayout />
          </Suspense>
        }
        errorElement={<NotFoundPage />}
      >
        <Route index element={
          <RequireAuthLayout allowedRoles={["PROFESSIONAL", "ADMIN"]}>
            <Dashboard />
          </RequireAuthLayout>
        }/>
        {CustomerRoutes}
        <Route path={ROUTES.ANAMNESIS.BASE}>
          <Route path="create" element={<NewAnamnesisPage />} />
        </Route>
        {ConsultaRoutes}
        <Route path={ROUTES.USER.BASE}>
          <Route path="profile/*" element={<AccountPage />} />
          <Route path="settings/*" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route
        path="/*"
        element={
          <Suspense fallback={<div>Loading...</div>}> 
            <NotAuthLayout />
          </Suspense>
        }
        errorElement={<NotFoundPage />}
      >
        <Route path="demo" element={<ChartsDemo />} />
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
