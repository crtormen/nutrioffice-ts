import { zodResolver } from "@hookform/resolvers/zod";
import { FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useUpdateAnamnesisMutation } from "@/app/state/features/anamnesisSlice";
import { useGetAnamnesisData } from "@/components/Anamnesis/hooks/useGetAnamnesisData";
import { useSetAnamnesisForm } from "@/components/Anamnesis/hooks/useSetAnamnesisForm";
import Form, { FormInput } from "@/components/form";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/infra/firebase";

const EditAnamnesisPage = () => {
  const { customerId, anamnesisId } = useParams();
  const navigate = useNavigate();
  const { dbUid } = useAuth();
  const { toast } = useToast();
  const { customerName, anamnesisFieldArray, zodSchema } =
    useSetAnamnesisForm();
  const anamnesisData = useGetAnamnesisData(customerId);
  const [updateAnamnesis, { isLoading: isSaving }] =
    useUpdateAnamnesisMutation();

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Clientes", href: ROUTES.CUSTOMERS.BASE },
    {
      label: customerName || "Cliente",
      href: customerId ? `/${ROUTES.CUSTOMERS.DETAILS(customerId)} : undefined,
    },
    {
      label: "Anamnese",
      href: customerId
        ? `/${ROUTES.CUSTOMERS.DETAILS(customerId)}/anamnesis`
        : undefined,
    },
    { label: "Editar" },
  ];

  const handleUpdateAnamnesis = async (data: Record<string, unknown>) => {
    if (!dbUid || !customerId || !anamnesisId) return;

    try {
      await updateAnamnesis({
        uid: dbUid,
        customerId,
        anamnesisId,
        updatedAnamnesis: data as any,
      }).unwrap();

      toast({
        title: "Anamnese atualizada",
        description: "As alterações foram salvas com sucesso.",
      });

      navigate(ROUTES.CUSTOMERS.DETAILS(customerId)}/anamnesis`);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (!zodSchema || !anamnesisFieldArray || !anamnesisData) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-muted-foreground">Carregando anamnese...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader
        breadcrumbs={breadcrumbs}
        backTo={
          customerId
            ? `/${ROUTES.CUSTOMERS.DETAILS(customerId)}/anamnesis`
            : undefined
        }
      />

      <div className="max-w-4xl space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              Editar Anamnese
            </h2>
          </div>
          <p className="text-base text-muted-foreground">
            Atualize as informações da anamnese de{" "}
            <span className="font-medium">{customerName}</span>
          </p>
        </div>

        <Separator />

        <Form
          onSubmit={handleUpdateAnamnesis}
          resolver={zodResolver(zodSchema)}
          values={anamnesisData}
          className="space-y-10"
        >
          {({ register, control, formState: { errors, isSubmitting } }) => {
            return (
              <>
                <div className="space-y-8">
                  {anamnesisFieldArray.map(([name, field], i) => (
                    <div className="w-full space-y-3" key={i}>
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
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      navigate(
                        `/${ROUTES.CUSTOMERS.DETAILS(customerId!)}/anamnesis`,
                      )
                    }
                  >
                    Cancelar
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

export default EditAnamnesisPage;
