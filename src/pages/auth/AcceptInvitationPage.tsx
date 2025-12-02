import { zodResolver } from "@hookform/resolvers/zod";
import { AuthError } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import {
  useFetchInvitationByTokenQuery,
  useAcceptInvitationMutation,
} from "@/app/state/features/invitationsSlice";
import { FormInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ABILITIES } from "@/domain/entities";
import { auth, db } from "@/infra/firebase/firebaseConfig";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { generateFirebaseAuthError } from "@/infra/firebase/generateFirebaseAuthErrors";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const acceptInvitationSchema = z
  .object({
    email: z.string().email(),
    name: z
      .string()
      .min(1, "O nome é obrigatório")
      .min(3, "O nome deve ter no mínimo 3 caracteres"),
    phone: z.string().min(1, "O celular é obrigatório"),
    password: z
      .string()
      .min(1, "Forneça uma senha")
      .min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type AcceptInvitationForm = z.infer<typeof acceptInvitationSchema>;

const AcceptInvitationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch invitation details
  const {
    data: invitation,
    isLoading,
    error: invitationError,
  } = useFetchInvitationByTokenQuery(token || "", {
    skip: !token,
  });

  const [acceptInvitation] = useAcceptInvitationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AcceptInvitationForm>({
    resolver: zodResolver(acceptInvitationSchema),
  });

  // Pre-fill email when invitation loads
  useEffect(() => {
    if (invitation?.email) {
      setValue("email", invitation.email);
    }
  }, [invitation, setValue]);

  const handleAcceptInvitation = async (data: AcceptInvitationForm) => {
    if (!token || !invitation) {
      toast.error("Convite inválido");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const userId = userCredential.user.uid;

      // 2. Create Firestore user document
      await setDoc(doc(db, "users", userId), {
        name: data.name,
        email: data.email,
        phone: data.phone,
        roles: {
          ability: invitation.role,
        },
        contributesTo: invitation.professionalId,
        createdAt: serverTimestamp(),
      });

      // 3. Accept invitation via API
      await acceptInvitation({
        token,
        data: { userId },
      }).unwrap();

      // 4. Sign out (user needs to login)
      await signOut(auth);

      // 5. Show success and redirect
      toast.success("Conta criada com sucesso!", {
        description: "Faça login para acessar o sistema.",
      });

      navigate("/login", {
        state: {
          email: data.email,
          message: "Conta criada com sucesso! Faça login para continuar.",
        },
      });
    } catch (error: any) {
      console.error("Error accepting invitation:", error);

      // Handle different error types
      if (error.code) {
        // Firebase Auth error
        generateFirebaseAuthError(error as AuthError);
      } else {
        // API or other error
        toast.error("Erro ao criar conta", {
          description: error.message || "Tente novamente mais tarde.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Link Inválido</AlertTitle>
          <AlertDescription>
            O link de convite está incompleto ou inválido.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (invitationError || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Convite Não Encontrado</AlertTitle>
            <AlertDescription>
              {invitationError
                ? "Este convite pode ter expirado, sido revogado, ou já ter sido aceito."
                : "Não foi possível carregar os detalhes do convite."}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/login">Ir para Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6">
        <Button variant="outline" asChild className="absolute right-8 top-8">
          <Link to="/login">Fazer login</Link>
        </Button>

        {/* Invitation Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle>Convite para Colaboração</CardTitle>
            </div>
            <CardDescription>
              {invitation.professionalName} convidou você para colaborar no
              NutriOffice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="font-medium">Email:</dt>
                <dd className="text-muted-foreground">{invitation.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Função:</dt>
                <dd className="text-muted-foreground">
                  {ABILITIES[invitation.role as keyof typeof ABILITIES]?.text ||
                    invitation.role}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Válido até:</dt>
                <dd className="text-muted-foreground">
                  {formatDate(invitation.expiresAt)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Separator />

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Complete seu Cadastro</CardTitle>
            <CardDescription>
              Preencha seus dados para aceitar o convite e criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(handleAcceptInvitation)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <FormInput
                  type="email"
                  name="email"
                  register={register}
                  error={errors.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email pré-definido pelo convite
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <FormInput
                  type="text"
                  placeholder="Seu nome completo"
                  name="name"
                  register={register}
                  error={errors.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Celular</Label>
                <FormInput
                  type="text"
                  placeholder="(00) 00000-0000"
                  name="phone"
                  register={register}
                  error={errors.phone}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <FormInput
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  name="password"
                  register={register}
                  error={errors.password}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <FormInput
                  type="password"
                  placeholder="Digite a senha novamente"
                  name="confirmPassword"
                  register={register}
                  error={errors.confirmPassword}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Aceitar Convite e Criar Conta"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ao aceitar, você concorda em colaborar com{" "}
                {invitation.professionalName} no sistema NutriOffice.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
