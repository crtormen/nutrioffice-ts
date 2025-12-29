import { IBioimpedance } from "@/domain/entities/consulta";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BioimpedanceFormProps {
  values: IBioimpedance;
  onChange: (bioimpedance: IBioimpedance) => void;
}

export function BioimpedanceForm({ values, onChange }: BioimpedanceFormProps) {
  const handleChange = (field: keyof IBioimpedance, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    onChange({ ...values, [field]: numValue });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bioimpedância</CardTitle>
        <CardDescription>
          Insira os resultados da bioimpedância diretamente do aparelho
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bodyFatPercentage">% Gordura Corporal</Label>
            <Input
              id="bodyFatPercentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0.0"
              value={values.bodyFatPercentage ?? ""}
              onChange={(e) => handleChange("bodyFatPercentage", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leanMass">Massa Magra (kg)</Label>
            <Input
              id="leanMass"
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={values.leanMass ?? ""}
              onChange={(e) => handleChange("leanMass", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fatMass">Massa Gorda (kg)</Label>
            <Input
              id="fatMass"
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={values.fatMass ?? ""}
              onChange={(e) => handleChange("fatMass", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="muscleMass">Massa Muscular (kg)</Label>
            <Input
              id="muscleMass"
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={values.muscleMass ?? ""}
              onChange={(e) => handleChange("muscleMass", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boneMass">Massa Óssea (kg)</Label>
            <Input
              id="boneMass"
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={values.boneMass ?? ""}
              onChange={(e) => handleChange("boneMass", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waterPercentage">% Água Corporal</Label>
            <Input
              id="waterPercentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0.0"
              value={values.waterPercentage ?? ""}
              onChange={(e) => handleChange("waterPercentage", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bmr">Taxa Metabólica Basal (kcal)</Label>
            <Input
              id="bmr"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={values.bmr ?? ""}
              onChange={(e) => handleChange("bmr", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metabolicAge">Idade Metabólica (anos)</Label>
            <Input
              id="metabolicAge"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={values.metabolicAge ?? ""}
              onChange={(e) => handleChange("metabolicAge", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visceralFat">Gordura Visceral (nível)</Label>
            <Input
              id="visceralFat"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={values.visceralFat ?? ""}
              onChange={(e) => handleChange("visceralFat", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
