import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useFetchSettingsQuery } from "@/app/state/features/settingsSlice";
import { useFetchUserQuery } from "@/app/state/features/userSlice";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/infra/firebase/hooks";

import MainHeader from "./MainHeader";
import { MainNav } from "./MainNav";

interface AuthProps {
  allowedRoles?: string[];
  // redirectPath: string,
  children?: ReactNode;
}

const RequireAuthLayout = ({ allowedRoles, children }: AuthProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { data: userProfile, isLoading: profileLoading } = useFetchUserQuery(
    user?.uid,
  );
  // Load default settings from DB
  useFetchSettingsQuery(user?.uid);

  const loading = authLoading || profileLoading;
  const isAuthenticated = !!user && !!userProfile && !profileLoading;

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated)
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;

  if (allowedRoles && userProfile) {
    const userHasRequiredRole =
      userProfile.roles && allowedRoles.includes(userProfile.roles.ability);
    if (!userHasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  return (
    children || (
      <div className="flex-col space-y-8 py-6">
        <MainHeader />
        <main className="mx-auto max-w-screen-xl flex-1 space-y-5">
          <MainNav className="mx-6" />
          <Outlet />
        </main>
      </div>
    )
  );
};

export default RequireAuthLayout;
