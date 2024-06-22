import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import * as zod from "zod";

import { useAddAnamnesisMutation } from "@/app/state/features/anamnesisSlice";
import { useSetAnamnesisForm } from "@/components/Anamnesis/hooks/useSetAnamnesisForm";
import Form, { FormInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IAnamnesis } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

const NewAnamnesisPage = () => {
  const { anamnesisFieldArray, zodSchema } = useSetAnamnesisForm();
  const [addAnamnesis, { isLoading: isSaving }] = useAddAnamnesisMutation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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

    addAnamnesis({ uid: user!.uid, customerId: id!, newAnamnesis: anamnesis })
      .unwrap()
      .then(() => {
        toast.success("Anamnese cadastrada com sucesso!");
        navigate(`/customers/${id}/anamnesis`, { replace: true });
      })
      .catch((error: unknown) => {
        console.error(error);
        toast.error("Ocorreu um erro no cadastro da anamnese, tente novamente");
      });
  }

  return (
    <div className="w-[650px] flex-col space-y-8 p-8 md:flex">
      <h2 className="text-2xl font-bold tracking-tight">Nova Anamnese</h2>
      <Form<Record<string, zod.ZodTypeAny>>
        onSubmit={handleNewAnamnesis}
        resolver={zodResolver(zodSchema)}
        // resolver={async (data, context, options) => {
        //   // you can debug your validation schema here
        //   console.log("formData", data);
        //   console.log(
        //     "validation result",
        //     await zodResolver(zodSchema)(data, context, options),
        //   );
        //   return zodResolver(zodSchema)(data, context, options);
        // }}
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
              <Button
                type="submit"
                variant="success"
                disabled={isSubmitting || isSaving}
              >
                Salvar
              </Button>
            </>
          );
        }}
      </Form>
    </div>
  );
};

export default NewAnamnesisPage;
