import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { Edit } from "lucide-react";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateCustomerMutation } from "@/app/state/features/customersSlice";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { ICustomer } from "@/domain/entities";
import { useAuth } from "@/infra/firebase/hooks";

const editCustomerSchema = z.object({
  name: z
    .string()
    .min(5, "O nome do cliente precisa ter pelo menos 5 caracteres"),
  birthday: z.date({ required_error: "Data de nascimento é obrigatório" }),
  gender: z.enum(["H", "M"], {
    required_error: "Por favor, selecione um gênero",
  }),
  email: z.string().email({ message: "Endereço de email inválido" }),
  phone: z
    .string()
    .min(15, { message: "Estão faltando números no Celular" })
    .max(15, { message: "Estão sobrando números no Celular" }),
  cpf: z
    .string()
    .min(14, { message: "Estão faltando números no CPF" })
    .max(14, { message: "Estão sobrando números no CPF" }),
  street: z.string(),
  cep: z
    .string()
    .min(9, { message: "Estão faltando números no CEP" })
    .max(9, { message: "Estão sobrando números no CEP" }),
  district: z.string(),
  city: z.string(),
  occupation: z.string(),
  instagram: z.string(),
  cameBy: z.string(),
});

type EditCustomerInputs = z.infer<typeof editCustomerSchema>;

interface EditCustomerDialogProps {
  customer: ICustomer;
  children?: React.ReactNode;
}

export const EditCustomerDialog = ({
  customer,
  children,
}: EditCustomerDialogProps) => {
  const { dbUid } = useAuth();
  const { toast } = useToast();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [isOpen, setIsOpen] = React.useState(false);

  // Parse the birthday string to Date
  const parseBirthday = (birthdayString?: string) => {
    if (!birthdayString) return new Date();
    try {
      return parse(birthdayString, "dd/MM/yyyy", new Date());
    } catch {
      return new Date();
    }
  };

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditCustomerInputs>({
    resolver: zodResolver(editCustomerSchema),
    defaultValues: {
      name: customer.name,
      birthday: parseBirthday(customer.birthday),
      gender: customer.gender as "H" | "M",
      email: customer.email || "",
      phone: customer.phone || "",
      cpf: customer.cpf || "",
      street: customer.address?.street || "",
      cep: customer.address?.cep || "",
      district: customer.address?.district || "",
      city: customer.address?.city || "",
      occupation: customer.occupation || "",
      instagram: customer.instagram || "",
      cameBy: customer.cameBy || "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: customer.name,
        birthday: parseBirthday(customer.birthday),
        gender: customer.gender as "H" | "M",
        email: customer.email || "",
        phone: customer.phone || "",
        cpf: customer.cpf || "",
        street: customer.address?.street || "",
        cep: customer.address?.cep || "",
        district: customer.address?.district || "",
        city: customer.address?.city || "",
        occupation: customer.occupation || "",
        instagram: customer.instagram || "",
        cameBy: customer.cameBy || "",
      });
    }
  }, [isOpen, customer, reset]);

  const onSubmit = async (data: EditCustomerInputs) => {
    try {
      const updatedCustomer: Partial<ICustomer> = {
        name: data.name,
        birthday: format(data.birthday, "dd/MM/yyyy"),
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        address: {
          street: data.street,
          cep: data.cep,
          district: data.district,
          city: data.city,
        },
        occupation: data.occupation,
        instagram: data.instagram,
        cameBy: data.cameBy,
      };

      await updateCustomer({
        uid: dbUid!,
        customerId: customer.id!,
        customerData: updatedCustomer,
      }).unwrap();

      toast({
        title: "Cliente atualizado",
        description: `${data.name} foi atualizado com sucesso.`,
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar Dados
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <FormInput
                type="text"
                placeholder="Nome Completo"
                name="name"
                register={register}
                errors={errors}
              />
            </div>

            {/* Birthday */}
            <div className="space-y-2">
              <Label htmlFor="birthday">Data de Nascimento *</Label>
              <FormInput
                type="date"
                placeholder="Ex: 01/02/1990"
                name="birthday"
                register={register}
                control={control}
                errors={errors}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gênero *</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="H" id="H" />
                      <Label htmlFor="H">Masculino</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="M" id="M" />
                      <Label htmlFor="M">Feminino</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <FormInput
                  type="email"
                  placeholder="email@exemplo.com"
                  name="email"
                  register={register}
                  errors={errors}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <FormInput
                  type="tel"
                  placeholder="(00) 00000-0000"
                  name="phone"
                  register={register}
                  errors={errors}
                />
              </div>
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <FormInput
                type="text"
                placeholder="000.000.000-00"
                name="cpf"
                register={register}
                errors={errors}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="street">Endereço</Label>
              <FormInput
                type="text"
                placeholder="Rua, número"
                name="street"
                register={register}
                errors={errors}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <FormInput
                  type="text"
                  placeholder="00000-000"
                  name="cep"
                  register={register}
                  errors={errors}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">Bairro</Label>
                <FormInput
                  type="text"
                  placeholder="Bairro"
                  name="district"
                  register={register}
                  errors={errors}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <FormInput
                  type="text"
                  placeholder="Cidade"
                  name="city"
                  register={register}
                  errors={errors}
                />
              </div>
            </div>

            {/* Other info */}
            <div className="space-y-2">
              <Label htmlFor="occupation">Profissão</Label>
              <FormInput
                type="text"
                placeholder="Profissão"
                name="occupation"
                register={register}
                errors={errors}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <FormInput
                type="text"
                placeholder="@usuario"
                name="instagram"
                register={register}
                errors={errors}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cameBy">Como me conheceu?</Label>
              <FormInput
                type="text"
                placeholder="Ex: Instagram, indicação, etc."
                name="cameBy"
                register={register}
                errors={errors}
              />
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
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
