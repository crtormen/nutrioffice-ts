import { zodResolver } from "@hookform/resolvers/zod";
import { InputMask } from "@react-input/mask";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";
import {
  Control,
  Controller,
  // DeepMap,
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  Resolver,
  SubmitHandler,
  // UseControllerProps,
  useForm,
  UseFormProps,
  UseFormRegister,
  UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultipleSelector, {
  Option as SelectorOption,
} from "@/components/ui/multiple-selector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { FieldValuesSetting } from "@/domain/entities";
import { cn } from "@/lib/utils";

export type FormProps<TFormValues extends FieldValues> = {
  onSubmit: SubmitHandler<TFormValues>;
  children: (methods: UseFormReturn<TFormValues>) => React.ReactNode;
  values?: TFormValues;
  resolver: Resolver<TFormValues>;
  className?: string;
};

const Form = <TFormValues extends FieldValues>({
  onSubmit,
  children,
  values,
  resolver,
  className,
}: FormProps<TFormValues>) => {
  const methods = useForm<TFormValues>({ values, resolver });
  const reset = methods.reset;
  const isSubmitSuccessful = methods.formState.isSubmitSuccessful;

  useEffect(() => {
    reset();
  }, [isSubmitSuccessful, reset]);

  return (
    <form
      onSubmit={methods.handleSubmit(onSubmit, (error: unknown) => {
        toast.error("O Formulário contém erros, corrija para salvar.");
        throw new Error(error as string);
      })}
      className={className}
    >
      {children(methods)}
    </form>
  );
};

// const debugResolver = (data, context, options) => {
//   // you can debug your validation schema here
//     console.log("formData", data);
//     console.log(
//       "validation result",
//       await zodResolver(zodSchema)(data, context, options),
//     );
//     return zodResolver(zodSchema)(data, context, options);
// }

export const inputTypes = [
  "text",
  "tel",
  "password",
  "email",
  "date",
  "select",
  "switch",
  "slider",
  "number",
  "radio",
  "textarea",
  "checkbox",
  "multiple",
] as const;

export type InputType = (typeof inputTypes)[number];

export const INPUTTYPES: Record<
  Partial<InputType>,
  { text: string; value: string }
> = {
  text: { text: "Campo de Texto", value: "text" },
  number: { text: "Campo de Numeral", value: "number" },
  radio: { text: "Multiplas Opções (1 escolha)", value: "radio" },
  multiple: { text: "Multipla Escolha", value: "multiple" },
  tel: { text: "Campo de Telefone", value: "tel" },
  email: { text: "Campo de Email", value: "email" },
  password: { text: "Campo de Senha", value: "password" },
  date: { text: "Campo de Data", value: "date" },
  select: {
    text: "Multiplas Opções (1 escolha) - caixa de diálogo",
    value: "select",
  },
  switch: { text: "Campo Liga/Desliga", value: "switch" },
  slider: { text: "Campo Slider", value: "slider" },
  textarea: { text: "Campo de Área de Texto", value: "textarea" },
  checkbox: { text: "Campo de Marcação (check)", value: "checkbox" },
};

export type Options = Record<string, string>;

const getRadioOptions = (options: Options): ReadonlyArray<string> =>
  Object.keys(options);

const getMultiSelectorOptions = (options: Options): SelectorOption[] =>
  Object.entries(options).map(([value, label]) => ({
    label,
    value,
  }));

export const zodType = (value: FieldValuesSetting | undefined) => {
  if (!value) return z.any;
  let type: z.ZodSchema;

  switch (value.type) {
    case "text":
    case "tel":
    case "password":
      type = value.rules?.required
        ? z.string().min(1, { message: `${value.label} é obrigatório` })
        : z.string();
      break;
    case "number":
      type = value.rules?.required
        ? z.coerce
            .number({
              required_error: "Campo obrigatório",
              invalid_type_error: "Deve ser um número",
            })
            .positive({ message: "Deve ser um número maior que 0" })
        : z.coerce
            .number({ invalid_type_error: "Deve ser um número" })
            .optional();
      break;
    case "date":
      type = value.rules?.required
        ? z.date({ required_error: `${value.label} é obrigatório` })
        : z.date();
      break;
    case "switch":
      type = z.boolean();
      break;
    case "slider":
      type = z.coerce.number();
      break;
    case "email":
      type = value.rules?.required
        ? z
            .string()
            .min(1, { message: `${value.label} é obrigatório` })
            .email()
        : z.string().email();
      break;
    case "checkbox":
      type = value.rules?.required
        ? z.array(z.string()).refine((value) => value.some((item) => item), {
            message: "É preciso selecionar pelo menos um item",
          })
        : z.array(z.string());
      break;
    case "radio": {
      if (!value.options) return z.any;
      const options = getRadioOptions(value.options);
      type = value.rules?.required
        ? z.enum(options as [string], {
            required_error: "Selecione uma opção",
            invalid_type_error: "Opção inválida",
          })
        : z
            .enum(options as [string], {
              invalid_type_error: "Opção inválida",
            })
            .nullish();
      break;
    }
    case "multiple":
      type = value.rules?.required
        ? z
            .object({ label: z.string(), value: z.string() })
            .array()
            .refine((value) => value.some((item) => item), {
              message: "É preciso selecionar pelo menos um item",
            })
        : z.array(z.object({ label: z.string(), value: z.string() })).nullish();
      break;
    default:
      return z.any;
  }
  return type;
};

export function useZodForm<TSchema extends z.ZodType>(
  props: Omit<UseFormProps<TSchema["_input"]>, "resolver"> & {
    schema: TSchema;
  },
) {
  const form = useForm<TSchema["_input"]>({
    ...props,
    resolver: zodResolver(props.schema, undefined, {
      // This makes it so we can use `.transform()`s on the schema without same transform getting applied again when it reaches the server
      raw: true,
    }),
  });

  return form;
}

export const MASK_TYPE = {
  phone: "(__) _____-____",
  cep: "_____-___",
  date: "__/__/____",
  time: "__:__",
  creditCard: "____ ____ ____ ____",
  cpf: "___.___.___-__",
} as const;

export type FormInputProps<TFormValues extends FieldValues = FieldValues> = {
  name: Path<TFormValues>;
  label?: string;
  errors?: FieldErrors<TFormValues>;
  error?: FieldError;
  // errors?: Partial<DeepMap<TFormValues, FieldError>>;
  register?: UseFormRegister<TFormValues>;
  rules?: RegisterOptions<TFormValues>;
  options?: Options;
  control?: Control<TFormValues>;
  description?: string;
  type: InputType;
  creatable?: boolean;
  showTooltip?: boolean;
  modal?: boolean;
  mask?: keyof typeof MASK_TYPE;
} & Omit<InputProps, "name" | "type">;

export const FormInput = <TFormValues extends FieldValues>({
  className,
  name,
  label,
  error,
  errors,
  register,
  rules,
  modal,
  options,
  control,
  description,
  creatable,
  showTooltip,
  mask,
  ...props
}: FormInputProps<TFormValues>): JSX.Element | null => {
  const errorMessage = error
    ? error.message
    : errors && errors[name]
      ? errors[name].message
      : undefined;

  let input: JSX.Element | null;
  switch (props.type) {
    case "text":
    case "email":
    case "password":
    case "number":
    case "tel":
      input = mask ? (
        <InputMask
          mask={MASK_TYPE[mask]}
          {...props}
          {...(register && register(name, rules))}
          replacement={{ _: /\d/ }}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        />
      ) : (
        <Input
          name={name}
          {...props}
          {...(register && register(name, rules))}
        />
      );
      break;
    // case "fieldArray":
    //   input = (
    //     <Input
    //   )
    //   break;
    case "date":
      input = (
        <Controller
          control={control}
          name={name}
          render={({ field }) => {
            return (
              <DateTimePicker
                granularity="day"
                locale={ptBR}
                value={field.value}
                modal={modal}
                onChange={field.onChange}
                ref={field.ref}
                displayFormat={{ hour24: "dd/MM/yyyy" }}
                placeholder="Escolha uma data"
              />
            );
          }}
        />
      );
      break;
    // case "simple-date":
    //   input = (

    //   );
    // break;
    case "switch":
      input = (
        <Controller
          control={control}
          name={name}
          render={({ field }) => {
            return (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                ref={field.ref}
              />
            );
          }}
        />
      );
      break;
    case "slider":
      input = (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <>
              <Slider
                // min={0}
                // max={100}
                step={5}
                interval={20}
                showTooltip={showTooltip}
                ref={field.ref}
                // minStepsBetweenThumbs={25}
                defaultValue={[field.value]}
                onValueChange={field.onChange}
              />
            </>
          )}
        />
      );
      break;
    case "radio":
      input = (
        <Controller
          control={control}
          name={name}
          render={({ field }) => {
            return (
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value as string}
                ref={field.ref}
              >
                {options &&
                  Object.entries(options)?.map(([option, label], i) => (
                    <div className="flex items-center space-x-2" key={i}>
                      <RadioGroupItem
                        value={option as string}
                        id={option as string}
                      />
                      <Label htmlFor={option as string}>{label}</Label>
                    </div>
                  ))}
              </RadioGroup>
            );
          }}
        />
      );
      break;
    case "checkbox":
      input = (
        <Controller
          control={control}
          name={name}
          render={({ field: { value, onChange } }) => {
            return (
              <div>
                {options &&
                  Object.entries(options)?.map(([option, label], i) => (
                    <div className="flex items-center space-x-2" key={i}>
                      <Checkbox
                        checked={(option as string)?.includes(option as string)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? onChange([...(value as string), option])
                            : onChange(
                                value!.filter(
                                  (value: string) => value !== option,
                                ),
                              );
                        }}
                      />
                      <Label
                        htmlFor={option as string}
                        className="text-sm font-normal"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
              </div>
            );
          }}
        />
      );
      break;
    case "multiple":
      input = (
        <Controller
          control={control}
          name={name}
          render={({ field: { value, onChange, ref } }) => {
            return (
              <div>
                {options && (
                  <MultipleSelector
                    value={value}
                    onChange={onChange}
                    defaultOptions={getMultiSelectorOptions(options || {})}
                    selectFirstItem={false}
                    creatable={creatable}
                    placeholder={props.placeholder}
                    ref={ref}
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        nenhum resultado encontrado.
                      </p>
                    }
                  />
                )}
              </div>
            );
          }}
        />
      );
      break;
    case "select":
      input = (
        <Controller
          control={control}
          name={name}
          render={({ field: { value, onChange } }) => {
            return (
              <div>
                {options && (
                  <Select
                    onValueChange={onChange}
                    defaultValue={value}
                    // ref={ref}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={props.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{label}</SelectLabel>
                        {options &&
                          Object.entries(options)?.map(([option, label], i) => (
                            <SelectItem key={i} value={option}>
                              {label}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          }}
        />
      );
      break;
    default:
      return null;
  }

  return (
    <div className={className} aria-live="polite">
      {input}
      <div className="block text-[0.8rem] text-sm text-muted-foreground">
        {description}
      </div>
      <div className="error-message block text-[0.8rem] font-medium text-destructive">
        {errorMessage && (errorMessage as string)}
        {"\t"}
      </div>
    </div>
  );
};

export type FormTextareaProps<TFormValues extends FieldValues = FieldValues> = {
  name: Path<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  error?: FieldError;
  // errors?: Partial<DeepMap<TFormValues, FieldError>>;
  register?: UseFormRegister<TFormValues>;
  rules?: RegisterOptions<TFormValues>;
  description?: string;
} & Omit<TextareaProps, "name">;

export const FormTextarea = <TFormValues extends FieldValues>({
  className,
  name,
  error,
  errors,
  register,
  rules,
  description,
  ...props
}: FormTextareaProps<TFormValues>): JSX.Element | null => {
  const errorMessage = error
    ? error.message
    : errors && errors[name]
      ? errors[name].message
      : undefined;

  return (
    <div className={className} aria-live="polite">
      <Textarea
        name={name}
        {...props}
        {...(register && register(name, rules))}
      />
      <div className="block text-[0.8rem] text-sm text-muted-foreground">
        {description}
      </div>
      <div className="error-message block text-[0.8rem] font-medium text-destructive">
        {errorMessage && (errorMessage as string)}
        {"\t"}
      </div>
    </div>
  );
};
// interface OptionsSectionProps<T extends FieldValues> {
//   form: UseFormReturn<T>;
// }

// // newAnamnesisFieldFormInputs;
// const OptionsSection = <T extends FieldValues>({
//   form: {
//     control,
//     register,
//     formState: { errors },
//   },
// }: OptionsSectionProps<T>) => {
//   const { fields, append, remove } = useFieldArray({
//     name: "options" as ArrayPath<T>,
//     control,
//   });

//   return (
//     <div className="flex flex-col gap-2">
//       <Label htmlFor="options" className="pb-4">
//         Opções
//       </Label>
//       {fields.map((field, i) => (
//         <div className="flex flex-col gap-2" key={field.id}>
//           <div className="flex items-center gap-1">
//             <div className="w-1/5 text-sm">{`Opção ${i + 1}`}</div>
//             <Input
//               key={i}
//               {...register(`options.${i}.option` as const)}
//               placeholder="Escreva a opção"
//               defaultValue={field.option}
//               // error={errors.options?.[i]?.option}
//             />
//             <Button
//               variant="link"
//               onClick={() => remove(i)}
//               className="w-1/5 items-center space-x-1"
//             >
//               <span>Remover</span>
//             </Button>
//           </div>
//           <div className="p-1 text-destructive">
//             {errors.options?.[i]?.option &&
//               errors.options?.[i]?.option?.message}
//           </div>
//         </div>
//       ))}
//       <Button
//         variant="outline"
//         onClick={(e) => {
//           e.preventDefault();
//           e.stopPropagation();
//           append({
//             option: "",
//           });
//         }}
//       >
//         Adicionar outra opção
//       </Button>
//     </div>
//   );
// };

export default Form;
