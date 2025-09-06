import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";

import { useSaveAnamnesis } from "@/components/Anamnesis/hooks/useSaveAnamnesis";
import { useSetAnamnesisForm } from "@/components/Anamnesis/hooks/useSetAnamnesisForm";
import Form, { FormInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const NewAnamnesisPage = () => {
  const { anamnesisFieldArray, zodSchema } = useSetAnamnesisForm();
  const { handleNewAnamnesis, isSaving } = useSaveAnamnesis();

  if (!zodSchema || !anamnesisFieldArray) return null;

  return (
    <div className="w-[650px] flex-col space-y-8 p-8 md:flex">
      <h2 className="text-2xl font-bold tracking-tight">Nova Anamnese</h2>
      <Form<Record<string, zod.ZodTypeAny>>
        onSubmit={handleNewAnamnesis}
        resolver={zodResolver(zodSchema)}
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
