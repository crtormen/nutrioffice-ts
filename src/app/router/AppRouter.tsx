import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import NotAuthLayout from "@/pages/_layouts/NotAuthLayout";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";
import { ChartsDemo } from "@/pages/demo/ChartsDemo";

import { ConsultaRoutes } from "./consultaRoutes";
import { CustomerRoutes } from "./customerRoutes";
import { FinanceRoutes } from "./financeRoutes";
import { LoadingFallback } from "./LoadingFallback";
import { ROUTE_PATHS, ROUTES } from "./routes";

const Dashboard = React.lazy(() => import("@/pages/infra/DashboardPage"));
const LoginPage = React.lazy(() => import("@/pages/infra/LoginPage"));
const NotFoundPage = React.lazy(() => import("@/pages/infra/NotFoundPage"));
const SignUpPage = React.lazy(() => import("@/pages/infra/SignUpPage"));

const AcceptInvitationPage = React.lazy(
  () => import("@/pages/auth/AcceptInvitationPage"),
);
const AccountPage = React.lazy(() => import("@/pages/user/AccountPage"));
const SettingsPage = React.lazy(() => import("@/pages/user/SettingsPage"));
const PricingPage = React.lazy(
  () => import("@/pages/subscription/PricingPage"),
);
const ProcessingSubscriptionPage = React.lazy(
  () => import("@/pages/subscription/ProcessingSubscriptionPage"),
);
const SubscriptionCallbackPage = React.lazy(
  () => import("@/pages/subscription/SubscriptionCallbackPage"),
);
const SubscriptionManagementPage = React.lazy(
  () => import("@/pages/subscription/SubscriptionManagementPage"),
);
const PublicAnamnesisFormPage = React.lazy(
  () => import("@/pages/public/PublicAnamnesisFormPage"),
);
const FormSubmissionsPage = React.lazy(
  () => import("@/pages/submissions/FormSubmissionsPage"),
);

function App(): JSX.Element {
  return (
    <Routes>
      <Route
        path="/*"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <RequireAuthLayout />
          </Suspense>
        }
        errorElement={<NotFoundPage />}
      >
        <Route
          index
          element={
            <RequireAuthLayout allowedRoles={["PROFESSIONAL", "ADMIN"]}>
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            </RequireAuthLayout>
          }
        />
        {CustomerRoutes}
        {ConsultaRoutes}
        {FinanceRoutes}
        <Route
          path={ROUTE_PATHS.FORM_SUBMISSIONS}
          element={
            <RequireAuthLayout allowedRoles={["PROFESSIONAL", "ADMIN"]}>
              <Suspense fallback={<LoadingFallback />}>
                <FormSubmissionsPage />
              </Suspense>
            </RequireAuthLayout>
          }
        />
        <Route path={ROUTE_PATHS.USER.BASE}>
          <Route
            path={`${ROUTE_PATHS.USER.PROFILE}/*`}
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AccountPage />
              </Suspense>
            }
          />
          <Route
            path={`${ROUTE_PATHS.USER.SETTINGS}/*`}
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>
        <Route
          path={ROUTE_PATHS.SUBSCRIPTION.MANAGE}
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SubscriptionManagementPage />
            </Suspense>
          }
        />
      </Route>

      {/* Subscription routes - standalone without layout */}
      <Route
        path={ROUTES.SUBSCRIPTION.PRICING}
        element={
          <Suspense fallback={<LoadingFallback />}>
            <PricingPage />
          </Suspense>
        }
      />
      <Route
        path={ROUTES.SUBSCRIPTION.PROCESSING}
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ProcessingSubscriptionPage />
          </Suspense>
        }
      />
      <Route
        path={ROUTES.SUBSCRIPTION.CALLBACK}
        element={
          <Suspense fallback={<LoadingFallback />}>
            <SubscriptionCallbackPage />
          </Suspense>
        }
      />

      {/* Public anamnesis form route - no auth required */}
      <Route
        path="/anamnesis/public/:token"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <PublicAnamnesisFormPage />
          </Suspense>
        }
      />

      <Route
        path="/*"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <NotAuthLayout />
          </Suspense>
        }
        errorElement={<NotFoundPage />}
      >
        <Route path="demo" element={<ChartsDemo />} />
        <Route
          path="login"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="signup"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SignUpPage />
            </Suspense>
          }
        />
        <Route
          path="accept-invitation"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AcceptInvitationPage />
            </Suspense>
          }
        />
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
