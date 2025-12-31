import { Loader2 } from "lucide-react";

import { useFetchEvaluationConfigQuery } from "@/app/state/features/evaluationSlice";
import { DynamicMeasuresForm } from "@/components/Evaluation/DynamicMeasuresForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IMeasures } from "@/domain/entities/consulta";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

interface EvaluationFormStepThreeConfigurableProps {
  online: boolean;
  measures: IMeasures;
  onMeasuresChange: (measures: IMeasures) => void;
}

export const EvaluationFormStepThreeConfigurable = ({
  online,
  measures,
  onMeasuresChange,
}: EvaluationFormStepThreeConfigurableProps) => {
  const { dbUid } = useAuth();

  const { data: evaluationConfig, isLoading } = useFetchEvaluationConfigQuery(
    dbUid || "",
    {
      skip: !dbUid,
    },
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const appointmentType = online ? "online" : "presencial";
  const config = evaluationConfig?.[appointmentType];

  if (!config?.fields?.measures?.enabled) {
    return (
      <Alert>
        <AlertDescription>
          Medidas circunferenciais não estão configuradas para consultas{" "}
          {online ? "online" : "presenciais"}. Configure em Configurações →
          Avaliação.
        </AlertDescription>
      </Alert>
    );
  }

  const measurePoints = config.fields.measures.points || [];

  return (
    <div className="flex w-full flex-col">
      <DynamicMeasuresForm
        measurePoints={measurePoints}
        values={measures}
        onChange={onMeasuresChange}
      />
    </div>
  );
};
