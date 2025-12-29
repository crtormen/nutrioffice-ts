import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { IGoal } from "@/domain/entities";

import { ResultsChart, WeightProgressAreaChart } from "./charts";

interface GoalParameterTabProps {
  parameter: string;
  goal: IGoal;
  currentValue: number | undefined;
  initialValue: number | undefined;
  targetValue: number | undefined;
  progress: number;
  isAchieved: boolean;
  isOnTrack: boolean;
  trend: "up" | "down" | "stable";
}

const parameterLabels: Record<string, { label: string; unit: string }> = {
  peso: { label: "Peso", unit: "kg" },
  fat: { label: "Gordura Corporal", unit: "%" },
  mm: { label: "Massa Magra", unit: "kg" },
  mg: { label: "Massa Gorda", unit: "kg" },
};

const getTrendIcon = (trend: "up" | "down" | "stable") => {
  switch (trend) {
    case "up":
      return <ArrowUp className="text-chart-3 h-4 w-4" />;
    case "down":
      return <ArrowDown className="text-chart-2 h-4 w-4" />;
    case "stable":
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const getProgressColor = (
  progress: number,
  isOnTrack: boolean,
  isAchieved: boolean,
) => {
  if (isAchieved) return "bg-chart-2"; // Green
  if (isOnTrack) return "bg-chart-2"; // Green
  if (progress > 50) return "bg-chart-5"; // Orange
  return "bg-chart-1"; // Red
};

export const GoalParameterTab = ({
  parameter,
  goal,
  currentValue,
  initialValue,
  targetValue,
  progress,
  isAchieved,
  isOnTrack,
  trend,
}: GoalParameterTabProps) => {
  const config = parameterLabels[parameter] || {
    label: parameter,
    unit: "",
  };

  const progressClamped = Math.min(Math.max(progress, 0), 100);
  const progressColor = getProgressColor(progress, isOnTrack, isAchieved);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="rounded-lg border bg-card">
        {parameter === "peso" ? (
          <WeightProgressAreaChart goal={goal} />
        ) : (
          <ResultsChart param={parameter} goal={goal} />
        )}
      </div>

      {/* Values Display */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Inicial</p>
          <p className="text-2xl font-bold">
            {initialValue !== undefined
              ? `${initialValue.toFixed(1)}${config.unit}`
              : "-"}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Atual</p>
            {getTrendIcon(trend)}
          </div>
          <p className="text-2xl font-bold">
            {currentValue !== undefined
              ? `${currentValue.toFixed(1)}${config.unit}`
              : "-"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Meta</p>
          <p className="text-2xl font-bold text-primary">
            {targetValue !== undefined
              ? `${targetValue.toFixed(1)}${config.unit}`
              : "-"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{config.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{progress}%</span>
            {isAchieved && (
              <Badge variant="secondary" className="text-xs">
                Alcançado!
              </Badge>
            )}
            {!isAchieved && !isOnTrack && (
              <Badge variant="destructive" className="text-xs">
                Atrasado
              </Badge>
            )}
          </div>
        </div>
        <Progress
          value={progressClamped}
          className="h-3"
          indicatorClassName={progressColor}
        />
      </div>
    </div>
  );
};
