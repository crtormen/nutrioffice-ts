import { FieldError } from "react-hook-form";

import { FormInput } from "@/components/form";
import { Label } from "@/components/ui/label";

import {
  evaluationFormInputs,
  EvaluationFormStepProps,
} from "./SetEvaluationDrawer";

export const EvaluationFormStepTwo = ({
  register,
  errors,
}: EvaluationFormStepProps<evaluationFormInputs>) => (
  <div className="flex w-full flex-col gap-5">
    <div className="space-y-2">
      <Label htmlFor="peso">Triceps</Label>
      <FormInput
        type="text"
        placeholder="Triceps"
        name="triceps"
        register={register}
        error={errors && (errors.triceps as FieldError)}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="peso">Peitoral</Label>
      <FormInput
        type="text"
        placeholder="Peitoral"
        name="peitoral"
        register={register}
        error={errors && (errors.peitoral as FieldError)}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="peso">Axilar</Label>
      <FormInput
        type="text"
        placeholder="Axilar"
        name="axilar"
        register={register}
        error={errors && (errors.axilar as FieldError)}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="peso">Subescapular</Label>
      <FormInput
        type="text"
        placeholder="Subescapular"
        name="subescapular"
        register={register}
        error={errors && (errors.subescapular as FieldError)}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="peso">Abdominal</Label>
      <FormInput
        type="text"
        placeholder="Abdominal"
        name="abdominal"
        register={register}
        error={errors && (errors.abdominal as FieldError)}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="peso">Supra-ilíaca</Label>
      <FormInput
        type="text"
        placeholder="Supra-ilíaca"
        name="supra"
        register={register}
        error={errors && (errors.supra as FieldError)}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="peso">Coxa</Label>
      <FormInput
        type="text"
        placeholder="Coxa"
        name="coxa"
        register={register}
        error={errors && (errors.coxa as FieldError)}
      />
    </div>
  </div>
);
