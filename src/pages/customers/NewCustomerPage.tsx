import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";
import * as zod from "zod";

import { useSaveNewCustomer } from "@/components/Customers/hooks/useSaveNewCustomer";
import Form, { FormInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

  return (
    <div className="w-[650px] flex-col space-y-8 p-8 md:flex">
      <h2 className="text-3xl font-bold tracking-tight">Novo Cliente</h2>
      <Form<newCustomerFormInputs>
        onSubmit={handleSaveNewCustomer}
        resolver={zodResolver(newCustomerValidationSchema)}
        className="flex flex-col gap-5"
      >
        {({ register, control, formState: { errors, isSubmitting } }) => (
          <>
            <div className="space-y-2">
              <Label className="">Nome Completo</Label>
              <FormInput
                type="text"
                placeholder="Nome Completo"
                name="name"
                register={register}
                error={errors.name}
              />
            </div>
            <div className="flex-col space-y-2">
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
                render={({ field }) => {
                  return (
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
                  );
                }}
              />
            </div>
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
                placeholder=""
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
            <div className="space-y-2">
              <Label>Cidade/Estado</Label>
              <FormInput
                type="text"
                placeholder="Ex: Porto Alegre / RS"
                name="city"
                register={register}
                error={errors.city}
              />
            </div>
            <div className="space-y-2">
              <Label>Profissão</Label>
              <FormInput
                type="text"
                placeholder=""
                name="occupation"
                register={register}
                error={errors.occupation}
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <FormInput
                type="text"
                placeholder=""
                name="instagram"
                register={register}
                error={errors.instagram}
              />
            </div>
            <div className="space-y-2">
              <Label>Como me conheceu?</Label>
              <FormInput
                type="text"
                placeholder=""
                name="cameBy"
                register={register}
                error={errors.cameBy}
              />
            </div>
            <Button type="submit" disabled={isSaving || isSubmitting}>
              Salvar
            </Button>
          </>
        )}
      </Form>
    </div>
  );
};

export default NewCustomerPage;
