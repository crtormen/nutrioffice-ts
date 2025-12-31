import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { updateEvaluationFormToken } from "@/app/services/PublicFormService";
import { useFetchEvaluationConfigQuery } from "@/app/state/features/evaluationSlice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  IEnabledEvaluationFields,
  IMeasurePoint,
} from "@/domain/entities/evaluation";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

interface PublicEvaluationFieldSelectorProps {
  appointmentType: "online" | "presencial";
  enabledFields: IEnabledEvaluationFields | null | undefined;
}

export function PublicEvaluationFieldSelector({
  appointmentType,
  enabledFields: initialEnabledFields,
}: PublicEvaluationFieldSelectorProps) {
  const { dbUid } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: evaluationConfig, isLoading } = useFetchEvaluationConfigQuery(
    dbUid || "",
    {
      skip: !dbUid,
    },
  );

  const [enabledFields, setEnabledFields] = useState<IEnabledEvaluationFields>({
    weight: false,
    height: false,
    measures: [],
    photos: false,
    folds: false,
    bioimpedance: false,
  });

  useEffect(() => {
    if (initialEnabledFields) {
      setEnabledFields(initialEnabledFields);
    } else if (evaluationConfig && !initialEnabledFields) {
      // If no saved configuration exists, enable all available fields by default
      const config = evaluationConfig[appointmentType];
      if (config) {
        setEnabledFields({
          weight: config.fields.weight?.enabled || false,
          height: config.fields.height?.enabled || false,
          measures:
            config.fields.measures?.points?.filter((p) => p.enabled) || [],
          photos: config.fields.photos?.enabled || false,
          folds: false, // Never enable for patients
          bioimpedance: false, // Never enable for patients
        });
        setHasChanges(true);
      }
    }
  }, [initialEnabledFields, evaluationConfig, appointmentType]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const config = evaluationConfig?.[appointmentType];

  if (!config) {
    return (
      <Alert>
        <AlertDescription>
          Configure primeiro os campos de avaliação na aba "Avaliação" das
          configurações.
        </AlertDescription>
      </Alert>
    );
  }

  const availableMeasures =
    config.fields.measures?.points?.filter((p) => p.enabled) || [];

  const handleToggleField = (field: keyof IEnabledEvaluationFields) => {
    setEnabledFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    setHasChanges(true);
  };

  const handleToggleMeasure = (measurePoint: IMeasurePoint) => {
    setEnabledFields((prev) => {
      const measures = prev.measures || [];
      const exists = measures.some((m) => m.id === measurePoint.id);
      const newMeasures = exists
        ? measures.filter((m) => m.id !== measurePoint.id)
        : [...measures, measurePoint];
      return { ...prev, measures: newMeasures };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!dbUid) return;

    setIsSaving(true);
    try {
      await updateEvaluationFormToken(dbUid, appointmentType, enabledFields);
      toast.success("Campos de avaliação atualizados com sucesso!");
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (initialEnabledFields) {
      setEnabledFields(initialEnabledFields);
    }
    setHasChanges(false);
  };

  const enabledCount =
    (enabledFields.weight ? 1 : 0) +
    (enabledFields.height ? 1 : 0) +
    (enabledFields.photos ? 1 : 0) +
    (enabledFields.measures?.length || 0);

  const totalAvailable =
    (config.fields.weight?.enabled ? 1 : 0) +
    (config.fields.height?.enabled ? 1 : 0) +
    (config.fields.photos?.enabled ? 1 : 0) +
    availableMeasures.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>
            Campos de Avaliação Habilitados ({enabledCount}/{totalAvailable})
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Pacientes poderão enviar dados de avaliação junto com a anamnese.
            Dobras e bioimpedância não podem ser habilitadas (paciente não pode
            medir).
          </AlertDescription>
        </Alert>

        <div className="grid gap-3 sm:grid-cols-2">
          {config.fields.weight?.enabled && (
            <div className="flex items-start space-x-3 space-y-0">
              <Checkbox
                id={`${appointmentType}-eval-weight`}
                checked={enabledFields.weight}
                onCheckedChange={() => handleToggleField("weight")}
              />
              <Label
                htmlFor={`${appointmentType}-eval-weight`}
                className="cursor-pointer text-sm font-medium"
              >
                Peso
              </Label>
            </div>
          )}

          {config.fields.height?.enabled && (
            <div className="flex items-start space-x-3 space-y-0">
              <Checkbox
                id={`${appointmentType}-eval-height`}
                checked={enabledFields.height}
                onCheckedChange={() => handleToggleField("height")}
              />
              <Label
                htmlFor={`${appointmentType}-eval-height`}
                className="cursor-pointer text-sm font-medium"
              >
                Altura
              </Label>
            </div>
          )}

          {config.fields.photos?.enabled && (
            <div className="flex items-start space-x-3 space-y-0">
              <Checkbox
                id={`${appointmentType}-eval-photos`}
                checked={enabledFields.photos}
                onCheckedChange={() => handleToggleField("photos")}
              />
              <Label
                htmlFor={`${appointmentType}-eval-photos`}
                className="cursor-pointer text-sm font-medium"
              >
                Fotos de Evolução
              </Label>
            </div>
          )}
        </div>

        {availableMeasures.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Medidas Circunferenciais</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableMeasures.map((measure) => (
                <div
                  key={measure.id}
                  className="flex items-start space-x-3 space-y-0"
                >
                  <Checkbox
                    id={`${appointmentType}-eval-measure-${measure.id}`}
                    checked={enabledFields.measures?.some(
                      (m) => m.id === measure.id,
                    )}
                    onCheckedChange={() => handleToggleMeasure(measure)}
                  />
                  <Label
                    htmlFor={`${appointmentType}-eval-measure-${measure.id}`}
                    className="cursor-pointer text-sm"
                  >
                    {measure.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasChanges && (
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
