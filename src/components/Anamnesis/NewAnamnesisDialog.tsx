/* eslint-disable @typescript-eslint/no-unused-vars */
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import * as zod from "zod";

import { useAddAnamnesisMutation } from "@/app/state/features/anamnesisSlice";
import { useSetAnamnesisForm } from "@/components/Anamnesis/hooks/useSetAnamnesisForm";
import Form, { FormInput } from "@/components/form";
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
import { IAnamnesis } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

type DialogProps = {
  anamnesis?: IAnamnesis;
  setDialogOpen: (isOpen: boolean) => void;
};

const NewAnamnesisDialog = ({ anamnesis, setDialogOpen }: DialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { customerId } = useParams();
  const { anamnesisFieldArray, zodSchema } = useSetAnamnesisForm();
  const [addAnamnesis, { isLoading: isSaving }] = useAddAnamnesisMutation();

  if (!zodSchema || !anamnesisFieldArray) return null;

  function handleNewAnamnesis(data: Record<string, zod.ZodTypeAny>) {
    let anamnesis: IAnamnesis = {};

    // transform radio, checkbox and multiple-selector values into array of strings
    for (const field in data) {
      if (!data[field]) continue;
      anamnesis = {
        ...anamnesis,
        [field]:
          typeof data[field] === "object"
            ? Object.values(data[field]).map((item) => item.value)
            : data[field],
      };
    }

    addAnamnesis({ uid: user!.uid, customerId, newAnamnesis: anamnesis })
      .unwrap()
      .then(() => {
        toast.success("Anamnese cadastrada com sucesso!");
        navigate(`/customers/${customerId}/anamnesis`, { replace: true });
      })
      .catch((error: unknown) => {
        console.error(error);
        toast.error("Ocorreu um erro no cadastro da anamnese, tente novamente");
      });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova Anamnese</DialogTitle>
        <DialogDescription>
          Insira as informações da anamnese do seu cliente
        </DialogDescription>
      </DialogHeader>
      <Form<Record<string, zod.ZodTypeAny>>
        onSubmit={handleNewAnamnesis}
        // resolver={zodResolver(zodSchema)}
        resolver={async (data, context, options) => {
          // you can debug your validation schema here
          console.log("formData", data);
          console.log(
            "validation result",
            await zodResolver(zodSchema)(data, context, options),
          );
          return zodResolver(zodSchema)(data, context, options);
        }}
        className="flex flex-col gap-5"
      >
        {({ register, control, formState: { errors, isSubmitting } }) => {
          return (
            <>
              {anamnesisFieldArray.map(([name, field], i) => (
                <div className="space-y-2" key={i}>
                  <Label htmlFor={name}>{field?.label}</Label>
                  <FormInput
                    {...field}
                    type={field?.type}
                    name={name}
                    errors={errors}
                    register={register}
                    control={control}
                  />
                </div>
              ))}
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
          );
        }}
      </Form>
    </DialogContent>
  );
};

export default NewAnamnesisDialog;
