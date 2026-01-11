import { format, parse } from "date-fns";

import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { useFetchGoalsQuery } from "@/app/state/features/goalsSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ICustomerConsulta } from "@/domain/entities";
import { FOLDS, MEASURES, RESULTS } from "@/domain/entities/consulta";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

import { BodyCompositionBarChart, CompositionChart, ResultsChart } from "./charts";
import { GoalsList } from "./GoalsList";

interface InPersonConsultasChartsProps {
  consultas: ICustomerConsulta[];
  customerId: string;
  currentConsulta?: ICustomerConsulta;
}

export const InPersonConsultasCharts = ({
  consultas,
  customerId,
  currentConsulta,
}: InPersonConsultasChartsProps) => {
  const { dbUid } = useAuth();

  // Fetch all consultas for comparison tables (will be filtered by caller if needed)
  const { data: allConsultas } = useFetchCustomerConsultasQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  // Fetch goals
  const { data: goals } = useFetchGoalsQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  // Find active goal
  const activeGoal = goals?.find((g) => {
    const now = new Date();
    const endDate = g.endDate
      ? new Date(g.endDate.split("/").reverse().join("-"))
      : null;
    return endDate && endDate > now;
  });

  if (!consultas || consultas.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Nenhuma consulta presencial encontrada</p>
      </div>
    );
  }

  // Use the most recent consulta or the provided current consulta
  const displayConsulta = currentConsulta || consultas[0];

  // Sort consultas by date for tables
  const sortedConsultas = allConsultas
    ? [...allConsultas]
        .filter((c) => !c.online) // Only in-person for this view
        .sort(
          (a, b) =>
            new Date(b.date || "").getTime() - new Date(a.date || "").getTime(),
        )
    : [];

  const formatedDate = sortedConsultas.slice(0, 5).map((c) => {
    let date;
    if (c.date) {
      try {
        date = parse(c.date, "dd/MM/yyyy", new Date());
      } catch {
        date = undefined;
      }
    }
    return (
      <th key={c.id} className="px-2 py-2 text-center font-medium">
        {date && !isNaN(date.getTime()) ? format(date, "dd/MM/yy") : "-"}
      </th>
    );
  });

  return (
    <div className="space-y-6">
      {/* Charts Section - Body Composition & Progress */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Current Composition Pie Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base">
              Composição Corporal Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayConsulta.results ? (
              <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                {/* Pie Chart */}
                <div className="flex justify-center">
                  <CompositionChart consulta={displayConsulta} />
                </div>

                {/* Data Table */}
                <div className="space-y-0">
                  <div className="flex justify-between border-b border-dotted border-border/50 py-1.5">
                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                      Peso
                    </span>
                    <span className="text-sm font-medium">
                      {displayConsulta.peso || "-"} kg
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-border/50 py-1.5">
                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                      Massa Gorda
                    </span>
                    <span className="text-sm font-medium">
                      {displayConsulta.results.mg || "-"} kg
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-border/50 py-1.5">
                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                      Massa Magra
                    </span>
                    <span className="text-sm font-medium">
                      {displayConsulta.results.mm || "-"} kg
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-border/50 py-1.5">
                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                      Massa Residual
                    </span>
                    <span className="text-sm font-medium">
                      {displayConsulta.results.mr || "-"} kg
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-border/50 py-1.5 last:border-0">
                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                      Massa Óssea
                    </span>
                    <span className="text-sm font-medium">
                      {displayConsulta.results.mo || "-"} kg
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Dados indisponíveis
              </p>
            )}
          </CardContent>
        </Card>

        {/* Body Fat % Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-base">
              Evolução do Percentual de Gordura
            </CardTitle>
            <CardDescription>Últimas 6 consultas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResultsChart param="fat" goal={activeGoal} />
          </CardContent>
        </Card>
      </div>

      {/* Body Composition Bar Chart Over Time */}
      {customerId && dbUid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Composição Corporal ao Longo do Tempo
            </CardTitle>
            <CardDescription>
              Evolução das massas (gorda, magra, residual, óssea)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BodyCompositionBarChart
              customerId={customerId}
              userId={dbUid}
              limit={6}
            />
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
            <h4 className="mb-3 text-sm font-medium">Resultados</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-medium">Métrica</th>
                    {formatedDate}
                  </tr>
                </thead>
                <tbody>
                  {RESULTS.map((metric) => (
                    <tr key={metric.value} className="border-b">
                      <td className="px-2 py-2 text-muted-foreground">
                        {metric.label}
                      </td>
                      {sortedConsultas.slice(0, 5).map((c) => (
                        <td
                          key={c.id}
                          className="px-2 py-2 text-center font-medium"
                        >
                          {c.results?.[metric.value as keyof typeof c.results] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Add peso row */}
                  <tr className="border-b">
                    <td className="px-2 py-2 text-muted-foreground">Peso</td>
                    {sortedConsultas.slice(0, 5).map((c) => (
                      <td
                        key={c.id}
                        className="px-2 py-2 text-center font-medium"
                      >
                        {c.peso ? `${c.peso} kg` : "-"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Dobras Table */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Dobras Cutâneas</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-medium">Dobra</th>
                    {formatedDate}
                  </tr>
                </thead>
                <tbody>
                  {FOLDS.map((fold) => (
                    <tr key={fold.value} className="border-b">
                      <td className="px-2 py-2 capitalize text-muted-foreground">
                        {fold.label}
                      </td>
                      {sortedConsultas.slice(0, 5).map((c) => (
                        <td
                          key={c.id}
                          className="px-2 py-2 text-center font-medium"
                        >
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

          <div className="h-px bg-border" />

          {/* Medidas Table */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Circunferências</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-medium">Medida</th>
                    {formatedDate}
                  </tr>
                </thead>
                <tbody>
                  {MEASURES.map((measure) => (
                    <tr key={measure.value} className="border-b">
                      <td className="px-2 py-2 capitalize text-muted-foreground">
                        {measure.label}
                      </td>
                      {sortedConsultas.slice(0, 5).map((c) => (
                        <td
                          key={c.id}
                          className="px-2 py-2 text-center font-medium"
                        >
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
            <CardDescription>
              Todas as metas criadas para este cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoalsList customerId={customerId} userId={dbUid} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
