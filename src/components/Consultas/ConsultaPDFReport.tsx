import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Loader2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { useFetchGoalsQuery } from "@/app/state/features/goalsSlice";
import { Button } from "@/components/ui/button";
import {
  CircumferenceProgressChart,
  CircumferenceRadarChart,
  CompositionChart,
  ResultsChart,
  WeightProgressAreaChart,
} from "@/components/Results/charts";
import { useGoalProgress } from "@/components/Results/hooks/useGoalProgress";
import {
  FOLDS,
  ICustomerConsulta,
  MEASURES,
  RESULTS,
} from "@/domain/entities/consulta";
import { ICustomer } from "@/domain/entities/customer";
import { useAuth } from "@/infra/firebase";

interface ConsultaPDFReportProps {
  consulta: ICustomerConsulta;
  customer: ICustomer | undefined;
  customerId: string;
}

const CIRC_CHARTS = [
  { key: "circ_abdomen", label: "Abdômen" },
  { key: "circ_cintura", label: "Cintura" },
  { key: "circ_gluteo", label: "Glúteos" },
  { key: "circ_braco_dir", label: "Braço Direito" },
  { key: "circ_coxa_dir", label: "Coxa Direita" },
  { key: "circ_panturrilha_dir", label: "Panturrilha Direita" },
];


export const ConsultaPDFReport: React.FC<ConsultaPDFReportProps> = ({
  consulta,
  customer,
  customerId,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);
  const captureRef = useRef(false);
  const { dbUid } = useAuth();

  const { data: allConsultas = [] } = useFetchCustomerConsultasQuery({
    uid: dbUid,
    customerId,
  });

  const { data: goals = [] } = useFetchGoalsQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  const activeGoal = goals.find((g) => {
    const now = new Date();
    const endDate = g.endDate
      ? new Date(g.endDate.split("/").reverse().join("-"))
      : null;
    return endDate && endDate > now;
  });

  const goalProgress = useGoalProgress(activeGoal, customerId, dbUid || "", consulta.results);

  const isOnline = !!consulta.online;
  const hasResults = !!consulta.results && Object.keys(consulta.results).length > 0;

  const sortedConsultas = [...allConsultas].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    try {
      return parse(a.date, "dd/MM/yyyy", new Date()).getTime() -
             parse(b.date, "dd/MM/yyyy", new Date()).getTime();
    } catch { return 0; }
  });

  const currentIndex = sortedConsultas.findIndex((c) => c.id === consulta.id);
  // Last 5 across all types (mixed online + presencial)
  const tableConsultas = sortedConsultas.slice(
    Math.max(0, currentIndex - 4),
    currentIndex + 1,
  );
  const multipleConsultas = tableConsultas.length > 1;

  const formatCustomerName = (name?: string): string => {
    if (!name) return "";
    return name.split(/[\(\[\|]/)[0].trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return format(parse(dateString, "dd/MM/yyyy", new Date()), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch { return dateString; }
  };

  const handlePrint = () => {
    captureRef.current = true;
    setIsGenerating(true);
    setChartsReady(true);
  };

  // Runs after React commits the chart render to the DOM
  useEffect(() => {
    if (!chartsReady || !captureRef.current) return;

    const run = async () => {
      try {
        // Wait for ResizeObserver to measure and Recharts to paint
        await new Promise((resolve) => setTimeout(resolve, 800));

        const ref = printRef.current;
        if (!ref) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const styles = Array.from(document.styleSheets)
          .map((ss) => {
            try { return Array.from(ss.cssRules).map((r) => r.cssText).join("\n"); }
            catch { return ""; }
          })
          .join("\n");

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Relatório de Consulta - ${formatCustomerName(customer?.name)}</title>
              <style>
                ${styles}
                @media print {
                  body { margin: 0; padding: 20px; }
                  .no-print { display: none !important; }
                  .page-break { page-break-after: always; }
                  table { page-break-inside: avoid; }
                  .table-section { page-break-inside: avoid; }
                  h2 { page-break-after: avoid; }
                  svg { max-width: 100%; height: auto; }
                }
                @page { size: A4; margin: 2cm; }
              </style>
            </head>
            <body>${ref.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          captureRef.current = false;
          setIsGenerating(false);
          setChartsReady(false);
        }, 800);
      } catch (err) {
        console.error("Error generating PDF:", err);
        captureRef.current = false;
        setIsGenerating(false);
        setChartsReady(false);
      }
    };

    run();
  }, [chartsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePrint} disabled={isGenerating}>
        {isGenerating ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</>
        ) : (
          <><FileText className="mr-2 h-4 w-4" />Gerar PDF</>
        )}
      </Button>

      {/* Hidden print content — only mounted when generating to avoid 0x0 chart warnings */}
      {chartsReady && <div ref={printRef} style={{ position: "absolute", top: 0, left: 0, width: "794px", visibility: "hidden", pointerEvents: "none", zIndex: -1 }}>
        <div className="bg-white p-6 text-black" style={{ width: "794px" }}>

          {/* Header */}
          <div className="mb-8 border-b-2 border-gray-300 pb-3 text-center">
            <h1 className="mb-1 text-2xl font-bold">Relatório de Avaliação Nutricional</h1>
            <p className="text-base text-gray-600">
              {formatCustomerName(customer?.name)} — {formatDate(consulta.date)}
              {isOnline && <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Online</span>}
            </p>
          </div>

          {/* Patient Info */}
          <div className="mb-10">
            <h2 className="mb-4 border-b border-gray-300 pb-1 text-lg font-bold">Dados do Paciente</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-semibold">Nome:</span> {formatCustomerName(customer?.name)}</div>
              <div><span className="font-semibold">Email:</span> {customer?.email}</div>
              <div><span className="font-semibold">Telefone:</span> {customer?.phone}</div>
              <div><span className="font-semibold">Data de Nascimento:</span> {customer?.birthday}</div>
            </div>
          </div>

          {/* Consultation Data */}
          <div className="mb-12">
            <h2 className="mb-4 border-b border-gray-300 pb-1 text-lg font-bold">Dados da Consulta</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-semibold">Data:</span> {formatDate(consulta.date)}</div>
              <div><span className="font-semibold">Peso:</span> {consulta.peso} kg</div>
              <div><span className="font-semibold">Idade:</span> {consulta.idade} anos</div>
              {consulta.structure?.altura && (
                <div><span className="font-semibold">Altura:</span> {consulta.structure.altura} cm</div>
              )}
            </div>
          </div>
          
          {/* ── ONLINE / HYBRID Circunferencias ────────────────────────────────── */}
          { isOnline && (
            consulta.medidas && Object.keys(consulta.medidas).length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">Circunferências</h2>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Medida</th>
                      {tableConsultas.map((c) => (
                        <th key={c.id} className={"border border-gray-300 p-2 text-right" + (c.id === consulta.id ? " bg-blue-100" : "")}>
                          {c.date || "-"}{c.online ? " *" : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MEASURES.map((measure) => {
                      const hasAny = tableConsultas.some((c) => (c.medidas as any)?.[measure.value]);
                      if (!hasAny) return null;
                      return (
                        <tr key={measure.value}>
                          <td className="border border-gray-300 p-2">{measure.label}</td>
                          {tableConsultas.map((c) => {
                            const val = (c.medidas as any)?.[measure.value];
                            return (
                              <td key={c.id} className={"border border-gray-300 p-2 text-right font-semibold" + (c.id === consulta.id ? " bg-blue-50" : "")}>
                                {val ? `${val} cm` : "-"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {tableConsultas.some((c) => c.online) && (
                  <p className="mt-1 text-xs text-gray-500">* Consulta online (autoaferida)</p>
                )}
              </div>
            )
          )}

          {/* ── PRESENCIAL CHARTS ─────────────────────────────────────── */}
          {!isOnline && hasResults && (
            <>
              <div className="mb-12" style={{ breakInside: "avoid" }}>
                <h2 className="mb-6 border-b border-gray-300 pb-1 text-lg font-bold">
                  {allConsultas.length > 1 ? "Gráficos de Avaliação" : "Avaliação Inicial"}
                </h2>

                {allConsultas.length > 1 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Composition pie */}
                    <div className="rounded border border-gray-300 p-3">
                      <h3 className="mb-2 text-center text-sm font-semibold">Composição Corporal Atual</h3>
                      <div data-pdf-chart="composition" className="mb-3 flex justify-center">
                        <CompositionChart consulta={consulta} />
                      </div>
                      <div className="space-y-1 text-xs">
                        {[
                          ["Peso", `${consulta.peso || "-"} kg`],
                          ["Massa Gorda", `${consulta.results?.mg?.toFixed(2) || "-"} kg`],
                          ["Massa Magra", `${consulta.results?.mm?.toFixed(2) || "-"} kg`],
                          ["Massa Residual", `${consulta.results?.mr?.toFixed(2) || "-"} kg`],
                          ["Massa Óssea", `${consulta.results?.mo?.toFixed(2) || "-"} kg`],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between border-b border-dotted py-1 last:border-0">
                            <span className="uppercase text-gray-600">{label}</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fat % progress */}
                    <div className="rounded border border-gray-300 p-3">
                      <h3 className="mb-2 text-center text-sm font-semibold">Evolução do Percentual de Gordura</h3>
                      <p className="mb-2 text-center text-xs text-gray-500">Últimas 6 consultas presenciais</p>
                      <div data-pdf-chart="fat-progress">
                        <ResultsChart param="fat" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* First consultation summary */
                  <div className="rounded border border-gray-300 bg-blue-50 p-4">
                    <div className="mb-3 text-center">
                      <p className="text-sm font-medium text-blue-900">Primeira Avaliação</p>
                      <p className="text-xs text-blue-700">Ponto de partida para acompanhamento da evolução</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <div>
                        <h3 className="mb-2 text-sm font-semibold">Composição Corporal</h3>
                        <div className="space-y-1 text-xs">
                          {[
                            ["Gordura Corporal", `${consulta.results?.fat?.toFixed(2) || "-"}%`],
                            ["Massa Gorda", `${consulta.results?.mg?.toFixed(2) || "-"} kg`],
                            ["Massa Magra", `${consulta.results?.mm?.toFixed(2) || "-"} kg`],
                            ["Massa Residual", `${consulta.results?.mr?.toFixed(2) || "-"} kg`],
                            ["Massa Óssea", `${consulta.results?.mo?.toFixed(2) || "-"} kg`],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-gray-600">{label}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-2 text-sm font-semibold">Medidas Principais</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Peso Total:</span>
                            <span className="font-medium">{consulta.peso || "-"} kg</span>
                          </div>
                          {consulta.structure?.altura && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Altura:</span>
                              <span className="font-medium">{consulta.structure.altura} cm</span>
                            </div>
                          )}
                          {consulta.results?.dobras && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Soma de Dobras:</span>
                              <span className="font-medium">{consulta.results.dobras.toFixed(2)} mm</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── ONLINE / HYBRID CHARTS ────────────────────────────────── */}
          {(isOnline || (!isOnline && allConsultas.some((c) => c.online))) && (
            <div className="mb-12">
              <h2 className="mb-6 border-b border-gray-300 pb-1 text-lg font-bold">
                Evolução de Peso e Medidas
              </h2>

              {/* Weight chart + Radar chart together — avoid page break between them */}
              <div className="mb-10" style={{ breakInside: "avoid" }}>
                <div className="mb-4 rounded border border-gray-300 p-3">
                  <h3 className="mb-2 text-center text-sm font-semibold">Evolução do Peso</h3>
                  <div data-pdf-chart="weight-progress">
                    <WeightProgressAreaChart />
                  </div>
                </div>
                <div className="rounded border border-gray-300 p-3">
                  <h3 className="mb-2 text-center text-sm font-semibold">Comparação de Medidas</h3>
                  <p className="mb-2 text-center text-xs text-gray-500">Consulta mais recente vs anterior</p>
                  <div data-pdf-chart="circ-radar">
                    <CircumferenceRadarChart customerId={customerId} userId={dbUid || ""} consultas={allConsultas} />
                  </div>
                </div>
              </div>

              {/* 6 circumference charts in 2-col grid — keep as one block */}
              <div className="mb-6 rounded border border-gray-300 p-3" style={{ breakInside: "avoid" }}>
                <h3 className="mb-3 text-center text-sm font-semibold">Evolução das Circunferências</h3>
                <div className="grid grid-cols-2 gap-4">
                  {CIRC_CHARTS.map((m) => (
                    <div key={m.key} style={{ breakInside: "avoid" }}>
                      <p className="mb-1 text-center text-xs font-medium text-gray-700">{m.label}</p>
                      <div data-pdf-chart={`circ-${m.key}`}>
                        <CircumferenceProgressChart measureKey={m.key} consultaType="all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── GOAL SECTION ──────────────────────────────────────────── */}
          {activeGoal && goalProgress && (
            <div className="mb-8" style={{ breakBefore: "page" }}>
              {/* Header + summary */}
              <div style={{ breakInside: "avoid" }}>
                <h2 className="mb-4 border-b border-gray-300 pb-1 text-lg font-bold">Meta Atual</h2>
                <div className="mb-4 rounded border border-gray-300 bg-gray-50 p-3 text-sm">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="font-semibold">Criada em:</span>{" "}
                      {activeGoal.createdAt ? formatDate(activeGoal.createdAt) : "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Prazo:</span>{" "}
                      {activeGoal.endDate ? formatDate(activeGoal.endDate) : "-"}
                    </div>
                    <div>
                      <span className="font-semibold">Dias restantes:</span>{" "}
                      {goalProgress.daysRemaining}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="font-semibold">Progresso geral:</span>{" "}
                    <span className="font-bold">{Math.min(goalProgress.totalProgress, 100)}%</span>
                    {" "}
                    <span className="text-gray-500">
                      ({goalProgress.status === "achieved" ? "Alcançado" :
                        goalProgress.status === "expired" ? "Expirado" :
                        goalProgress.status === "behind" ? "Atrasado" : "Em progresso"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Per-parameter cards — each avoids page break */}
              {Object.entries(goalProgress.parameterProgress).map(([param, metrics]) => {
                const labels: Record<string, { label: string; unit: string }> = {
                  peso: { label: "Peso", unit: "kg" },
                  fat: { label: "Gordura Corporal", unit: "%" },
                  mm: { label: "Massa Magra", unit: "kg" },
                  mg: { label: "Massa Gorda", unit: "kg" },
                };
                const cfg = labels[param] || { label: param, unit: "" };
                const progress = Math.min(Math.max(metrics.progress, 0), 100);

                return (
                  <div key={param} className="mb-4 rounded border border-gray-300 p-3" style={{ breakInside: "avoid" }}>
                    <h3 className="mb-3 text-center text-sm font-semibold">{cfg.label}</h3>

                    {/* Values */}
                    <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Inicial</p>
                        <p className="font-bold">
                          {metrics.initialValue !== undefined ? `${metrics.initialValue.toFixed(1)}${cfg.unit}` : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Atual</p>
                        <p className="font-bold">
                          {metrics.currentValue !== undefined ? `${metrics.currentValue.toFixed(1)}${cfg.unit}` : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Meta</p>
                        <p className="font-bold text-blue-700">
                          {metrics.targetValue !== undefined ? `${metrics.targetValue.toFixed(1)}${cfg.unit}` : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="mb-1 flex justify-between text-xs text-gray-500">
                        <span>Progresso</span>
                        <span className="font-semibold">{metrics.progress}%</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-3 rounded-full"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: metrics.isAchieved ? "#22c55e" : metrics.isOnTrack ? "#22c55e" : "#ef4444",
                          }}
                        />
                      </div>
                    </div>

                    {/* Chart */}
                    <div data-pdf-chart={`goal-${param}`}>
                      {param === "peso" ? (
                        <WeightProgressAreaChart goal={activeGoal} />
                      ) : (
                        <ResultsChart param={param} goal={activeGoal} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TABLES: all three in one block to stay on same page ─────── */}
          {!isOnline &&   
            <div style={{ breakInside: "avoid" }}>

              {/* Composição Corporal */}
              {hasResults && Object.keys(consulta.results!).length > 0 && multipleConsultas && (
                <div className="mb-6">
                  <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">
                    Composição Corporal — Histórico
                  </h2>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Métrica</th>
                        {tableConsultas.map((c) => (
                          <th key={c.id} className={"border border-gray-300 p-2 text-right" + (c.id === consulta.id ? " bg-blue-100" : "")}>
                            {c.date || "-"}{c.online ? " *" : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RESULTS.map((result) => {
                        const hasAny = tableConsultas.some((c) => (c.results as any)?.[result.value]);
                        if (!hasAny) return null;
                        return (
                          <tr key={result.value}>
                            <td className="border border-gray-300 p-2">{result.label}</td>
                            {tableConsultas.map((c) => {
                              const val = (c.results as any)?.[result.value];
                              return (
                                <td key={c.id} className={"border border-gray-300 p-2 text-right font-semibold" + (c.id === consulta.id ? " bg-blue-50" : "")}>
                                  {c.online ? "—" : val ? `${Number(val).toFixed(2)}${result.value === "fat" ? "%" : " kg"}` : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {tableConsultas.some((c) => c.online) && (
                    <p className="mt-1 text-xs text-gray-500">* Consulta online — sem dados de composição corporal</p>
                  )}
                </div>
              )}

              {/* Dobras Cutâneas */}
              {consulta.dobras && Object.keys(consulta.dobras).length > 0 && (
                <div className="mb-6">
                  <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">Dobras Cutâneas</h2>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Dobra</th>
                        {tableConsultas.map((c) => (
                          <th key={c.id} className={"border border-gray-300 p-2 text-right" + (c.id === consulta.id ? " bg-blue-100" : "")}>
                            {c.date || "-"}{c.online ? " *" : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableConsultas.some((c) => c.results?.dobras) && (
                        <tr className="bg-gray-50 font-bold">
                          <td className="border border-gray-300 p-2">Soma Total</td>
                          {tableConsultas.map((c) => (
                            <td key={c.id} className={"border border-gray-300 p-2 text-right" + (c.id === consulta.id ? " bg-blue-50" : "")}>
                              {c.online ? "—" : c.results?.dobras ? `${c.results.dobras.toFixed(2)} mm` : "-"}
                            </td>
                          ))}
                        </tr>
                      )}
                      {FOLDS.map((fold) => {
                        const hasAny = tableConsultas.some((c) => (c.dobras as any)?.[fold.value]);
                        if (!hasAny) return null;
                        return (
                          <tr key={fold.value}>
                            <td className="border border-gray-300 p-2 capitalize">{fold.label}</td>
                            {tableConsultas.map((c) => {
                              const val = (c.dobras as any)?.[fold.value];
                              return (
                                <td key={c.id} className={"border border-gray-300 p-2 text-right font-semibold" + (c.id === consulta.id ? " bg-blue-50" : "")}>
                                  {c.online ? "—" : val ? `${val} mm` : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Circunferências */}
              {consulta.medidas && Object.keys(consulta.medidas).length > 0 && (
                <div className="mb-6">
                  <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">Circunferências</h2>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Medida</th>
                        {tableConsultas.map((c) => (
                          <th key={c.id} className={"border border-gray-300 p-2 text-right" + (c.id === consulta.id ? " bg-blue-100" : "")}>
                            {c.date || "-"}{c.online ? " *" : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MEASURES.map((measure) => {
                        const hasAny = tableConsultas.some((c) => (c.medidas as any)?.[measure.value]);
                        if (!hasAny) return null;
                        return (
                          <tr key={measure.value}>
                            <td className="border border-gray-300 p-2">{measure.label}</td>
                            {tableConsultas.map((c) => {
                              const val = (c.medidas as any)?.[measure.value];
                              return (
                                <td key={c.id} className={"border border-gray-300 p-2 text-right font-semibold" + (c.id === consulta.id ? " bg-blue-50" : "")}>
                                  {val ? `${val} cm` : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {tableConsultas.some((c) => c.online) && (
                    <p className="mt-1 text-xs text-gray-500">* Consulta online (autoaferida)</p>
                  )}
                </div>
              )}

            </div>
          }{/* end tables group */}

          {/* Observations */}
          {consulta.obs && (
            <div className="mb-6" style={{ breakInside: "avoid" }}>
              <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">Observações</h2>
              <p className="whitespace-pre-wrap text-sm">{consulta.obs}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-gray-300 pt-3 text-center text-xs text-gray-600">
            <p>Relatório gerado automaticamente em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            <p className="mt-1">NutriOffice — Sistema de Gestão Nutricional</p>
          </div>

        </div>
      </div>}
    </>
  );
};
