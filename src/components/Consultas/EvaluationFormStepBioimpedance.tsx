import { Loader2 } from "lucide-react";

import { useFetchEvaluationConfigQuery } from "@/app/state/features/evaluationSlice";
import { BioimpedanceForm } from "@/components/Evaluation/BioimpedanceForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IBioimpedance } from "@/domain/entities/consulta";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

interface EvaluationFormStepBioimpedanceProps {
  online: boolean;
  bioimpedance: IBioimpedance;
  onBioimpedanceChange: (bioimpedance: IBioimpedance) => void;
}

export const EvaluationFormStepBioimpedance = ({
  online,
  bioimpedance,
  onBioimpedanceChange,
}: EvaluationFormStepBioimpedanceProps) => {
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

  if (!config?.fields?.bioimpedance?.enabled) {
    return (
      <Alert>
        <AlertDescription>
          Bioimpedância não está configurada para consultas{" "}
          {online ? "online" : "presenciais"}. Configure em Configurações →
          Avaliação.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <BioimpedanceForm values={bioimpedance} onChange={onBioimpedanceChange} />
    </div>
  );
};
