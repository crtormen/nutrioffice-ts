import React, { Suspense } from "react";
import { Route } from "react-router-dom";
import RequireAuthLayout from "@/pages/_layouts/RequireAuthLayout";
import { ROUTES } from "./routes";
import { LoadingFallback } from "./LoadingFallback";

const FinancesPage = React.lazy(
  () => import("@/pages/finances/FinancesPage"),
);
const FinanceDetailsPage = React.lazy(
  () => import("@/pages/finances/FinanceDetailsPage"),
);

export const FinanceRoutes = (
  <Route path={ROUTES.FINANCES.BASE}>
    <Route
      index
      element={
        <RequireAuthLayout allowedRoles={["PROFESSIONAL", "ADMIN"]}>
          <Suspense
            fallback={<LoadingFallback />}
          >
            <FinancesPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
    <Route
      path="finances/details/:financeId"
      element={
        <RequireAuthLayout allowedRoles={["PROFESSIONAL", "ADMIN"]}>
          <Suspense
            fallback={<LoadingFallback />}
          >
            <FinanceDetailsPage />
          </Suspense>
        </RequireAuthLayout>
      }
    />
  </Route>
);