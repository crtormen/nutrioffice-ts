import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IFolds } from "@/domain/entities/consulta";
import { IFoldPoint } from "@/domain/entities/evaluation";

interface DynamicFoldsFormProps {
  foldPoints: IFoldPoint[];
  values: IFolds;
  onChange: (folds: IFolds) => void;
}

export function DynamicFoldsForm({
  foldPoints,
  values,
  onChange,
}: DynamicFoldsFormProps) {
  const handleFoldChange = (foldId: string, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    onChange({ ...values, [foldId]: numValue });
  };

  const enabledFolds = foldPoints.filter((p) => p.enabled);

  if (enabledFolds.length === 0) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        Nenhuma dobra configurada para este tipo de consulta.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {enabledFolds.map((point) => (
        <div key={point.id} className="space-y-2">
          <Label htmlFor={`fold-${point.id}`}>{point.label} (mm)</Label>
          <Input
            id={`fold-${point.id}`}
            type="number"
            step="0.1"
            min="0"
            placeholder="0.0"
            value={values[point.id] ?? ""}
            onChange={(e) => handleFoldChange(point.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
