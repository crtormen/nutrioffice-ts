import { useState } from "react";
import { toast } from "sonner";
import { Calculator, Loader2 } from "lucide-react";

import { auth } from "@/infra/firebase/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IFolds } from "@/domain/entities/consulta";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/nutri-office/us-central1/api";

interface BodyCompositionCalculatorProps {
  customerId: string;
  customerGender: "M" | "F";
  customerAge: number;
  weight: number;
  height?: number;
  folds: IFolds;
  onResultsCalculated?: (results: any) => void;
}

interface CalculationResults {
  bodyDensity?: number;
  bodyFatPercentage: number;
  fatMass: number;
  leanMass: number;
  muscleMass?: number;
  boneMass?: number;
  residualMass?: number;
  formula: string;
  sumOfFolds?: number;
}

export function BodyCompositionCalculator({
  customerGender,
  customerAge,
  weight,
  height,
  folds,
  onResultsCalculated,
}: BodyCompositionCalculatorProps) {
  const [protocol, setProtocol] = useState<"jp3" | "jp7" | "dw4">("jp7");
  const [densityEquation, setDensityEquation] = useState<"siri" | "brozek">("siri");
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const handleCalculate = async () => {
    if (!folds || Object.keys(folds).length === 0) {
      toast.error("Nenhum dado de dobras cutâneas disponível para cálculo");
      return;
    }

    setIsCalculating(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const token = await user.getIdToken();
      const uid = user.uid;

      const response = await fetch(`${API_BASE_URL}/users/${uid}/calculate-body-composition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gender: customerGender,
          age: customerAge,
          weight,
          height,
          folds,
          protocol,
          densityEquation,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao calcular composição corporal");
      }

      const calculationResults = await response.json();
      setResults(calculationResults);

      if (onResultsCalculated) {
        onResultsCalculated(calculationResults);
      }

      toast.success("Composição corporal calculada com sucesso!");
    } catch (error: any) {
      console.error("Error calculating body composition:", error);
      toast.error(error.message || "Erro ao calcular composição corporal");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Composição Corporal
        </CardTitle>
        <CardDescription>
          Calcule a composição corporal usando diferentes protocolos antropométricos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Protocol Selection */}
        <div className="space-y-2">
          <Label htmlFor="protocol">Protocolo de Cálculo</Label>
          <Select value={protocol} onValueChange={(value: any) => setProtocol(value)}>
            <SelectTrigger id="protocol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jp3">Jackson-Pollock 3 Dobras</SelectItem>
              <SelectItem value="jp7">Jackson-Pollock 7 Dobras (padrão)</SelectItem>
              <SelectItem value="dw4">Durnin-Womersley 4 Dobras</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {protocol === "jp3" && "Usa: Peitoral, Abdômen, Coxa"}
            {protocol === "jp7" && "Usa: Tríceps, Peitoral, Subescapular, Axilar, Supra-ilíaca, Abdômen, Coxa"}
            {protocol === "dw4" && "Usa: Bíceps, Tríceps, Subescapular, Supra-ilíaca"}
          </p>
        </div>

        {/* Density Equation Selection */}
        <div className="space-y-2">
          <Label htmlFor="densityEquation">Equação de Conversão</Label>
          <Select value={densityEquation} onValueChange={(value: any) => setDensityEquation(value)}>
            <SelectTrigger id="densityEquation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="siri">Siri (1961)</SelectItem>
              <SelectItem value="brozek">Brozek (1963)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Converte densidade corporal em percentual de gordura
          </p>
        </div>

        {/* Calculate Button */}
        <Button onClick={handleCalculate} disabled={isCalculating} className="w-full">
          {isCalculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Calcular Composição Corporal
            </>
          )}
        </Button>

        {/* Results Display */}
        {results && (
          <div className="mt-4 space-y-3 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-sm font-medium">Resultados</h4>
              <span className="text-xs text-muted-foreground">{results.formula}</span>
            </div>

            <div className="grid gap-2 text-sm">
              {results.sumOfFolds !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Soma de Dobras:</span>
                  <span className="font-medium">{results.sumOfFolds} mm</span>
                </div>
              )}

              {results.bodyDensity !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Densidade Corporal:</span>
                  <span className="font-medium">{results.bodyDensity} g/cm³</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">% Gordura:</span>
                <span className="font-semibold text-primary">{results.bodyFatPercentage}%</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Massa Gorda:</span>
                <span className="font-medium">{results.fatMass} kg</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Massa Magra:</span>
                <span className="font-medium">{results.leanMass} kg</span>
              </div>

              {results.muscleMass !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Massa Muscular:</span>
                  <span className="font-medium">{results.muscleMass} kg</span>
                </div>
              )}

              {results.boneMass !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Massa Óssea:</span>
                  <span className="font-medium">{results.boneMass} kg</span>
                </div>
              )}

              {results.residualMass !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Massa Residual:</span>
                  <span className="font-medium">{results.residualMass} kg</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
