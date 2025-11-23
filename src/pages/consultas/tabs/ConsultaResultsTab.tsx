import React from "react";
import { useParams } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { format, parse } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGetCustomerConsultaData } from "@/components/Consultas/hooks/useGetCustomerConsultas";
import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { useFetchGoalsQuery } from "@/app/state/features/goalsSlice";
import { useAuth } from "@/infra/firebase/hooks/useAuth";
import { GoalProgressCard } from "@/components/Results/GoalProgressCard";
import { GoalsList } from "@/components/Results/GoalsList";
import { NewGoalDialog } from "@/components/Consultas/NewGoalDialog";
import {
  BodyCompositionBarChart,
  WeightProgressAreaChart,
  CircumferenceRadarChart,
  MetricsProgressChart,
  CompositionChart,
  ResultsChart,
} from "@/components/Results/charts";
import { RESULTS, FOLDS, MEASURES } from "@/domain/entities/consulta";

const ConsultaResultsTab: React.FC = () => {
  const { customerId, consultaId } = useParams<{ customerId: string; consultaId: string }>();
  const { dbUid } = useAuth();
  const consulta = useGetCustomerConsultaData(customerId, consultaId);

  // Fetch all consultas for comparison tables
  const { data: consultas } = useFetchCustomerConsultasQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  // Fetch goals
  const { data: goals } = useFetchGoalsQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  // Find active goal
  const activeGoal = goals?.find(g => {
    const now = new Date();
    const endDate = g.endDate ? new Date(g.endDate.split('/').reverse().join('-')) : null;
    return endDate && endDate > now;
  });

  if (!consulta) {
    return <div>Carregando...</div>;
  }

  // Sort consultas by date for tables
  const sortedConsultas = consultas
    ? [...consultas].sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
    : [];

  const formatedDate = 
    sortedConsultas.slice(0, 5).map((c) => {
      let date;
      if (c.date) {
        try {
          date = parse(c.date, "dd/MM/yyyy", new Date());
        }
        catch {
          date = undefined
        }
      }
      return (
        <th key={c.id} className="text-center py-2 px-2 font-medium">
          {date && !isNaN(date.getTime()) ? format(date, "dd/MM/yy") : "-"}
        </th>
      )}
    );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Metas e Resultados</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Gerar PDF
          </Button>
          <NewGoalDialog>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </NewGoalDialog>
        </div>
      </div>

      <Separator />

      {/* Active Goal Progress Card */}
      {activeGoal && customerId && dbUid && (
        <GoalProgressCard
          customerId={customerId}
          userId={dbUid}
          currentConsultaResults={consulta.results}
        />
      )}

      {/* Charts Section - Body Composition & Progress */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Body Fat % Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução do Percentual de Gordura</CardTitle>
            <CardDescription>Últimas 6 consultas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResultsChart param="fat" goal={activeGoal} />
          </CardContent>
        </Card>

        {/* Current Composition Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composição Corporal Atual</CardTitle>
          </CardHeader>
          <CardContent>
            {consulta.results ? (
              <>
                <CompositionChart />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Peso:</span>
                    <span className="font-medium">{consulta.peso || "-"} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Massa Gorda:</span>
                    <span className="font-medium">{consulta.results.mg || "-"} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Massa Magra:</span>
                    <span className="font-medium">{consulta.results.mm || "-"} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Massa Residual:</span>
                    <span className="font-medium">{consulta.results.mr || "-"} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Massa Óssea:</span>
                    <span className="font-medium">{consulta.results.mo || "-"} kg</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Dados indisponíveis</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Body Composition Bar Chart Over Time */}
      {customerId && dbUid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composição Corporal ao Longo do Tempo</CardTitle>
            <CardDescription>Evolução das massas (gorda, magra, residual, óssea)</CardDescription>
          </CardHeader>
          <CardContent>
            <BodyCompositionBarChart customerId={customerId} userId={dbUid} limit={6} />
          </CardContent>
        </Card>
      )}

      {/* Data Tables Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Resultados</CardTitle>
          <CardDescription>Comparação entre consultas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Results Table */}
          <div>
            <h4 className="text-sm font-medium mb-3">Resultados</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Métrica</th>
                    {formatedDate}
                  </tr>
                </thead>
                <tbody>
                  {RESULTS.map((metric) => (
                    <tr key={metric.value} className="border-b">
                      <td className="py-2 px-2 text-muted-foreground">{metric.label}</td>
                      {sortedConsultas.slice(0, 5).map((c) => (
                        <td key={c.id} className="text-center py-2 px-2 font-medium">
                          {c.results?.[metric.value as keyof typeof c.results] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Add peso row */}
                  <tr className="border-b">
                    <td className="py-2 px-2 text-muted-foreground">Peso</td>
                    {sortedConsultas.slice(0, 5).map((c) => (
                      <td key={c.id} className="text-center py-2 px-2 font-medium">
                        {c.peso ? `${c.peso} kg` : "-"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Dobras Table */}
          <div>
            <h4 className="text-sm font-medium mb-3">Dobras Cutâneas</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Dobra</th>
                    {formatedDate}
                  </tr>
                </thead>
                <tbody>
                  {FOLDS.map((fold) => (
                    <tr key={fold.value} className="border-b">
                      <td className="py-2 px-2 text-muted-foreground capitalize">{fold.label}</td>
                      {sortedConsultas.slice(0, 5).map((c) => (
                        <td key={c.id} className="text-center py-2 px-2 font-medium">
                          {c.dobras?.[fold.value as keyof typeof c.dobras]
                            ? `${c.dobras[fold.value as keyof typeof c.dobras]} mm`
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Medidas Table */}
          <div>
            <h4 className="text-sm font-medium mb-3">Circunferências</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Medida</th>
                    {formatedDate}
                  </tr>
                </thead>
                <tbody>
                  {MEASURES.map((measure) => (
                    <tr key={measure.value} className="border-b">
                      <td className="py-2 px-2 text-muted-foreground capitalize">{measure.label}</td>
                      {sortedConsultas.slice(0, 5).map((c) => (
                        <td key={c.id} className="text-center py-2 px-2 font-medium">
                          {c.medidas?.[measure.value as keyof typeof c.medidas]
                            ? `${c.medidas[measure.value as keyof typeof c.medidas]} cm`
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals History */}
      {customerId && dbUid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Metas</CardTitle>
            <CardDescription>Todas as metas criadas para este cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <GoalsList customerId={customerId} userId={dbUid} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConsultaResultsTab;
