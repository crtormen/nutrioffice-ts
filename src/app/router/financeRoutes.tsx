import React, { Suspense } from "react";
import { Route } from "react-router-dom";

import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";

import { LoadingFallback } from "./LoadingFallback";
import { ROUTE_PATHS } from "./routes";

const FinancesPage = React.lazy(() => import("@/pages/finances/FinancesPage"));
const FinanceDetailsPage = React.lazy(
  () => import("@/pages/finances/FinanceDetailsPage"),
);

export const FinanceRoutes = (
  <Route path={ROUTE_PATHS.FINANCES.BASE}>
    <Route
      index
      element={
        <RequireAuthLayout allowedRoles={["PROFESSIONAL", "ADMIN"]}>
          <Suspense fallback={<LoadingFallback />}>
            <FinancesPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path={`${ROUTE_PATHS.FINANCES.DETAILS_BASE}/:financeId`}
      element={
        <RequireAuthLayout allowedRoles={["PROFESSIONAL", "ADMIN"]}>
          <Suspense fallback={<LoadingFallback />}>
            <FinanceDetailsPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
  </Route>
);
