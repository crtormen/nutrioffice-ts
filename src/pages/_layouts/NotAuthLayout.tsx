import { Loader2, SquareActivity } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/infra/firebase";

const NotAuthLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <Loader2 className="size-12 animate-spin text-zinc-500" />
        <div className="font-semibold">Carregando...</div>
      </div>
    );

  if (user) return <Navigate to="/" state={{ from: location }} replace />;

  return (
    <div className="grid min-h-screen grid-cols-2 antialiased">
      <div className="flex h-full flex-col justify-between border-r border-foreground/5 bg-muted p-10 text-muted-foreground">
        <div className="flex items-center gap-3 text-lg text-foreground">
          <SquareActivity className="h-5 w-5" />
          <span className="font-semibold">Nutri Office</span>
        </div>

        <footer className="text-sm">
          Painel do parceiro &copy; Nutri Office - {new Date().getFullYear()}
        </footer>
      </div>

      <div className="relative flex flex-col items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
};

export default NotAuthLayout;
