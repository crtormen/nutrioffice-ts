import { zodResolver } from "@hookform/resolvers/zod";
import { FileText } from "lucide-react";
import { useParams } from "react-router-dom";
import * as zod from "zod";

import { ROUTES } from "@/app/router/routes";
import { useSaveAnamnesis } from "@/components/Anamnesis/hooks/useSaveAnamnesis";
import { useSetAnamnesisForm } from "@/components/Anamnesis/hooks/useSetAnamnesisForm";
import Form, { FormInput } from "@/components/form";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const NewAnamnesisPage = () => {
  const { customerId } = useParams();
  const { customerName, anamnesisFieldArray, zodSchema } =
    useSetAnamnesisForm();
  const { handleNewAnamnesis, isSaving } = useSaveAnamnesis();

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Clientes", href: `/${ROUTES.CUSTOMERS.BASE}` },
    {
      label: customerName || "Cliente",
      href: customerId ? `/${ROUTES.CUSTOMERS.DETAILS(customerId)}` : undefined,
    },
    { label: "Nova Anamnese" },
  ];

  if (!zodSchema || !anamnesisFieldArray) return null;

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader
        breadcrumbs={breadcrumbs}
        backTo={
          customerId ? `/${ROUTES.CUSTOMERS.DETAILS(customerId)}` : undefined
        }
      />

      <div className="max-w-4xl space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Nova Anamnese</h2>
          </div>
          <p className="text-base text-muted-foreground">
            Preencha as informações da anamnese para{" "}
            <span className="font-medium">{customerName}</span>
          </p>
        </div>

        <Separator />

        <Form<Record<string, zod.ZodTypeAny>>
          onSubmit={handleNewAnamnesis}
          resolver={zodResolver(zodSchema)}
          className="space-y-10"
        >
          {({ register, control, formState: { errors, isSubmitting } }) => {
            return (
              <>
                <div className="space-y-8">
                  {anamnesisFieldArray.map(([name, field], i) => (
                    <div
                      className={`space-y-3 ${
                        field?.type === "text" ||
                        field?.type === "email" ||
                        field?.type === "tel" ||
                        field?.type === "password" ||
                        field?.type === "number"
                          ? "w-full"
                          : field?.type === "textarea" ||
                              field?.type === "multiple" ||
                              field?.type === "checkbox"
                            ? "w-full"
                            : "w-full md:w-1/2"
                      }`}
                      key={i}
                    >
                      <Label htmlFor={name} className="text-base font-medium">
                        {field?.label}
                      </Label>
                      <FormInput
                        {...field}
                        type={field?.type}
                        name={name}
                        errors={errors}
                        register={register}
                        control={control}
                        className="w-full text-base"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    disabled={isSubmitting || isSaving}
                  >
                    {isSaving ? "Salvando..." : "Salvar Anamnese"}
                  </Button>
                </div>
              </>
            );
          }}
        </Form>
      </div>
    </div>
  );
};

export default NewAnamnesisPage;
