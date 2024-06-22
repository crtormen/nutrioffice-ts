import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as zod from "zod";

import { useAddCustomerMutation } from "@/app/state/features/customersSlice";
import FormField from "@/components/Customers/FormField";
import { Button } from "@/components/ui/button";
// import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ICustomer } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

const newCustomerValidationSchema = zod.object({
  name: zod
    .string()
    .min(5, "O nome do cliente precisa ter pelo menos 5 caracteres"),
  birthday: zod.string(), // zod.date(),
  gender: zod.enum(["M", "F"], {
    required_error: "Por favor, selecione um gênero",
  }),
  email: zod.string().email({ message: "Endereço de email inválido" }),
  phone: zod.string(),
  cpf: zod
    .string()
    .min(11, { message: "O CPF deve conter 11 caracteres" })
    .max(12, { message: "O CPF deve conter 11 caracteres" }),
  street: zod.string(),
  cep: zod.string(),
  district: zod.string(),
  city: zod.string(),
  occupation: zod.string(),
  instagram: zod.string(),
  cameBy: zod.string(),
});

type newCustomerFormInputs = zod.infer<typeof newCustomerValidationSchema>;

const NewCustomerPage = () => {
  const navigate = useNavigate();
  const [addCustomer, { isLoading: isSaving }] = useAddCustomerMutation();
  const { dbUid } = useAuth();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<newCustomerFormInputs>({
    resolver: zodResolver(newCustomerValidationSchema),
  });

  function handleNewCustomer(data: newCustomerFormInputs) {
    const customer: ICustomer = {
      address: {
        street: data.street,
        cep: data.cep,
        district: data.district,
        city: data.city,
      },
      name: data.name,
      cpf: data.cpf,
      gender: data.gender,
      birthday: data.birthday,
      email: data.email,
      phone: data.phone,
      occupation: data.occupation,
      instagram: data.instagram,
      cameBy: data.cameBy,
    };
    addCustomer({ uid: dbUid, newCustomer: customer })
      .unwrap()
      .then((dataRef) => {
        toast.success("Cliente cadastrado com sucesso!");
        navigate(`/customers/${dataRef.id}`, { replace: true });
      })
      .catch((error) => {
        console.error(error);
        toast.error("Ocorreu um erro no cadastro do cliente, tente novamente");
      });
  }

  return (
    <div className="w-[650px] flex-col space-y-8 p-8 md:flex">
      <h2 className="text-3xl font-bold tracking-tight">Novo Cliente</h2>
      <form
        onSubmit={handleSubmit(handleNewCustomer)}
        className="flex flex-col gap-5"
      >
        <div className="space-y-2">
          <Label className="">Nome Completo</Label>
          <FormField
            type="text"
            placeholder="Nome Completo"
            name="name"
            register={register}
            error={errors.name}
          />
        </div>
        <div className="flex-col space-y-2">
          <Label>Data de Nascimento</Label>
          <FormField
            type="text"
            placeholder="Ex: 01/02/1990"
            name="birthday"
            register={register}
            error={errors.birthday}
          />
        </div>

        {/* <div>
            <Controller
              control={control}
              name="birthday"
              render={({ field }) => (
                <DatePicker selected={field.value} onSelect={field.onChange} />
              )}
            />
          </div> */}
        <div className="space-y-2">
          <Label>Gênero</Label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => {
              return (
                <RadioGroup onValueChange={field.onChange} value={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="M" id="M" />
                    <Label htmlFor="M">Masculino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="F" id="F" />
                    <Label htmlFor="F">Feminino</Label>
                  </div>
                </RadioGroup>
              );
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <FormField
            type="email"
            placeholder="Ex: abc@def.com"
            name="email"
            register={register}
            error={errors.email}
          />
        </div>
        <div className="space-y-2">
          <Label>Celular</Label>
          <FormField
            type="text"
            placeholder="Ex: (51) 98765-4321"
            name="phone"
            register={register}
            error={errors.phone}
          />
        </div>
        <div className="space-y-2">
          <Label>CPF</Label>
          <FormField
            type="text"
            placeholder=""
            name="cpf"
            register={register}
            error={errors.cpf}
          />
        </div>
        <div className="space-y-2">
          <Label>Endereço</Label>
          <FormField
            type="text"
            placeholder="Rua, número - complemento"
            name="street"
            register={register}
            error={errors.street}
          />
        </div>
        <div className="space-y-2">
          <Label>Bairro</Label>
          <FormField
            type="text"
            placeholder=""
            name="district"
            register={register}
            error={errors.district}
          />
        </div>
        <div className="space-y-2">
          <Label>CEP</Label>
          <FormField
            type="text"
            placeholder="Ex: 99040-150"
            name="cep"
            register={register}
            error={errors.cep}
          />
        </div>
        <div className="space-y-2">
          <Label>Cidade/Estado</Label>
          <FormField
            type="text"
            placeholder="Ex: Porto Alegre / RS"
            name="city"
            register={register}
            error={errors.city}
          />
        </div>
        <div className="space-y-2">
          <Label>Profissão</Label>
          <FormField
            type="text"
            placeholder=""
            name="occupation"
            register={register}
            error={errors.occupation}
          />
        </div>
        <div className="space-y-2">
          <Label>Instagram</Label>
          <FormField
            type="text"
            placeholder=""
            name="instagram"
            register={register}
            error={errors.instagram}
          />
        </div>
        <div className="space-y-2">
          <Label>Como me conheceu?</Label>
          <FormField
            type="text"
            placeholder=""
            name="cameBy"
            register={register}
            error={errors.cameBy}
          />
        </div>
        <Button type="submit" disabled={isSaving}>
          Salvar
        </Button>
      </form>
      {/* </Form> */}
    </div>
  );
};

export default NewCustomerPage;
