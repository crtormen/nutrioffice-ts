import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useFetchGoalsQuery } from "@/app/state/features/goalsSlice";
import { GoalStatusBadge } from "./GoalStatusBadge";
import { useGoalProgress } from "./hooks/useGoalProgress";
import { Calendar, Target } from "lucide-react";

interface GoalsListProps {
  customerId: string;
  userId: string;
}

const parameterLabels: Record<string, string> = {
  peso: "Peso",
  fat: "Gordura",
  mm: "M.Magra",
  mg: "M.Gorda",
};

export const GoalsList = ({ customerId, userId }: GoalsListProps) => {
  const { data: goals = [], isLoading } = useFetchGoalsQuery({
    uid: userId,
    customerId,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando metas...</div>;
  }

  if (goals.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhuma meta cadastrada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal, index) => {
        const parameters = Object.keys(goal.params || {});
        const paramSummary = parameters
          .map((p) => {
            const target = goal.params?.[p];
            const label = parameterLabels[p] || p;
            return `${label}: ${target}`;
          })
          .join(", ");

        return (
          <GoalCard
            key={goal.id || index}
            goal={goal}
            customerId={customerId}
            userId={userId}
            paramSummary={paramSummary}
          />
        );
      })}
    </div>
  );
};

const GoalCard = ({
  goal,
  customerId,
  userId,
  paramSummary,
}: {
  goal: any;
  customerId: string;
  userId: string;
  paramSummary: string;
}) => {
  const progressData = useGoalProgress(goal, customerId, userId);

  return (
    <Card className="bg-secondary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              Meta criada em {goal.createdAt}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{paramSummary}</p>
          </div>
          {progressData && <GoalStatusBadge status={progressData.status} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {progressData && (
          <>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Data Final:</span>
              </div>
              <span className="font-medium">{goal.endDate}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Progresso:</span>
              </div>
              <Badge variant="outline">{progressData.totalProgress}%</Badge>
            </div>

            {progressData.daysRemaining > 0 && (
              <div className="text-xs text-muted-foreground">
                {progressData.daysRemaining} dias restantes
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
