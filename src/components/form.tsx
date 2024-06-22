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
  UseFormRegister,
  UseFormReturn,
} from "react-hook-form";
import { z } from "zod";

import { Checkbox } from "@/components/ui/checkbox";
import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultipleSelector, {
  Option as SelectorOption,
} from "@/components/ui/multiple-selector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldValuesSetting } from "@/domain/entities";

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
    <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
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

export type inputType =
  | "text"
  | "radio"
  | "textarea"
  | "dropdown"
  | "email"
  | "date"
  | "checkbox"
  | "multiple";

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

export type FormInputProps<TFormValues extends FieldValues = FieldValues> = {
  name: Path<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  error?: FieldError;
  // errors?: Partial<DeepMap<TFormValues, FieldError>>;
  register?: UseFormRegister<TFormValues>;
  rules?: RegisterOptions;
  options?: Options;
  control?: Control<TFormValues>;
  description?: string;
  creatable?: boolean;
} & Omit<InputProps, "name">;

export const FormInput = <TFormValues extends FieldValues>({
  className,
  name,
  error,
  errors,
  register,
  rules,
  options,
  control,
  description,
  creatable,
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
    case "tel":
      input = (
        <Input
          name={name}
          {...props}
          {...(register && register(name, rules))}
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
          render={({ field: { value, onChange } }) => {
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

export default Form;
