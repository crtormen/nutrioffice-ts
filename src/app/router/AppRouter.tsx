import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import NotAuthLayout from "@/pages/_layouts/NotAuthLayout";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";
import { ChartsDemo } from "@/pages/demo/ChartsDemo";

import { ChunkErrorBoundary } from "./ChunkErrorBoundary";
import { ConsultaRoutes } from "./consultaRoutes";
import { CrmRoutes } from "./crmRoutes";
import { CustomerRoutes } from "./customerRoutes";
import { FinanceRoutes } from "./financeRoutes";
import { lazyWithReload, LoadingFallback } from "./LoadingFallback";
import { ROUTE_PATHS, ROUTES } from "./routes";

const Dashboard = lazyWithReload(() => import("@/pages/infra/DashboardPage"));
const LoginPage = lazyWithReload(() => import("@/pages/infra/LoginPage"));
const NotFoundPage = lazyWithReload(() => import("@/pages/infra/NotFoundPage"));
const SignUpPage = lazyWithReload(() => import("@/pages/infra/SignUpPage"));

const AcceptInvitationPage = lazyWithReload(
  () => import("@/pages/auth/AcceptInvitationPage"),
);
const AccountPage = lazyWithReload(() => import("@/pages/user/AccountPage"));
const SettingsPage = lazyWithReload(() => import("@/pages/user/SettingsPage"));
const PricingPage = lazyWithReload(
  () => import("@/pages/subscription/PricingPage"),
);
const ProcessingSubscriptionPage = lazyWithReload(
  () => import("@/pages/subscription/ProcessingSubscriptionPage"),
);
const SubscriptionCallbackPage = lazyWithReload(
  () => import("@/pages/subscription/SubscriptionCallbackPage"),
);
const SubscriptionManagementPage = lazyWithReload(
  () => import("@/pages/subscription/SubscriptionManagementPage"),
);
const PublicAnamnesisFormPage = lazyWithReload(
  () => import("@/pages/public/PublicAnamnesisFormPage"),
);
const FormSubmissionsPage = lazyWithReload(
  () => import("@/pages/submissions/FormSubmissionsPage"),
);
const ChatwootPage = lazyWithReload(
  () =>
    import("@/pages/chatwoot/ChatwootPage").then((m) => ({
      default: m.ChatwootPage,
    })),
);

function App(): JSX.Element {
  return (
    <ChunkErrorBoundary>
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
            <RequireAuthLayout allowedRoles={["PROFESSIONAL", "NUTRI", "ADMIN"]}>
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            </RequireAuthLayout>
          }
        />
        {CustomerRoutes}
        {ConsultaRoutes}
        {FinanceRoutes}
        {CrmRoutes}
        <Route
          path={ROUTE_PATHS.CHATWOOT}
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ChatwootPage />
            </Suspense>
          }
        />
        <Route
          path={ROUTE_PATHS.FORM_SUBMISSIONS}
          element={
            <RequireAuthLayout allowedRoles={["PROFESSIONAL", "NUTRI", "ADMIN"]}>
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
    </ChunkErrorBoundary>
  );
}

export default App;
