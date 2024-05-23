import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/infra/firebase";
import { UserAuthForm } from "@/components/Layout/ShadcnLayout/UserAuthForm";

const LoginPage = () => {
  const auth = useAuth();

  if (auth.loading)
    return (
      <Loader2 className="size-12 animate-spin text-zinc-500 items-center align-middle mx-auto" />
    );

  return auth.user ? (
    <Navigate to="/" />
  ) : (
    <div className="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Faça seu Login
            </h1>
            <UserAuthForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
