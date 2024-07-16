import { Loader2 } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { UserAuthForm } from "@/components/User/UserAuthForm";
import { useAuth } from "@/infra/firebase";

const LoginPage = () => {
  const { loading, user } = useAuth();
  const { state } = useLocation();

  const from = state?.from?.pathname || "/";

  if (loading)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <Loader2 className="size-12 animate-spin text-zinc-500" />
        <div className="font-semibold">Aguardando login...</div>
      </div>
    );

  return user ? (
    <Navigate to={from} replace={true} />
  ) : (
    <div className="lg:p-8">
      <Button
        variant="outline"
        asChild
        className="absolute right-8 top-8 text-primary"
      >
        <Link to="/signup">Ainda não tem cadastro? Crie um agora!</Link>
      </Button>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Acessar Painel
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe todas as informações da sua clínica.
          </p>
        </div>
        <UserAuthForm />
      </div>
    </div>
  );
};

export default LoginPage;
