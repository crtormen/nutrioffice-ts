import {
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from "react-hook-form";

import { Input } from "@/components/ui/input";

export type FormFieldProps<TFieldValues extends FieldValues> = {
  type: string;
  placeholder: string;
  name: FieldPath<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  error: FieldError | undefined;
  valueAsNumber?: boolean;
};

function FormField<T extends FieldValues>({
  type,
  placeholder,
  name,
  register,
  error,
  valueAsNumber,
}: FormFieldProps<T>) {
  return (
    <>
      <Input
        type={type}
        placeholder={placeholder}
        {...register(name, { valueAsNumber })}
      />
      {error && (
        <span className="error-message text-[0.8rem] font-medium text-destructive">
          {error.message}
        </span>
      )}
    </>
  );
}
export default FormField;
