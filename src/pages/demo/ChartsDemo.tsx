import { useParams } from "react-router-dom";

import { useFetchGoalsQuery } from "@/app/state/features/goalsSlice";
import {
  BodyCompositionBarChart,
  CircumferenceRadarChart,
  CompositionChart,
  MetricsProgressChart,
  ResultsChart,
  WeightProgressAreaChart,
} from "@/components/Results/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/infra/firebase/hooks";

export function ChartsDemo() {
  const { customerId } = useParams<{ customerId: string }>();
  const { dbUid } = useAuth();

  const { data: goals = [] } = useFetchGoalsQuery({
    uid: dbUid!,
    customerId: customerId!,
  });

  const activeGoal = goals.length > 0 ? goals[goals.length - 1] : undefined;

  if (!customerId || !dbUid) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Visualização de Dados
        </h1>
        <p className="text-muted-foreground">
          Todos os gráficos disponíveis para acompanhamento nutricional
        </p>
      </div>

      {/* Weight Progress - Full Width */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Progresso de Peso (Area Chart)</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightProgressAreaChart goal={activeGoal} />
        </CardContent>
      </Card>

      {/* Two Column Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Body Composition Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Composição Corporal ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <BodyCompositionBarChart
              customerId={customerId}
              userId={dbUid}
              limit={6}
            />
          </CardContent>
        </Card>

        {/* Current Composition Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Composição Atual (Pie Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <CompositionChart />
          </CardContent>
        </Card>

        {/* Metrics Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Mudanças</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsProgressChart customerId={customerId} userId={dbUid} />
          </CardContent>
        </Card>

        {/* Circumference Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Medidas Corporais (Radar)</CardTitle>
          </CardHeader>
          <CardContent>
            <CircumferenceRadarChart
              customerId={customerId}
              userId={dbUid}
              compareConsultations={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Line Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gordura Corporal (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsChart param="fat" goal={activeGoal} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Massa Magra (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsChart param="mm" goal={activeGoal} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Massa Gorda (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsChart param="mg" goal={activeGoal} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peso (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsChart param="peso" goal={activeGoal} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
