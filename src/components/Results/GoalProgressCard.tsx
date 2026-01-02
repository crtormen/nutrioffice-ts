import { Calendar, ChevronDown, ChevronUp, Edit, Plus } from "lucide-react";
import { useState } from "react";

import { useFetchGoalsQuery } from "@/app/state/features/goalsSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { NewGoalDialog } from "../Consultas/NewGoalDialog";
import { BodyCompositionBarChart } from "./charts";
import { GoalParameterTab } from "./GoalParameterTab";
import { GoalStatusBadge } from "./GoalStatusBadge";
import { useGoalProgress } from "./hooks/useGoalProgress";

interface GoalProgressCardProps {
  customerId: string;
  userId: string;
  currentConsultaResults?: any;
  currentConsulta?: {
    id: string;
    results?: { fat?: number; mg?: number; mm?: number; mr?: number; mo?: number };
    peso?: string;
  };
}

const parameterLabels: Record<string, string> = {
  peso: "Peso",
  fat: "Gordura",
  mm: "M.Magra",
  mg: "M.Gorda",
};

export const GoalProgressCard = ({
  customerId,
  userId,
  currentConsultaResults,
  currentConsulta,
}: GoalProgressCardProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const { data: goals = [] } = useFetchGoalsQuery({
    uid: userId,
    customerId,
  });

  // Get the most recent goal by sorting by createdAt date
  const activeGoal = goals.length > 0
    ? [...goals].sort((a, b) => {
        // Parse dates in dd/MM/yyyy format
        const parseDate = (dateStr: string) => {
          const [day, month, year] = dateStr.split('/');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        };

        const dateA = parseDate(a.createdAt || '01/01/1970');
        const dateB = parseDate(b.createdAt || '01/01/1970');

        // Sort descending (newest first)
        return dateB.getTime() - dateA.getTime();
      })[0]
    : undefined;

  const progressData = useGoalProgress(
    activeGoal,
    customerId,
    userId,
    currentConsultaResults,
  );

  // No goal exists
  if (!activeGoal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meta Atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O cliente não possui meta definida. Crie uma meta após preencher os
            dados de avaliação.
          </p>
          <NewGoalDialog consulta={currentConsulta}>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Criar Meta
            </Button>
          </NewGoalDialog>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return null;
  }

  const { totalProgress, daysRemaining, status, parameterProgress } =
    progressData;

  const parameters = Object.keys(activeGoal.params || {});
  const showEditButton = status !== "achieved";
  const showNewGoalButton = status === "achieved";

  // Build goal summary text
  const goalSummary = parameters
    .map((p) => {
      const target = activeGoal.params?.[p];
      const label = parameterLabels[p] || p;
      return `${label}: ${target}`;
    })
    .join(" | ");

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Meta Atual</CardTitle>
                  <GoalStatusBadge status={status} />
                </div>
                <p className="text-sm text-muted-foreground">{goalSummary}</p>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progresso Geral</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{totalProgress}%</span>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {daysRemaining} dias restantes
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min(totalProgress, 100)}
                className="h-3"
                indicatorClassName={
                  status === "achieved"
                    ? "bg-chart-2"
                    : status === "behind"
                      ? "bg-chart-1"
                      : "bg-chart-2"
                }
              />
            </div>

            {/* Tabs for Parameters */}
            <Tabs defaultValue={parameters[0] || "overview"} className="w-full">
              <TabsList
                className="grid w-full"
                style={{
                  gridTemplateColumns: `repeat(${parameters.length + 1}, minmax(0, 1fr))`,
                }}
              >
                {parameters.map((param) => (
                  <TabsTrigger key={param} value={param} className="text-xs">
                    {parameterLabels[param] || param}
                  </TabsTrigger>
                ))}
                <TabsTrigger value="overview" className="text-xs">
                  Visão Geral
                </TabsTrigger>
              </TabsList>

              {parameters.map((param) => {
                const metrics = parameterProgress[param];
                return (
                  <TabsContent key={param} value={param} className="mt-4">
                    <GoalParameterTab
                      parameter={param}
                      goal={activeGoal}
                      currentValue={metrics?.currentValue}
                      initialValue={metrics?.initialValue}
                      targetValue={metrics?.targetValue}
                      progress={metrics?.progress || 0}
                      isAchieved={metrics?.isAchieved || false}
                      isOnTrack={metrics?.isOnTrack || false}
                      trend={metrics?.trend || "stable"}
                    />
                  </TabsContent>
                );
              })}

              <TabsContent value="overview" className="mt-4">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-card p-4">
                    <h4 className="mb-4 text-sm font-medium">
                      Composição Corporal
                    </h4>
                    <BodyCompositionBarChart
                      customerId={customerId}
                      userId={userId}
                      limit={6}
                    />
                  </div>

                  {/* Summary of all parameters */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      Resumo dos Parâmetros
                    </h4>
                    {parameters.map((param) => {
                      const metrics = parameterProgress[param];
                      const label = parameterLabels[param] || param;
                      return (
                        <div
                          key={param}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">
                            {metrics?.progress || 0}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {showEditButton && (
                <NewGoalDialog consulta={currentConsulta}>
                  <Button variant="outline" className="flex-1">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Meta
                  </Button>
                </NewGoalDialog>
              )}
              {showNewGoalButton && (
                <NewGoalDialog consulta={currentConsulta}>
                  <Button className="flex-1">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Meta
                  </Button>
                </NewGoalDialog>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
