import { zodResolver } from "@hookform/resolvers/zod";
import { AuthError } from "firebase/auth";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { ROUTES } from "@/app/router/routes";
import { FormInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCreateNewUser } from "@/components/User/hooks/useCreateNewUser";
import { generateFirebaseAuthError } from "@/infra/firebase/generateFirebaseAuthErrors";

const signUpForm = z
  .object({
    name: z
      .string()
      .min(1, "O nome é obrigatório")
      .refine(
        (value) => /^[a-zA-Z]+[-'s]?[a-zA-Z ]+$/.test(value),
        "O nome deve conter apenas letras.",
      ),
    email: z.string().min(1, "Forneça um endereço de email").email({
      message: "Insira um email válido",
    }),
    phone: z.string().min(1, "O celular é obrigatório"),
    password: z
      .string()
      .min(1, "Forneça uma senha")
      .min(8, { message: "A senha deve conter no mínimo 8 caracteres." }),
  })
  .required();

export type SignUpForm = z.infer<typeof signUpForm>;

const SignUpPage = () => {
  const { createUser, isSaving } = useCreateNewUser();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpForm),
  });

  async function handleSignUp(data: SignUpForm) {
    createUser(data)
      .then(() => {
        // Check if user came from pricing page
        const selectedPlan = sessionStorage.getItem("selectedPlan");
        console.log(
          "📝 SignUpPage - After signup, selectedPlan:",
          selectedPlan,
        );

        if (selectedPlan) {
          // User came from pricing, redirect to pricing page to complete subscription
          toast.success("Conta criada! Finalizando sua assinatura...");
          console.log("🎯 SignUpPage - Redirecting to pricing page");
          navigate(ROUTES.SUBSCRIPTION.PRICING}`);
        } else {
          // Normal signup flow - redirect to login
          toast.success("Usuário cadastrado com sucesso!", {
            action: {
              label: "Login",
              onClick: () => navigate(`/login?email=${data.email}`),
            },
          });
          navigate(`/login?email=${data.email}`);
        }
      })
      .catch((err: unknown) => {
        generateFirebaseAuthError(err as AuthError);
      });
  }

  return (
    <div className="p-8">
      <Button
        variant="outline"
        asChild
        className="absolute right-8 top-8 text-primary"
      >
        <Link to="/login">Fazer login</Link>
      </Button>

      <div className="flex w-[350px] flex-col justify-center gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Criar conta grátis
          </h1>
          <p className="text-sm text-muted-foreground">
            Seja nosso parceiro e organize sua clínica!
          </p>
        </div>
        {/* 
        <Form<newCollaboratorFormInputs>
                onSubmit={handleSetCollaborator}
                resolver={zodResolver(newCollaboratorValidationSchema)}
                className="flex flex-col gap-5"
              >
        {({ register, control, formState: { errors, isSubmitting } }) => ( */}
        <form className="space-y-4" onSubmit={handleSubmit(handleSignUp)}>
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cadastro</Label>
            <FormInput
              type="text"
              placeholder="Nome completo do responsável pela conta"
              name="name"
              register={register}
              error={errors.name}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Seu e-mail</Label>
            <FormInput
              type="email"
              placeholder="Email que será usado para acessar a conta"
              name="email"
              register={register}
              error={errors.email}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Seu celular</Label>
            <FormInput
              type="tel"
              mask="phone"
              placeholder="Ex: (51) 98765-4321"
              name="phone"
              register={register}
              error={errors.phone}
              autoComplete="phone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <FormInput
              type="password"
              placeholder="Mínimo 8 dígitos"
              description="A senha deve conter pelo menos 8 caracteres."
              name="password"
              register={register}
              error={errors.password}
              autoComplete="current-password"
            />
          </div>

          <Button disabled={isSaving} className="w-full" type="submit">
            Finalizar cadastro
          </Button>

          <p className="px-6 text-center text-sm leading-relaxed text-muted-foreground">
            Ao continuar, você concorda com nossos{" "}
            <a href="" className="underline underline-offset-4">
              Termos de Serviço
            </a>{" "}
            e{" "}
            <a href="" className="underline underline-offset-4">
              Políticas de Privacidade
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
