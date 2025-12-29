import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IEvaluationPreset } from "@/domain/entities/evaluation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface PresetSelectorProps {
  presets: IEvaluationPreset[];
  selectedPresetId: string | null | undefined;
  onPresetChange: (presetId: string | null) => void;
  appointmentType: "online" | "presencial";
}

export function PresetSelector({
  presets,
  selectedPresetId,
  onPresetChange,
  appointmentType,
}: PresetSelectorProps) {
  // Filter out bioimpedance-only for online appointments
  // and fold-based protocols for online (since patients can't measure folds)
  const availablePresets = presets.filter((preset) => {
    if (appointmentType === "online") {
      // For online, exclude protocols that require folds
      return preset.id === "bioimpedance" || !preset.fields.folds?.enabled;
    }
    return true;
  });

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="space-y-3">
      <Select
        value={selectedPresetId || "custom"}
        onValueChange={(value) => onPresetChange(value === "custom" ? null : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione um protocolo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom">Configuração Personalizada</SelectItem>
          {availablePresets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPreset && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{selectedPreset.description}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
