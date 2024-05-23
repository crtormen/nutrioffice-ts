import { ReactNode } from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/infra/firebase/hooks";
import MainHeader from "./MainHeader";
import { MainNav } from "./MainNav";
import { Loader2 } from "lucide-react";

interface AuthProps {
  // isAllowed: boolean,
  // redirectPath: string,
  children?: ReactNode;
}

const RequireAuthLayout = ({ children }: AuthProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <Loader2 className="size-12 animate-spin text-zinc-500 items-center align-middle mx-auto" />
    );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return children ? (
    children
  ) : (
    <div className="py-6 space-y-8 flex-col">
      <MainHeader />
      <main className="flex-1 max-w-6xl mx-auto space-y-5">
        <MainNav className="mx-6" />
        <Outlet />
      </main>
    </div>
  );
};

export default RequireAuthLayout;
