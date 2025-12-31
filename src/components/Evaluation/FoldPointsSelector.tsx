import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { IFoldPoint } from "@/domain/entities/evaluation";

interface FoldPointsSelectorProps {
  foldPoints: IFoldPoint[];
  protocol?: string;
  onPointsChange: (points: IFoldPoint[]) => void;
}

const PROTOCOL_NAMES: Record<string, string> = {
  jp3: "Jackson-Pollock 3 Dobras",
  jp7: "Jackson-Pollock 7 Dobras",
  dw4: "Durnin-Womersley 4 Dobras",
};

export function FoldPointsSelector({
  foldPoints,
  protocol,
  onPointsChange,
}: FoldPointsSelectorProps) {
  const handleTogglePoint = (pointId: string) => {
    const updatedPoints = foldPoints.map((point) =>
      point.id === pointId ? { ...point, enabled: !point.enabled } : point,
    );
    onPointsChange(updatedPoints);
  };

  const enabledCount = foldPoints.filter((p) => p.enabled).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Pontos de Dobras Cutâneas</CardTitle>
          {protocol && (
            <Badge variant="secondary">
              {PROTOCOL_NAMES[protocol] || protocol}
            </Badge>
          )}
        </div>
        <CardDescription>
          Selecione quais dobras devem ser medidas ({enabledCount}/
          {foldPoints.length} selecionadas)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {foldPoints.map((point) => (
            <div key={point.id} className="flex items-center space-x-2">
              <Checkbox
                id={`fold-${point.id}`}
                checked={point.enabled}
                onCheckedChange={() => handleTogglePoint(point.id)}
              />
              <Label
                htmlFor={`fold-${point.id}`}
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
