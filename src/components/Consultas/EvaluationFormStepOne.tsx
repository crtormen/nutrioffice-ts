import { FieldError } from "react-hook-form";

import { FormInput } from "@/components/form";
import { Label } from "@/components/ui/label";

import { useConsultaContext } from "./context/ConsultaContext";
import {
  evaluationFormInputs,
  EvaluationFormStepProps,
} from "./SetEvaluationDrawer";

export const EvaluationFormStepOne = ({
  online,
  register,
  control,
  errors,
}: EvaluationFormStepProps<evaluationFormInputs>) => {
  const { customer } = useConsultaContext();

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="peso">Peso</Label>
        <FormInput
          type="text"
          placeholder="Peso atual (kg)"
          name="peso"
          register={register}
          error={errors && (errors.peso as FieldError)}
        />
      </div>
      {customer &&
      (!customer.structure || Object.keys(customer.structure).length === 0) ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="altura">Altura</Label>
            <FormInput
              type="text"
              placeholder="Altura (cm)"
              name="altura"
              register={register}
              error={errors && (errors.altura as FieldError)}
            />
          </div>
          {!online && (
            <>
              <div className="space-y-2">
                <Label htmlFor="punho">Punho</Label>
                <FormInput
                  type="text"
                  placeholder="Punho"
                  name="punho"
                  register={register}
                  error={errors && (errors.punho as FieldError)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="peso">Joelho</Label>
                <FormInput
                  type="text"
                  placeholder="Joelho"
                  name="joelho"
                  register={register}
                  error={errors && (errors.joelho as FieldError)}
                />
              </div>
            </>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="weight">Quantos % seguiu da dieta atual?</Label>
          <FormInput
            type="slider"
            showTooltip={false}
            name="howmuch"
            control={control}
            error={errors && (errors.howmuch as FieldError)}
          />
        </div>
      )}
    </div>
  );
};
