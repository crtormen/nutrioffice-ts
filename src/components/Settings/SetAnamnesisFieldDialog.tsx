import { useEffect } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";

import { FormInput, INPUTTYPES, Options } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldValuesSetting, GENDERS } from "@/domain/entities";

import {
  newAnamnesisFieldFormInputs,
  useAnamnesisFieldForm,
} from "./hooks/useAnamnesisFieldForm";
import { useSetAnamnesisField } from "./hooks/useSetAnamnesisField";

const getTypeOptions = () => {
  let options: Options = {};
  Object.entries(INPUTTYPES).forEach(([type, obj]) => {
    if (["tel", "email", "password"].includes(type)) return;

    options = {
      ...options,
      [type]: obj.text,
    };
  });
  return options;
};

interface OptionsSectionProps {
  form: UseFormReturn<newAnamnesisFieldFormInputs>;
}

const OptionsSection = ({
  form: {
    control,
    register,
    formState: { errors },
  },
}: OptionsSectionProps) => {
  const { fields, append, remove } = useFieldArray({
    name: "options",
    control,
  });

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="options" className="pb-4">
        Opções
      </Label>
      {fields.map((field, i) => {
        const optionId = field.optionId === "" ? `option${i}` : field.optionId; // check if field already has an existing id
        return (
          <div className="flex flex-col gap-2" key={field.id}>
            <div className="flex items-center gap-1">
              <div className="w-1/5 text-sm">{`Opção ${i + 1}`}</div>
              <Input
                {...register(`options.${i}.option` as const)}
                placeholder="Escreva a opção"
                defaultValue={field.option}
                // error={errors.options?.[i]?.option}
              />
              <Input
                type="hidden"
                {...register(`options.${i}.optionId` as const)}
                defaultValue={optionId}
                // error={errors.options?.[i]?.option}
              />
              <Button
                variant="link"
                onClick={() => remove(i)}
                className="w-1/5 items-center space-x-1"
              >
                <span>Remover</span>
              </Button>
            </div>
            <div className="p-1 text-destructive">
              {errors.options?.[i]?.option &&
                errors.options?.[i]?.option?.message}
            </div>
          </div>
        );
      })}
      <Button
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          append({
            option: "",
            optionId: "option" + fields.length,
          });
        }}
      >
        Adicionar outra opção
      </Button>
    </div>
  );
};

type DialogProps = {
  fieldToEdit?: FieldValuesSetting;
  type?: string;
  isOpen: boolean;
  setDialogOpen: (isOpen: boolean) => void;
};

const SetAnamnesisFieldDialog = ({
  fieldToEdit,
  type,
  isOpen,
  setDialogOpen,
}: DialogProps) => {
  const { handleSubmitAnamnesisField } = useSetAnamnesisField(setDialogOpen);
  const form = useAnamnesisFieldForm(fieldToEdit);
  const {
    register,
    control,
    watch,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = form;

  useEffect(() => {
    if (!isOpen) {
      reset({
        label: "",
        placeholder: "",
        gender: "B",
        type: "text",
      });
    }
  }, [isOpen, isSubmitSuccessful, reset]);

  const submit = (data: newAnamnesisFieldFormInputs) => {
    handleSubmitAnamnesisField(data, fieldToEdit, type);
  };

  const watchFieldType = watch("type");

  return (
    <DialogOverlay>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {fieldToEdit ? "Editar Campo" : "Novo Campo"}
          </DialogTitle>
          <DialogDescription>
            {fieldToEdit ? "Edite" : "Insira"} os dados para o novo campo .
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(submit)}>
          <div className="space-y-2">
            <Label htmlFor="label">Pergunta a ser feita</Label>
            <FormInput
              type="text"
              placeholder="Ex: Possui alguma intolerância?"
              name="label"
              register={register}
              error={errors.label}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Se aplica a</Label>
            <FormInput
              type="radio"
              name="gender"
              options={{
                [GENDERS.M.value]: GENDERS.M.text,
                [GENDERS.H.value]: GENDERS.H.text,
                [GENDERS.B.value]: GENDERS.B.text,
              }}
              control={control}
              error={errors.gender}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de campo</Label>
            <FormInput
              type="radio"
              name="type"
              error={errors.type}
              options={getTypeOptions()}
              control={control}
            />
          </div>
          {["text", "textarea", "date", "multiple"].includes(
            watchFieldType,
          ) && (
            <div className="space-y-2">
              <Label htmlFor="placeholder">Dica ou instrução (opcional)</Label>
              <FormInput
                type="text"
                placeholder="Ex: Descreva sua intolerância"
                name="placeholder"
                register={register}
                error={errors.placeholder}
              />
            </div>
          )}
          {["radio", "checkbox", "multiple"].includes(watchFieldType) && (
            <OptionsSection form={form} />
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="success" disabled={isSubmitting}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogOverlay>
  );
};

export default SetAnamnesisFieldDialog;
