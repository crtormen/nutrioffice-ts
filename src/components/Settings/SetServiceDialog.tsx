import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useSetSettingsMutation } from "@/app/state/features/settingsSlice";
import { FormInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { IServiceConfig, SERVICE_CATEGORIES } from "@/domain/entities/settings";
import { useAuth } from "@/infra/firebase/hooks";

const serviceFormSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  description: z.string().optional(),
  price: z.coerce
    .number()
    .positive({ message: "Preço deve ser maior que zero" }),
  credits: z.coerce.number().int().min(0).optional(),
  category: z.enum(["consulta", "pacote", "protocolo", "produto", "outro"]),
  active: z.boolean().default(true),
});

type ServiceFormInputs = z.infer<typeof serviceFormSchema>;

interface SetServiceDialogProps {
  serviceToEdit?: IServiceConfig;
  serviceKey?: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SetServiceDialog = ({
  serviceToEdit,
  serviceKey,
  children,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: SetServiceDialogProps) => {
  const { dbUid } = useAuth();
  const { toast } = useToast();
  const [setSettings] = useSetSettingsMutation();
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Use external control if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInputs>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: serviceToEdit
      ? {
          name: serviceToEdit.name,
          description: serviceToEdit.description || "",
          price: serviceToEdit.price,
          credits: serviceToEdit.credits || 0,
          category: serviceToEdit.category,
          active: serviceToEdit.active,
        }
      : {
          name: "",
          description: "",
          price: 0,
          credits: 0,
          category: "consulta",
          active: true,
        },
  });

  useEffect(() => {
    if (isOpen && serviceToEdit) {
      // When opening in edit mode, populate the form
      reset({
        name: serviceToEdit.name,
        description: serviceToEdit.description || "",
        price: serviceToEdit.price,
        credits: serviceToEdit.credits || 0,
        category: serviceToEdit.category,
        active: serviceToEdit.active,
      });
    } else if (!isOpen) {
      // When closing, reset to empty form
      reset({
        name: "",
        description: "",
        price: 0,
        credits: 0,
        category: "consulta",
        active: true,
      });
    }
  }, [isOpen, serviceToEdit, reset]);

  const onSubmit = async (data: ServiceFormInputs) => {
    try {
      const serviceId = serviceKey || `service${Date.now()}`;
      const service: IServiceConfig = {
        id: serviceId,
        name: data.name,
        description: data.description,
        price: data.price,
        credits: data.credits || 0,
        category: data.category,
        active: data.active,
        createdAt: serviceToEdit?.createdAt || new Date().toISOString(),
      };

      await setSettings({
        uid: dbUid,
        type: "custom",
        setting: {
          services: {
            [serviceId]: service,
          },
        } as any,
        merge: true,
      }).unwrap();

      toast({
        title: serviceToEdit ? "Serviço atualizado" : "Serviço criado",
        description: `${service.name} foi ${serviceToEdit ? "atualizado" : "adicionado"} com sucesso.`,
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o serviço. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {serviceToEdit ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
            <DialogDescription>
              {serviceToEdit
                ? "Edite as informações do serviço"
                : "Adicione um novo serviço disponível para venda"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Serviço *</Label>
              <FormInput
                type="text"
                name="name"
                placeholder="Ex: Consulta Presencial"
                register={register}
                errors={errors}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <FormInput
                type="textarea"
                name="description"
                placeholder="Descrição opcional do serviço"
                register={register}
                errors={errors}
              />
            </div>

            {/* Price and Credits - Side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <FormInput
                  type="number"
                  name="price"
                  placeholder="0.00"
                  register={register}
                  errors={errors}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Créditos</Label>
                <FormInput
                  type="number"
                  name="credits"
                  placeholder="0"
                  register={register}
                  errors={errors}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <FormInput
                type="select"
                name="category"
                options={{
                  consulta: "Consulta",
                  pacote: "Pacote",
                  produto: "Produto",
                  outro: "Outro",
                }}
                register={register}
                errors={errors}
                control={control}
              />
            </div>

            {/* Active Status */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FormInput
                  type="switch"
                  name="active"
                  control={control}
                  errors={errors}
                />
                <Label htmlFor="active">Serviço ativo</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Apenas serviços ativos aparecem na lista de vendas
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : serviceToEdit
                  ? "Atualizar"
                  : "Criar Serviço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
