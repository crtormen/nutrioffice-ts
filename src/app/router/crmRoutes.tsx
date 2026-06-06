import { Suspense } from "react";
import { Route } from "react-router-dom";

import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";

import { lazyWithReload, LoadingFallback } from "./LoadingFallback";
import { ROUTE_PATHS } from "./routes";

const CrmPage = lazyWithReload(() => import("@/pages/crm/CrmPage"));
const LeadDetailsPage = lazyWithReload(() => import("@/pages/crm/LeadDetailsPage"));
const CrmSettingsPage = lazyWithReload(() => import("@/pages/crm/CrmSettingsPage"));

export const CrmRoutes = (
  <Route path={ROUTE_PATHS.CRM.BASE}>
    <Route
      index
      element={
        <RequireAuthLayout allowedRoles={["PROFESSIONAL", "NUTRI", "ADMIN"]}>
          <Suspense fallback={<LoadingFallback />}>
            <CrmPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path={`${ROUTE_PATHS.CRM.LEAD_DETAILS}/:leadId`}
      element={
        <RequireAuthLayout allowedRoles={["PROFESSIONAL", "NUTRI", "ADMIN"]}>
          <Suspense fallback={<LoadingFallback />}>
            <LeadDetailsPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path={ROUTE_PATHS.CRM.SETTINGS}
      element={
        <RequireAuthLayout allowedRoles={["PROFESSIONAL", "NUTRI", "ADMIN"]}>
          <Suspense fallback={<LoadingFallback />}>
            <CrmSettingsPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
  </Route>
);
