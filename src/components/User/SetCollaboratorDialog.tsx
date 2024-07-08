import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ABILITIES, abilities, IContributor } from "@/domain/entities";

import Form, { FormInput, Options } from "../form";
import useSetCollaborator from "./hooks/useSetCollaborator";

const newCollaboratorValidationSchema = z.object({
  name: z.string().min(1, "Informe o nome do colaborador."),
  email: z
    .string()
    .min(1, "Informe o email do colaborador.")
    .email({ message: "Insira um email válido" }),
  phone: z.string().min(1, "Informe o telefone do colaborador"),
  roles: z.enum(abilities).nullish(),
});

export type newCollaboratorFormInputs = z.infer<
  typeof newCollaboratorValidationSchema
>;

const getOptions = () => {
  let options: Options = {};
  Object.entries(ABILITIES).forEach(([role, obj]) => {
    options = {
      ...options,
      [role]: obj.text,
    };
  });
  return options;
};

type DialogProps = {
  collaborator?: IContributor;
  setDialogOpen: (isOpen: boolean) => void;
};

const SetCollaboratorDialog = ({
  collaborator,
  setDialogOpen,
}: DialogProps) => {
  const { handleSetCollaborator } = useSetCollaborator(setDialogOpen);
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {collaborator ? "Editar Colaborador" : "Novo Colaborador"}
        </DialogTitle>
        <DialogDescription>
          {collaborator ? "Edite" : "Insira"} os dados do seu colaborador.
        </DialogDescription>
      </DialogHeader>
      <Form<newCollaboratorFormInputs>
        onSubmit={handleSetCollaborator}
        values={
          collaborator && {
            name: collaborator.name,
            email: collaborator.email,
            phone: collaborator.phone,
            roles: collaborator.roles,
          }
        }
        resolver={zodResolver(newCollaboratorValidationSchema)}
        className="flex flex-col gap-5"
      >
        {({ register, control, formState: { errors, isSubmitting } }) => (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <FormInput
                type="text"
                placeholder="Nome do Colaborador"
                name="name"
                register={register}
                error={errors.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <FormInput
                type="email"
                placeholder="Email de acesso"
                name="email"
                register={register}
                error={errors.email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Celular</Label>
              <FormInput
                type="text"
                placeholder="Celular com DDD e Whatsapp"
                name="phone"
                register={register}
                error={errors.phone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Atribuição</Label>
              <FormInput
                type="radio"
                name="roles"
                register={register}
                error={errors.roles}
                options={getOptions()}
                control={control}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" variant="success" disabled={isSubmitting}>
                Salvar
              </Button>
            </DialogFooter>
          </>
        )}
      </Form>
    </DialogContent>
  );
};

export default SetCollaboratorDialog;
