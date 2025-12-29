import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { Controller } from "react-hook-form";
import * as zod from "zod";

import { ROUTES } from "@/app/router/routes";
import { useSaveNewCustomer } from "@/components/Customers/hooks/useSaveNewCustomer";
import Form, { FormInput } from "@/components/form";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

const newCustomerValidationSchema = zod.object({
  name: zod
    .string()
    .min(5, "O nome do cliente precisa ter pelo menos 5 caracteres"),
  birthday: zod.date({ required_error: "Data de nascimento é obrigatório" }),
  gender: zod.enum(["H", "M"], {
    required_error: "Por favor, selecione um gênero",
  }),
  email: zod.string().email({ message: "Endereço de email inválido" }),
  phone: zod
    .string()
    .min(15, { message: "Estão faltando números no Celular" })
    .max(15, { message: "Estão sobrando números no Celular" }),
  cpf: zod
    .string()
    .min(14, { message: "Estão faltando números no CPF" })
    .max(14, { message: "Estão sobrando números no CPF" }),
  street: zod.string(),
  cep: zod
    .string()
    .min(9, { message: "Estão faltando números no CEP" })
    .max(9, { message: "Estão sobrando números no CEP" }),
  district: zod.string(),
  city: zod.string(),
  occupation: zod.string(),
  instagram: zod.string(),
  cameBy: zod.string(),
});

export type newCustomerFormInputs = zod.infer<
  typeof newCustomerValidationSchema
>;

const NewCustomerPage = () => {
  const { handleSaveNewCustomer, isSaving } = useSaveNewCustomer();

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Clientes", href: `/${ROUTES.CUSTOMERS.BASE}` },
    { label: "Novo Cliente" },
  ];

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader
        breadcrumbs={breadcrumbs}
        backTo={`/${ROUTES.CUSTOMERS.BASE}`}
      />

      <div className="max-w-3xl space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Novo Cliente</h2>
          </div>
          <p className="text-muted-foreground">
            Preencha as informações para cadastrar um novo cliente
          </p>
        </div>

        <Separator />

        <Form<newCustomerFormInputs>
          onSubmit={handleSaveNewCustomer}
          resolver={zodResolver(newCustomerValidationSchema)}
          className="space-y-8"
        >
          {({ register, control, formState: { errors, isSubmitting } }) => (
            <>
              {/* Informações Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Pessoais</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome Completo</Label>
                    <FormInput
                      type="text"
                      placeholder="Nome Completo"
                      name="name"
                      register={register}
                      error={errors.name}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <FormInput
                      type="date"
                      placeholder="Ex: 01/02/1990"
                      name="birthday"
                      register={register}
                      control={control}
                      error={errors.birthday}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
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
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contato</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <FormInput
                      type="email"
                      placeholder="Ex: abc@def.com"
                      name="email"
                      register={register}
                      error={errors.email}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Celular</Label>
                    <FormInput
                      type="text"
                      mask="phone"
                      placeholder="Ex: (51) 98765-4321"
                      name="phone"
                      register={register}
                      error={errors.phone}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <FormInput
                      type="text"
                      placeholder="Ex: 123.456.789-10"
                      mask="cpf"
                      name="cpf"
                      register={register}
                      error={errors.cpf}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <FormInput
                      type="text"
                      placeholder="@usuario"
                      name="instagram"
                      register={register}
                      error={errors.instagram}
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endereço</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Endereço</Label>
                    <FormInput
                      type="text"
                      placeholder="Rua, número - complemento"
                      name="street"
                      register={register}
                      error={errors.street}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <FormInput
                      type="text"
                      placeholder="Bairro"
                      name="district"
                      register={register}
                      error={errors.district}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <FormInput
                      type="text"
                      placeholder="Ex: 99040-150"
                      mask="cep"
                      name="cep"
                      register={register}
                      error={errors.cep}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Cidade/Estado</Label>
                    <FormInput
                      type="text"
                      placeholder="Ex: Porto Alegre / RS"
                      name="city"
                      register={register}
                      error={errors.city}
                    />
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Informações Adicionais
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Profissão</Label>
                    <FormInput
                      type="text"
                      placeholder="Profissão"
                      name="occupation"
                      register={register}
                      error={errors.occupation}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Como me conheceu?</Label>
                    <FormInput
                      type="text"
                      placeholder="Indicação, redes sociais, etc."
                      name="cameBy"
                      register={register}
                      error={errors.cameBy}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSaving || isSubmitting}>
                  {isSaving ? "Salvando..." : "Salvar Cliente"}
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>
    </div>
  );
};

export default NewCustomerPage;
