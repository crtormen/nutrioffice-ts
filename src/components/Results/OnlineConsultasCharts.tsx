import { format, parse } from "date-fns";
import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ICustomerConsulta } from "@/domain/entities";
import { MEASURES } from "@/domain/entities/consulta";
import { hasPhotoData } from "@/lib/utils/consultaFilters";

import { CircumferenceProgressChart } from "./CircumferenceProgressChart";
import { CircumferenceRadarChart } from "./CircumferenceRadarChart";
import { PhotoComparisonCard } from "./PhotoComparisonCard";
import { WeightProgressAreaChart } from "./WeightProgressAreaChart";

interface OnlineConsultasChartsProps {
  consultas: ICustomerConsulta[];
  customerId: string;
  userId: string;
}

const COUNT_OPTIONS = [6, 8, 10, 12];

export const OnlineConsultasCharts = ({ consultas, customerId, userId }: OnlineConsultasChartsProps) => {
  const [limit, setLimit] = useState(6);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  if (!consultas || consultas.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Nenhuma consulta online encontrada</p>
      </div>
    );
  }

  // Sort oldest → newest
  const allSorted = [...consultas].sort((a, b) => {
    const dateA = a.date ? new Date(a.date.split("/").reverse().join("-")) : new Date(0);
    const dateB = b.date ? new Date(b.date.split("/").reverse().join("-")) : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });

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

  // Last N within range
  const tableConsultas = filtered.slice(-limit);

  const firstConsulta = allSorted[0];
  const lastConsulta = allSorted[allSorted.length - 1];
  const hasPhotos = hasPhotoData(firstConsulta) || hasPhotoData(lastConsulta);

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
      <th key={c.id} className="px-2 py-2 text-center font-medium">
        {date && !isNaN(date.getTime()) ? format(date, "dd/MM/yy") : "-"}
      </th>
    );
  });

  return (
    <div className="space-y-6">
      {/* Weight Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do Peso</CardTitle>
          <CardDescription>Progresso ao longo do tempo</CardDescription>
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
                  consultaType="online"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Circumference Radar Comparison */}
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

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Histórico de Resultados</CardTitle>
              <CardDescription>Comparação entre consultas</CardDescription>
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
          {/* Peso row */}
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
                    <td className="px-2 py-2 text-muted-foreground w-1/5">Peso</td>
                    {tableConsultas.map((c) => (
                      <td key={c.id} className="px-2 py-2 text-center font-medium">
                        {c.peso ? `${c.peso} kg` : "-"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Circunferências Table */}
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
                      <td className="px-2 py-2 capitalize text-muted-foreground w-1/5">
                        {measure.label}
                      </td>
                      {tableConsultas.map((c) => {
                        const val = c.medidas?.[measure.value as keyof typeof c.medidas];
                        return (
                          <td key={c.id} className="px-2 py-2 text-center font-medium">
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
      {hasPhotos && (
        <PhotoComparisonCard
          beforeConsulta={firstConsulta}
          afterConsulta={lastConsulta}
          showMetrics={true}
        />
      )}

      {!hasPhotos && (
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
    </div>
  );
};
