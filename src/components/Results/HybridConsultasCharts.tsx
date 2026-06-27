import { format, parse } from "date-fns";
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ICustomerConsulta } from "@/domain/entities";
import { FOLDS, MEASURES, RESULTS } from "@/domain/entities/consulta";
import { cn } from "@/lib/utils";
import { hasPhotoData } from "@/lib/utils/consultaFilters";

import {
  CircumferenceProgressChart,
  CircumferenceRadarChart,
  CompositionChart,
  GoalsList,
  PhotoComparisonCard,
  ResultsChart,
  WeightProgressAreaChart,
} from "./charts";

interface HybridConsultasChartsProps {
  allConsultas: ICustomerConsulta[];
  inPersonConsultas: ICustomerConsulta[];
  customerId: string;
  userId: string;
  currentConsulta?: ICustomerConsulta;
}

const COUNT_OPTIONS = [6, 8, 10, 12];

const sortAsc = (consultas: ICustomerConsulta[]) =>
  [...consultas].sort((a, b) => {
    const da = a.date ? new Date(a.date.split("/").reverse().join("-")) : new Date(0);
    const db = b.date ? new Date(b.date.split("/").reverse().join("-")) : new Date(0);
    return da.getTime() - db.getTime();
  });

export const HybridConsultasCharts = ({
  allConsultas,
  inPersonConsultas,
  customerId,
  userId,
  currentConsulta,
}: HybridConsultasChartsProps) => {
  const [limit, setLimit] = useState(6);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const allSorted = sortAsc(allConsultas);
  const inPersonSorted = sortAsc(inPersonConsultas);

  const displayConsulta =
    currentConsulta && !currentConsulta.online
      ? currentConsulta
      : inPersonSorted.filter((c) => c.results).at(-1);

  const hasMore = allSorted.length > 6;

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

  const tableConsultas = filtered.slice(-limit);

  const consultasWithPhotos = allSorted.filter(hasPhotoData);
  const firstWithPhoto = consultasWithPhotos[0];
  const lastWithPhoto = consultasWithPhotos.at(-1);
  const hasPhotos = consultasWithPhotos.length > 0;

  const formattedDate = tableConsultas.map((c) => {
    let date;
    if (c.date) {
      try {
        date = parse(c.date, "dd/MM/yyyy", new Date());
      } catch {
        date = undefined;
      }
    }
    return (
      <th
        key={c.id}
        className={cn(
          "px-2 py-2 text-center font-medium",
          c.online && "text-muted-foreground",
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <span>{date && !isNaN(date.getTime()) ? format(date, "dd/MM/yy") : "-"}</span>
          {c.online && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 leading-tight">
              Online
            </Badge>
          )}
        </div>
      </th>
    );
  });

  return (
    <div className="space-y-6">
      {/* Weight Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do Peso</CardTitle>
          <CardDescription>Todas as consultas</CardDescription>
        </CardHeader>
        <CardContent>
          <WeightProgressAreaChart />
        </CardContent>
      </Card>

      {/* Circumference Progress Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução das Circunferências</CardTitle>
          <CardDescription>Medidas corporais ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "circ_abdomen", label: "Abdômen" },
              { key: "circ_cintura", label: "Cintura" },
              { key: "circ_gluteo", label: "Glúteos" },
              { key: "circ_braco_dir", label: "Braço Direito" },
              { key: "circ_coxa_dir", label: "Coxa Direita" },
              { key: "circ_panturrilha_dir", label: "Panturrilha Direita" },
            ].map((measure) => (
              <div key={measure.key} className="space-y-2">
                <h4 className="text-center text-sm font-medium">{measure.label}</h4>
                <CircumferenceProgressChart
                  measureKey={measure.key}
                  consultaType="all"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Circumference Radar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparação de Medidas</CardTitle>
          <CardDescription>
            Comparação entre a consulta mais recente e a anterior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CircumferenceRadarChart customerId={customerId} userId={userId} />
        </CardContent>
      </Card>

      {/* Body Composition — presencial only */}
      {inPersonConsultas.length > 0 && displayConsulta && (
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle className="text-base">Composição Corporal Atual</CardTitle>
              <CardDescription>Dados de consultas presenciais</CardDescription>
            </CardHeader>
            <CardContent>
              {displayConsulta.results ? (
                <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                  <div className="flex justify-center">
                    <CompositionChart consulta={displayConsulta} />
                  </div>
                  <div className="space-y-0">
                    {[
                      { label: "Peso", value: `${displayConsulta.peso || "-"} kg` },
                      { label: "Massa Gorda", value: `${displayConsulta.results.mg || "-"} kg` },
                      { label: "Massa Magra", value: `${displayConsulta.results.mm || "-"} kg` },
                      { label: "Massa Residual", value: `${displayConsulta.results.mr || "-"} kg` },
                      { label: "Massa Óssea", value: `${displayConsulta.results.mo || "-"} kg` },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex justify-between border-b border-dotted border-border/50 py-1.5 last:border-0"
                      >
                        <span className="text-sm uppercase tracking-wide text-muted-foreground">
                          {label}
                        </span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Dados indisponíveis</p>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Evolução do Percentual de Gordura</CardTitle>
              <CardDescription>Últimas 6 consultas presenciais</CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsChart param="fat" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unified History Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Histórico de Resultados</CardTitle>
              <CardDescription>Todas as consultas — colunas Online destacadas</CardDescription>
            </div>

            {hasMore && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
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
          {/* Resultados */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Resultados</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-medium">Métrica</th>
                    {formattedDate}
                  </tr>
                </thead>
                <tbody>
                  {RESULTS.map((metric) => (
                    <tr key={metric.value} className="border-b">
                      <td className="w-1/5 px-2 py-2 text-muted-foreground">{metric.label}</td>
                      {tableConsultas.map((c) => (
                        <td
                          key={c.id}
                          className={cn(
                            "px-2 py-2 text-center font-medium",
                            c.online && "bg-muted/30 text-muted-foreground",
                          )}
                        >
                          {c.online
                            ? "—"
                            : (c.results?.[metric.value as keyof typeof c.results] || "-")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Dobras */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Dobras Cutâneas</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-medium">Dobra</th>
                    {formattedDate}
                  </tr>
                </thead>
                <tbody>
                  {FOLDS.map((fold) => (
                    <tr key={fold.value} className="border-b">
                      <td className="w-1/5 px-2 py-2 capitalize text-muted-foreground">
                        {fold.label}
                      </td>
                      {tableConsultas.map((c) => (
                        <td
                          key={c.id}
                          className={cn(
                            "px-2 py-2 text-center font-medium",
                            c.online && "bg-muted/30 text-muted-foreground",
                          )}
                        >
                          {c.online
                            ? "—"
                            : c.dobras?.[fold.value as keyof typeof c.dobras]
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

          {/* Peso */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Peso</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-medium">Métrica</th>
                    {formattedDate}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="w-1/5 px-2 py-2 text-muted-foreground">Peso</td>
                    {tableConsultas.map((c) => (
                      <td
                        key={c.id}
                        className={cn(
                          "px-2 py-2 text-center font-medium",
                          c.online && "bg-muted/30",
                        )}
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

          {/* Circunferências */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Circunferências</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-medium">Medida</th>
                    {formattedDate}
                  </tr>
                </thead>
                <tbody>
                  {MEASURES.map((measure) => (
                    <tr key={measure.value} className="border-b">
                      <td className="w-1/5 px-2 py-2 capitalize text-muted-foreground">
                        {measure.label}
                      </td>
                      {tableConsultas.map((c) => {
                        const val = c.medidas?.[measure.value as keyof typeof c.medidas];
                        return (
                          <td
                            key={c.id}
                            className={cn(
                              "px-2 py-2 text-center font-medium",
                              c.online && "bg-muted/30",
                            )}
                          >
                            {val ? `${val} cm` : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Comparison */}
      {hasPhotos ? (
        <PhotoComparisonCard
          beforeConsulta={firstWithPhoto!}
          afterConsulta={lastWithPhoto!}
          showMetrics={true}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparação de Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
              <p>Nenhuma foto disponível para comparação</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals */}
      {customerId && userId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Metas</CardTitle>
            <CardDescription>Todas as metas criadas para este cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <GoalsList customerId={customerId} userId={userId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
