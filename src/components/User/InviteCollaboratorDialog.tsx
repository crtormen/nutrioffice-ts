import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useSendInvitationMutation } from "@/app/state/features/invitationsSlice";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ABILITIES, abilities } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

import Form, { FormInput, Options } from "../form";

const inviteCollaboratorSchema = z.object({
  email: z
    .string()
    .min(1, "Informe o email do colaborador.")
    .email({ message: "Insira um email válido" }),
  role: z.enum(abilities, {
    required_error: "Selecione uma função",
  }),
});

export type InviteCollaboratorFormInputs = z.infer<
  typeof inviteCollaboratorSchema
>;

const getRoleOptions = (): Options => {
  const options: Options = {};
  Object.entries(ABILITIES).forEach(([role, obj]) => {
    // Don't allow inviting as PROFESSIONAL
    if (role !== "PROFESSIONAL") {
      options[role] = obj.text;
    }
  });
  return options;
};

interface InviteCollaboratorDialogProps {
  collaboratorCount: number;
  maxCollaborators?: number;
}

const InviteCollaboratorDialog = ({
  collaboratorCount,
  maxCollaborators = 5,
}: InviteCollaboratorDialogProps) => {
  const { dbUid } = useAuth();
  const [open, setOpen] = useState(false);
  const [sendInvitation, { isLoading }] = useSendInvitationMutation();

  const limitReached = collaboratorCount >= maxCollaborators;

  const handleInvite = async (data: InviteCollaboratorFormInputs) => {
    if (!dbUid) {
      toast.error("Erro: Usuário não autenticado");
      return;
    }

    try {
      const result = await sendInvitation({
        userId: dbUid,
        data: {
          email: data.email,
          role: data.role,
          permissions: [],
        },
      }).unwrap();

      if (result.emailSent) {
        toast.success("Convite enviado com sucesso!", {
          description: `Um email foi enviado para ${data.email}`,
        });
      } else {
        toast.warning("Convite criado, mas o email não foi enviado", {
          description: "Verifique as configurações de email",
        });
      }

      setOpen(false);
    } catch (error: any) {
      console.error("Error sending invitation:", error);

      // Handle specific error messages
      if (error.message?.includes("limit reached")) {
        toast.error("Limite de colaboradores atingido", {
          description: "Você atingiu o limite de 5 colaboradores.",
        });
      } else if (error.message?.includes("already sent")) {
        toast.error("Convite já enviado", {
          description: "Um convite pendente já existe para este email.",
        });
      } else if (error.message?.includes("already exists")) {
        toast.error("Usuário já existe", {
          description: "Este email já está cadastrado no sistema.",
        });
      } else {
        toast.error("Erro ao enviar convite", {
          description: error.message || "Tente novamente mais tarde.",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={limitReached}>
          <Mail className="mr-2 h-4 w-4" />
          Convidar Colaborador
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Colaborador</DialogTitle>
          <DialogDescription>
            Envie um convite por email para um novo colaborador se juntar à sua
            equipe.
          </DialogDescription>
        </DialogHeader>

        {limitReached && (
          <Alert variant="destructive">
            <AlertDescription>
              Você atingiu o limite de {maxCollaborators} colaboradores.
              Remova um colaborador existente para convidar outro.
            </AlertDescription>
          </Alert>
        )}

        <Form<InviteCollaboratorFormInputs>
          onSubmit={handleInvite}
          resolver={zodResolver(inviteCollaboratorSchema)}
          className="flex flex-col gap-5"
        >
          {({ register, control, formState: { errors } }) => (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <FormInput
                  type="email"
                  placeholder="colaborador@example.com"
                  name="email"
                  register={register}
                  error={errors.email}
                />
                <p className="text-xs text-muted-foreground">
                  O colaborador receberá um email com instruções para criar sua
                  conta.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <FormInput
                  type="radio"
                  name="role"
                  register={register}
                  error={errors.role}
                  options={getRoleOptions()}
                  control={control}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" type="button" disabled={isLoading}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="default"
                  disabled={isLoading || limitReached}
                >
                  {isLoading ? "Enviando..." : "Enviar Convite"}
                </Button>
              </DialogFooter>
            </>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCollaboratorDialog;
