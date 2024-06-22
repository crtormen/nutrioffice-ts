import { zodResolver } from "@hookform/resolvers/zod";
import { AuthError } from "firebase/auth";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/infra/firebase";
import { generateFirebaseAuthError } from "@/infra/firebase/generateFirebaseAuthErrors";

const loginForm = z.object({
  email: z
    .string()
    .min(1, "Forneça um endereço de email")
    .email({ message: "Endereço de email inválido" }),
  password: z
    .string()
    .min(1, "Forneça uma senha")
    .min(8, { message: "A senha deve conter no mínimo 8 caracteres" }),
});

type LoginForm = z.infer<typeof loginForm>;

// interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginForm),
  });

  console.log(errors);

  const from = location.state?.from?.pathname || "/";

  async function handleLogin(data: LoginForm) {
    auth.signin(
      { email: data.email, password: data.password },
      () => {
        toast.success("Login efetuado com sucesso!");
        navigate(from, { replace: true });
      },
      (error: AuthError) => {
        generateFirebaseAuthError(error);
      },
    );
  }

  async function handleLoginWithGoogle() {
    auth.signinWithGoogle(
      () => navigate(from, { replace: true }),
      (error: AuthError) => {
        generateFirebaseAuthError(error);
      },
    );
  }

  return (
    <div className="grid gap-6">
      <form className="space-y-4" onSubmit={handleSubmit(handleLogin)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <FormInput
              name="email"
              placeholder="Seu email"
              type="email"
              register={register}
              error={errors.email}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              Senha
            </Label>
            <FormInput
              name="password"
              placeholder="Sua Senha"
              type="password"
              autoComplete="current-password"
              register={register}
              error={errors.password}
              autoCorrect="off"
              disabled={isSubmitting}
            />
          </div>
          <Button disabled={isSubmitting || auth.loading}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Login com Email
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        disabled={auth.loading || isSubmitting}
        onClick={handleLoginWithGoogle}
      >
        {auth.loading ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}{" "}
        Google
      </Button>
    </div>
  );
}
