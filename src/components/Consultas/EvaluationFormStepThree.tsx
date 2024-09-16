import { FieldError } from "react-hook-form";

import { FormInput } from "@/components/form";
import { Label } from "@/components/ui/label";
import { HOMEM } from "@/domain/entities";

import { useConsultaContext } from "./context/ConsultaContext";
import {
  evaluationFormInputs,
  EvaluationFormStepProps,
} from "./SetEvaluationDrawer";

export const EvaluationFormStepThree = ({
  register,
  errors,
}: EvaluationFormStepProps<evaluationFormInputs>) => {
  const { customer } = useConsultaContext();

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="peso">Abdômen</Label>
        <FormInput
          type="text"
          placeholder="Abdômen"
          name="circ_abdomen"
          register={register}
          error={errors && (errors.circ_abdomen as FieldError)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="peso">Cintura</Label>
        <FormInput
          type="text"
          placeholder="Cintura"
          name="circ_cintura"
          register={register}
          error={errors && (errors.circ_cintura as FieldError)}
        />
      </div>
      {customer && customer.gender === HOMEM ? (
        <div className="space-y-2">
          <Label htmlFor="peso">Ombros</Label>
          <FormInput
            type="text"
            placeholder="Ombros"
            name="circ_ombro"
            register={register}
            error={errors && (errors.circ_ombro as FieldError)}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="peso">Glúteos</Label>
          <FormInput
            type="text"
            placeholder="Glúteos"
            name="circ_gluteo"
            register={register}
            error={errors && (errors.circ_gluteo as FieldError)}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="peso">Coxa Direita</Label>
        <FormInput
          type="text"
          placeholder="Coxa Direita"
          name="circ_coxa_dir"
          register={register}
          error={errors && (errors.circ_coxa_dir as FieldError)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="peso">Coxa Esquerda</Label>
        <FormInput
          type="text"
          placeholder="Coxa Esquerda"
          name="circ_coxa_esq"
          register={register}
          error={errors && (errors.circ_coxa_esq as FieldError)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="peso">Panturrilha Direita</Label>
        <FormInput
          type="text"
          placeholder="Panturrilha Direita"
          name="circ_panturrilha_dir"
          register={register}
          error={errors && (errors.circ_panturrilha_dir as FieldError)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="peso">Panturrilha Esquerda</Label>
        <FormInput
          type="text"
          placeholder="Panturrilha Esquerda"
          name="circ_panturrilha_esq"
          register={register}
          error={errors && (errors.circ_panturrilha_esq as FieldError)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="peso">Braço Esquerdo</Label>
        <FormInput
          type="text"
          placeholder="Braço Esquerdo"
          name="circ_braco_esq"
          register={register}
          error={errors && (errors.circ_braco_esq as FieldError)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="peso">Braço Direito</Label>
        <FormInput
          type="text"
          placeholder="Braço Direito"
          name="circ_braco_dir"
          register={register}
          error={errors && (errors.circ_braco_dir as FieldError)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="peso">Peito</Label>
        <FormInput
          type="text"
          placeholder="Peito"
          name="circ_peito"
          register={register}
          error={errors && (errors.circ_peito as FieldError)}
        />
      </div>
    </div>
  );
};
