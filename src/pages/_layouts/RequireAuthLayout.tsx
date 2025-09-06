import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useFetchSettingsQuery } from "@/app/state/features/settingsSlice";
import { useAuth } from "@/infra/firebase/hooks";

import MainHeader from "./MainHeader";
import { MainNav } from "./MainNav";

interface AuthProps {
  // isAllowed: boolean,
  // redirectPath: string,
  children?: ReactNode;
}

const RequireAuthLayout = ({ children }: AuthProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  // Load default settings from DB
  useFetchSettingsQuery(user?.uid);

  if (loading)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <Loader2 className="size-12 animate-spin text-zinc-500" />
        <div className="font-semibold">Carregando...</div>
      </div>
    );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    children || (
      <div className="flex-col space-y-8 py-6">
        <MainHeader />
        <main className="mx-auto max-w-6xl flex-1 space-y-5">
          <MainNav className="mx-6" />
          <Outlet />
        </main>
      </div>
    )
  );
};

export default RequireAuthLayout;
