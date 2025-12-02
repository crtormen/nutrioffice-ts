import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import NotAuthLayout from "@/pages/_layouts/NotAuthLayout";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";
const Dashboard = React.lazy(() => import("@/pages/infra/DashboardPage"));
const LoginPage = React.lazy(() => import("@/pages/infra/LoginPage"));
const NotFoundPage = React.lazy(() => import("@/pages/infra/NotFoundPage"));
const SignUpPage = React.lazy(() => import("@/pages/infra/SignUpPage"));
const UnauthorizedPage = React.lazy(() => import("@/pages/infra/UnauthorizedPage"));
const AcceptInvitationPage = React.lazy(() => import("@/pages/auth/AcceptInvitationPage"));
const AccountPage = React.lazy(() => import("@/pages/user/AccountPage"));
const SettingsPage = React.lazy(() => import("@/pages/user/SettingsPage"));
const FinancesPage = React.lazy(() => import("@/pages/finances/FinancesPage"));
const PricingPage = React.lazy(() => import("@/pages/subscription/PricingPage"));
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
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
              <Dashboard />
            </Suspense>
          </RequireAuthLayout>
        }/>
        {CustomerRoutes}
        {ConsultaRoutes}
        <Route path={ROUTES.FINANCES.BASE} element={
          <RequireAuthLayout allowedRoles={["PROFESSIONAL", "ADMIN"]}>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
              <FinancesPage />
            </Suspense>
          </RequireAuthLayout>
        } />
        <Route path={ROUTES.USER.BASE}>
          <Route path="profile/*" element={
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
              <AccountPage />
            </Suspense>
          } />
          <Route path="settings/*" element={
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
              <SettingsPage />
            </Suspense>
          } />
        </Route>
        <Route path={ROUTES.SUBSCRIPTION.PRICING} element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <PricingPage />
          </Suspense>
        } />
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
        <Route path="login" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <LoginPage />
          </Suspense>
        } />
        <Route path="signup" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <SignUpPage />
          </Suspense>
        } />
        <Route path="accept-invitation" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <AcceptInvitationPage />
          </Suspense>
        } />
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
