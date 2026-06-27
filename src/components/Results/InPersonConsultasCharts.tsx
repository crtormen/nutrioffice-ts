import { format, parse } from "date-fns";
import { useState } from "react";

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

import { CompositionChart, ResultsChart } from "./charts";
import { GoalsList } from "./GoalsList";

interface InPersonConsultasChartsProps {
  consultas: ICustomerConsulta[];
  customerId: string;
  currentConsulta?: ICustomerConsulta;
}

const COUNT_OPTIONS = [6, 8, 10, 12];

export const InPersonConsultasCharts = ({
  consultas,
  customerId,
  currentConsulta,
}: InPersonConsultasChartsProps) => {
  const { dbUid } = useAuth();
  const [limit, setLimit] = useState(6);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: allConsultas } = useFetchCustomerConsultasQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  const { data: goals } = useFetchGoalsQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

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

  // Sort oldest → newest
  const allSorted = allConsultas
    ? [...allConsultas]
        .filter((c) => !c.online)
        .sort(
          (a, b) =>
            new Date(a.date ? a.date.split("/").reverse().join("-") : "").getTime() -
            new Date(b.date ? b.date.split("/").reverse().join("-") : "").getTime(),
        )
    : [];

  const displayConsulta = currentConsulta || allSorted[allSorted.length - 1] || consultas[0];

  const hasMore = allSorted.length > 6;

  // Apply date range filter first
  const parseDateStr = (d: string) =>
    d ? parse(d, "dd/MM/yyyy", new Date()) : null;

  const filtered = allSorted.filter((c) => {
    if (!fromDate && !toDate) return true;
    const cDate = parseDateStr(c.date || "");
    if (!cDate || isNaN(cDate.getTime())) return true;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (from && cDate < from) return false;
    if (to && cDate > to) return false;
    return true;
  });

  // Take the last N from filtered (the most recent ones within range)
  const tableConsultas = filtered.slice(-limit);

  const formatedDate = tableConsultas.map((c) => {
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
                <div className="flex justify-center" data-chart-type="composition">
                  <CompositionChart consulta={displayConsulta} />
                </div>

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
          <CardContent data-chart-type="fat-progress">
            <ResultsChart param="fat" />
          </CardContent>
        </Card>
      </div>

      {/* Data Tables Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Histórico de Resultados</CardTitle>
              <CardDescription>Comparação entre consultas</CardDescription>
            </div>

            {hasMore && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {/* Date range */}
                <div className="flex items-center gap-1.5">
                  <label className="text-muted-foreground whitespace-nowrap">De</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-muted-foreground whitespace-nowrap">Até</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {/* Count selector */}
                <div className="flex items-center gap-1.5">
                  <label className="text-muted-foreground whitespace-nowrap">Mostrar</label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {COUNT_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {(fromDate || toDate) && (
                  <button
                    onClick={() => { setFromDate(""); setToDate(""); }}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
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
                      <td className="px-2 py-2 text-muted-foreground w-1/5">
                        {metric.label}
                      </td>
                      {tableConsultas.map((c) => (
                        <td
                          key={c.id}
                          className={"px-2 py-2 text-center font-medium ".concat(c.id === displayConsulta.id ? "bg-primary/20" : "")}
                        >
                          {c.results?.[metric.value as keyof typeof c.results] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b">
                    <td className="px-2 py-2 text-muted-foreground">Peso</td>
                    {tableConsultas.map((c) => (
                      <td
                        key={c.id}
                        className={"px-2 py-2 text-center font-medium ".concat(c.id === displayConsulta.id ? "bg-primary/20" : "")}
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
                      <td className="px-2 py-2 capitalize text-muted-foreground w-1/5">
                        {fold.label}
                      </td>
                      {tableConsultas.map((c) => (
                        <td
                          key={c.id}
                          className={"px-2 py-2 text-center font-medium ".concat(c.id === displayConsulta.id ? "bg-primary/20" : "")}
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
                      <td className="px-2 py-2 capitalize text-muted-foreground w-1/5">
                        {measure.label}
                      </td>
                      {tableConsultas.map((c) => (
                        <td
                          key={c.id}
                          className={"px-2 py-2 text-center font-medium ".concat(c.id === displayConsulta.id ? "bg-primary/20" : "")}
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
