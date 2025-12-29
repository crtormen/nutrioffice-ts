import { IMeasures } from "@/domain/entities/consulta";
import { IMeasurePoint } from "@/domain/entities/evaluation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DynamicMeasuresFormProps {
  measurePoints: IMeasurePoint[];
  values: IMeasures;
  onChange: (measures: IMeasures) => void;
}

export function DynamicMeasuresForm({ measurePoints, values, onChange }: DynamicMeasuresFormProps) {
  const handleMeasureChange = (measureId: string, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    onChange({ ...values, [measureId]: numValue });
  };

  const enabledMeasures = measurePoints.filter((p) => p.enabled);

  if (enabledMeasures.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Nenhuma medida circunferencial configurada para este tipo de consulta.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {enabledMeasures.map((point) => (
        <div key={point.id} className="space-y-2">
          <Label htmlFor={`measure-${point.id}`}>{point.label} (cm)</Label>
          <Input
            id={`measure-${point.id}`}
            type="number"
            step="0.1"
            min="0"
            placeholder="0.0"
            value={values[point.id] ?? ""}
            onChange={(e) => handleMeasureChange(point.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
