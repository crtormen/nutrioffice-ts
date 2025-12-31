import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { IMeasurePoint } from "@/domain/entities/evaluation";

interface MeasurePointsEditorProps {
  measurePoints: IMeasurePoint[];
  onPointsChange: (points: IMeasurePoint[]) => void;
}

export function MeasurePointsEditor({
  measurePoints,
  onPointsChange,
}: MeasurePointsEditorProps) {
  const handleTogglePoint = (pointId: string) => {
    const updatedPoints = measurePoints.map((point) =>
      point.id === pointId ? { ...point, enabled: !point.enabled } : point,
    );
    onPointsChange(updatedPoints);
  };

  // Sort measure points alphabetically by label
  const sortedMeasurePoints = [...measurePoints].sort((a, b) =>
    a.label.localeCompare(b.label, "pt-BR"),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Pontos de Medida Circunferencial
        </CardTitle>
        <CardDescription>
          Selecione quais medidas devem ser coletadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {sortedMeasurePoints.map((point) => (
            <div key={point.id} className="flex items-center space-x-2">
              <Checkbox
                id={`measure-${point.id}`}
                checked={point.enabled}
                onCheckedChange={() => handleTogglePoint(point.id)}
              />
              <Label
                htmlFor={`measure-${point.id}`}
                className="cursor-pointer text-sm"
              >
                {point.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
