import { Loader2, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  useFetchEvaluationConfigQuery,
  useFetchEvaluationPresetsQuery,
  useUpdateEvaluationConfigMutation,
} from "@/app/state/features/evaluationSlice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { IAppointmentTypeEvaluationConfig } from "@/domain/entities/evaluation";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

import { FoldPointsSelector } from "./FoldPointsSelector";
import { MeasurePointsEditor } from "./MeasurePointsEditor";
import { PresetSelector } from "./PresetSelector";

interface EvaluationConfigCardProps {
  appointmentType: "online" | "presencial";
}

export function EvaluationConfigCard({
  appointmentType,
}: EvaluationConfigCardProps) {
  const { dbUid } = useAuth();
  const [hasChanges, setHasChanges] = useState(false);
  const [localConfig, setLocalConfig] =
    useState<IAppointmentTypeEvaluationConfig | null>(null);

  const { data: configData, isLoading: configLoading } =
    useFetchEvaluationConfigQuery(dbUid || "", {
      skip: !dbUid,
    });

  const { data: presets = [], isLoading: presetsLoading } =
    useFetchEvaluationPresetsQuery(dbUid || "", {
      skip: !dbUid,
    });

  const [updateConfig, { isLoading: isSaving }] =
    useUpdateEvaluationConfigMutation();

  // Initialize local config when data loads
  useEffect(() => {
    if (configData && appointmentType) {
      setLocalConfig(configData[appointmentType]);
      setHasChanges(false);
    }
  }, [configData, appointmentType]);

  const handlePresetChange = (presetId: string | null) => {
    if (!localConfig) return;

    if (presetId === null) {
      // Custom configuration
      setLocalConfig({
        ...localConfig,
        basePreset: null,
      });
    } else {
      // Load preset
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        setLocalConfig({
          enabled: true,
          basePreset: presetId,
          fields: {
            ...preset.fields,
            // Never enable folds for online
            ...(appointmentType === "online" && {
              folds: { enabled: false, points: [] },
            }),
          },
        });
      }
    }
    setHasChanges(true);
  };

  const handleFieldToggle = (
    fieldName: keyof IAppointmentTypeEvaluationConfig["fields"],
  ) => {
    if (!localConfig) return;

    // Prevent enabling folds for online
    if (appointmentType === "online" && fieldName === "folds") {
      toast.error(
        "Dobras cutâneas não podem ser habilitadas para consultas online",
      );
      return;
    }

    setLocalConfig({
      ...localConfig,
      fields: {
        ...localConfig.fields,
        [fieldName]: {
          ...localConfig.fields[fieldName],
          enabled: !localConfig.fields[fieldName]?.enabled,
        },
      },
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!dbUid || !localConfig) return;

    try {
      await updateConfig({
        uid: dbUid,
        type: appointmentType,
        config: localConfig,
      }).unwrap();

      toast.success("Configuração salva com sucesso!");
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error?.data || "Erro ao salvar configuração");
    }
  };

  const handleReset = () => {
    if (configData && appointmentType) {
      setLocalConfig(configData[appointmentType]);
      setHasChanges(false);
    }
  };

  if (configLoading || presetsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!localConfig) {
    return (
      <Alert>
        <AlertDescription>
          Erro ao carregar configuração de avaliação.
        </AlertDescription>
      </Alert>
    );
  }

  const isOnline = appointmentType === "online";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isOnline
            ? "Configuração de Avaliação Online"
            : "Configuração de Avaliação Presencial"}
        </CardTitle>
        <CardDescription>
          {isOnline
            ? "Configure os campos de avaliação para consultas online (paciente não pode medir dobras)"
            : "Configure os campos e protocolo de avaliação para consultas presenciais"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Selector */}
        <div className="space-y-2">
          <Label>Protocolo Base</Label>
          <PresetSelector
            presets={presets}
            selectedPresetId={localConfig.basePreset}
            onPresetChange={handlePresetChange}
            appointmentType={appointmentType}
          />
        </div>

        {/* Basic Fields Toggles */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Campos Básicos</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${appointmentType}-weight`}
                checked={localConfig.fields.weight?.enabled}
                onCheckedChange={() => handleFieldToggle("weight")}
              />
              <Label
                htmlFor={`${appointmentType}-weight`}
                className="cursor-pointer"
              >
                Peso
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${appointmentType}-height`}
                checked={localConfig.fields.height?.enabled}
                onCheckedChange={() => handleFieldToggle("height")}
              />
              <Label
                htmlFor={`${appointmentType}-height`}
                className="cursor-pointer"
              >
                Altura
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${appointmentType}-photos`}
                checked={localConfig.fields.photos?.enabled}
                onCheckedChange={() => handleFieldToggle("photos")}
              />
              <Label
                htmlFor={`${appointmentType}-photos`}
                className="cursor-pointer"
              >
                Fotos de Evolução
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${appointmentType}-measures`}
                checked={localConfig.fields.measures?.enabled}
                onCheckedChange={() => handleFieldToggle("measures")}
              />
              <Label
                htmlFor={`${appointmentType}-measures`}
                className="cursor-pointer"
              >
                Medidas Circunferenciais
              </Label>
            </div>
          </div>
        </div>

        {/* Measure Points Editor */}
        {localConfig.fields.measures?.enabled && (
          <MeasurePointsEditor
            measurePoints={localConfig.fields.measures.points || []}
            onPointsChange={(points) => {
              setLocalConfig({
                ...localConfig,
                fields: {
                  ...localConfig.fields,
                  measures: {
                    ...localConfig.fields.measures!,
                    points,
                  },
                },
              });
              setHasChanges(true);
            }}
          />
        )}

        {/* Folds Section - Only for presencial */}
        {!isOnline && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${appointmentType}-folds`}
                checked={localConfig.fields.folds?.enabled}
                onCheckedChange={() => handleFieldToggle("folds")}
              />
              <Label
                htmlFor={`${appointmentType}-folds`}
                className="cursor-pointer font-medium"
              >
                Dobras Cutâneas
              </Label>
            </div>

            {localConfig.fields.folds?.enabled &&
              localConfig.fields.folds.points && (
                <FoldPointsSelector
                  foldPoints={localConfig.fields.folds.points}
                  protocol={localConfig.fields.folds.protocol}
                  onPointsChange={(points) => {
                    setLocalConfig({
                      ...localConfig,
                      fields: {
                        ...localConfig.fields,
                        folds: {
                          ...localConfig.fields.folds!,
                          points,
                        },
                      },
                    });
                    setHasChanges(true);
                  }}
                />
              )}
          </div>
        )}

        {/* Bioimpedance Section - Only for presencial */}
        {!isOnline && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${appointmentType}-bioimpedance`}
              checked={localConfig.fields.bioimpedance?.enabled}
              onCheckedChange={() => handleFieldToggle("bioimpedance")}
            />
            <Label
              htmlFor={`${appointmentType}-bioimpedance`}
              className="cursor-pointer"
            >
              Bioimpedância (opcional, pode ser usado com ou sem dobras)
            </Label>
          </div>
        )}

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex gap-2 border-t pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configuração
                </>
              )}
            </Button>
            <Button onClick={handleReset} variant="outline" disabled={isSaving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
