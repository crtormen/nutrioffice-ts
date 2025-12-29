import { useEffect, useState } from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/infra/firebase/hooks/useAuth";
import { useFetchEvaluationConfigQuery } from "@/app/state/features/evaluationSlice";
import { DynamicFoldsForm } from "@/components/Evaluation/DynamicFoldsForm";
import { IFolds } from "@/domain/entities/consulta";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EvaluationFormStepTwoConfigurableProps {
  online: boolean;
  folds: IFolds;
  onFoldsChange: (folds: IFolds) => void;
}

export const EvaluationFormStepTwoConfigurable = ({
  online,
  folds,
  onFoldsChange,
}: EvaluationFormStepTwoConfigurableProps) => {
  const { dbUid } = useAuth();

  const { data: evaluationConfig, isLoading } = useFetchEvaluationConfigQuery(dbUid || "", {
    skip: !dbUid,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const appointmentType = online ? "online" : "presencial";
  const config = evaluationConfig?.[appointmentType];

  if (!config?.fields?.folds?.enabled) {
    return (
      <Alert>
        <AlertDescription>
          Dobras cutâneas não estão configuradas para consultas {online ? "online" : "presenciais"}.
          Configure em Configurações → Avaliação.
        </AlertDescription>
      </Alert>
    );
  }

  const foldPoints = config.fields.folds.points || [];

  return (
    <div className="flex w-full flex-col">
      <DynamicFoldsForm foldPoints={foldPoints} values={folds} onChange={onFoldsChange} />
    </div>
  );
};
