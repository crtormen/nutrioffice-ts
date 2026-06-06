import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import html2canvas from "html2canvas";
import { FileText, Loader2 } from "lucide-react";
import React, { useRef, useState } from "react";

import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import { useFetchGoalsQuery } from "@/app/state/features/goalsSlice";
import { Button } from "@/components/ui/button";
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

export const ConsultaPDFReport: React.FC<ConsultaPDFReportProps> = ({
  consulta,
  customer,
  customerId,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { dbUid } = useAuth();

  // Fetch all consultas for progress comparison
  const { data: allConsultas = [] } = useFetchCustomerConsultasQuery({
    uid: dbUid,
    customerId,
  });

  // Fetch goals for charts
  const { data: goals = [] } = useFetchGoalsQuery({
    uid: dbUid || "",
    customerId: customerId || "",
  });

  // Find active goal
  const activeGoal = goals.find((g) => {
    const now = new Date();
    const endDate = g.endDate
      ? new Date(g.endDate.split("/").reverse().join("-"))
      : null;
    return endDate && endDate > now;
  });

  // Get previous consulta for comparison
  const sortedConsultas = [...allConsultas].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    try {
      const dateA = parse(a.date, "dd/MM/yyyy", new Date());
      const dateB = parse(b.date, "dd/MM/yyyy", new Date());
      return dateA.getTime() - dateB.getTime();
    } catch {
      return 0;
    }
  });

  const currentIndex = sortedConsultas.findIndex((c) => c.id === consulta.id);
  const previousConsulta = currentIndex > 0 ? sortedConsultas[currentIndex - 1] : null;

  const calculateChange = (current: number | undefined, previous: number | undefined): string => {
    if (!current || !previous) return "-";
    const change = current - previous;
    const percentage = ((change / previous) * 100).toFixed(1);
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(2)} (${sign}${percentage}%)`;
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Let state update

      // Capture existing charts from the page
      let compositionChartImg = '';
      let fatChartImg = '';

      // Try to find and capture the composition chart (pie chart)
      const compositionChartElement = document.querySelector('[data-chart-type="composition"]') as HTMLElement;
      if (compositionChartElement) {
        const canvas = await html2canvas(compositionChartElement, { scale: 2, backgroundColor: '#ffffff' });
        compositionChartImg = canvas.toDataURL('image/png');
      }

      // Try to find and capture the fat percentage chart
      const fatChartElement = document.querySelector('[data-chart-type="fat-progress"]') as HTMLElement;
      if (fatChartElement) {
        const canvas = await html2canvas(fatChartElement, { scale: 2, backgroundColor: '#ffffff' });
        fatChartImg = canvas.toDataURL('image/png');
      }

      // Store chart images in the printRef element
      const compositionChartDiv = printRef.current?.querySelector('#composition-chart-img');
      if (compositionChartDiv && compositionChartImg) {
        compositionChartDiv.innerHTML = `<img src="${compositionChartImg}" alt="Composição Corporal" style="width: 100%; max-width: 250px; margin: 0 auto; display: block;" />`;
      }

      const fatChartDiv = printRef.current?.querySelector('#fat-chart-img');
      if (fatChartDiv && fatChartImg) {
        fatChartDiv.innerHTML = `<img src="${fatChartImg}" alt="Evolução de Gordura" style="width: 100%; height: auto;" />`;
      }

      const printContent = printRef.current;
      if (!printContent) return;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Get computed styles from the document
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch (e) {
          return "";
        }
      })
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Consulta - ${customer?.name}</title>
          <style>
            ${styles}
            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
              .no-print {
                display: none !important;
              }
              .page-break {
                page-break-after: always;
              }
              table {
                page-break-inside: avoid;
              }
              .table-section {
                page-break-inside: avoid;
              }
              .rounded-lg, .rounded {
                page-break-inside: avoid;
              }
              /* Ensure charts are visible */
              svg {
                max-width: 100%;
                height: auto;
              }
              /* Prevent widows and orphans */
              h2 {
                page-break-after: avoid;
              }
            }
            @page {
              size: A4;
              margin: 2cm;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load before printing (longer delay for charts)
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setIsGenerating(false);
    }, 1000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = parse(dateString, "dd/MM/yyyy", new Date());
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePrint} disabled={isGenerating}>
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Gerar PDF
          </>
        )}
      </Button>

      {/* Hidden content for printing - positioned offscreen but rendered */}
      <div ref={printRef} className="fixed left-[-9999px] top-0">
        <div className="bg-white p-6 text-black" style={{ width: '210mm' }}>
          {/* Header */}
          <div className="mb-8 border-b-2 border-gray-300 pb-3 text-center">
            <h1 className="mb-1 text-2xl font-bold">
              Relatório de Avaliação Nutricional
            </h1>
            <p className="text-base text-gray-600">
              {customer?.name} - {formatDate(consulta.date)}
            </p>
          </div>

          {/* Patient Info */}
          <div className="mb-8">
            <h2 className="mb-4 border-b border-gray-300 pb-1 text-lg font-bold">
              Dados do Paciente
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold">Nome:</span> {customer?.name}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {customer?.email}
              </div>
              <div>
                <span className="font-semibold">Telefone:</span>{" "}
                {customer?.phone}
              </div>
              <div>
                <span className="font-semibold">Data de Nascimento:</span>{" "}
                {customer?.birthday}
              </div>
            </div>
          </div>

          {/* Consultation Data */}
          <div className="mb-8">
            <h2 className="mb-4 border-b border-gray-300 pb-1 text-lg font-bold">
              Dados da Consulta
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold">Data:</span>{" "}
                {formatDate(consulta.date)}
              </div>
              <div>
                <span className="font-semibold">Peso:</span> {consulta.peso} kg
              </div>
              <div>
                <span className="font-semibold">Idade:</span> {consulta.idade}{" "}
                anos
              </div>
              {consulta.structure?.altura && (
                <div>
                  <span className="font-semibold">Altura:</span>{" "}
                  {consulta.structure.altura} cm
                </div>
              )}
            </div>
          </div>

          {/* Charts Section - Side by side layout OR Summary for first consultation */}
          {consulta.results && !consulta.online && (
            <>
              <div className="mb-8">
                <h2 className="mb-4 border-b border-gray-300 pb-1 text-lg font-bold">
                  {allConsultas.length > 1 ? 'Gráficos de Avaliação' : 'Avaliação Inicial'}
                </h2>

                {allConsultas.length > 1 ? (
                  /* Two column layout for charts - when there's history */
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left: Composition Chart with Data Table */}
                    <div className="rounded border border-gray-300 p-3">
                      <h3 className="mb-2 text-center text-sm font-semibold">Composição Corporal Atual</h3>
                      <div className="mb-3" id="composition-chart-img">
                        <p className="text-center text-xs text-gray-500">Carregando...</p>
                      </div>
                      {/* Data table next to chart */}
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between border-b border-dotted py-1">
                          <span className="uppercase text-gray-600">Peso</span>
                          <span className="font-medium">{consulta.peso || "-"} kg</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                          <span className="uppercase text-gray-600">Massa Gorda</span>
                          <span className="font-medium">{consulta.results.mg?.toFixed(2) || "-"} kg</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                          <span className="uppercase text-gray-600">Massa Magra</span>
                          <span className="font-medium">{consulta.results.mm?.toFixed(2) || "-"} kg</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                          <span className="uppercase text-gray-600">Massa Residual</span>
                          <span className="font-medium">{consulta.results.mr?.toFixed(2) || "-"} kg</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="uppercase text-gray-600">Massa Óssea</span>
                          <span className="font-medium">{consulta.results.mo?.toFixed(2) || "-"} kg</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Fat Progress Chart */}
                    <div className="rounded border border-gray-300 p-3">
                      <h3 className="mb-2 text-center text-sm font-semibold">Evolução do Percentual de Gordura</h3>
                      <p className="mb-2 text-center text-xs text-gray-500">Últimas 6 consultas</p>
                      <div id="fat-chart-img">
                        <p className="text-center text-xs text-gray-500">Carregando...</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single column summary for first consultation */
                  <div className="rounded border border-gray-300 bg-blue-50 p-4">
                    <div className="mb-3 text-center">
                      <p className="text-sm font-medium text-blue-900">Primeira Avaliação</p>
                      <p className="text-xs text-blue-700">Este é o ponto de partida para acompanhamento da evolução</p>
                    </div>

                    {/* Summary Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {/* Body Composition */}
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-800">Composição Corporal</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gordura Corporal:</span>
                            <span className="font-medium">{consulta.results.fat?.toFixed(2) || "-"}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Massa Gorda:</span>
                            <span className="font-medium">{consulta.results.mg?.toFixed(2) || "-"} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Massa Magra:</span>
                            <span className="font-medium">{consulta.results.mm?.toFixed(2) || "-"} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Massa Residual:</span>
                            <span className="font-medium">{consulta.results.mr?.toFixed(2) || "-"} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Massa Óssea:</span>
                            <span className="font-medium">{consulta.results.mo?.toFixed(2) || "-"} kg</span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Metrics */}
                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-800">Medidas Principais</h3>
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
                          {consulta.results.dobras && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Soma de Dobras:</span>
                              <span className="font-medium">{consulta.results.dobras.toFixed(2)} mm</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 rounded bg-white p-2 text-center">
                          <p className="text-xs font-medium text-gray-700">Próxima avaliação permitirá</p>
                          <p className="text-xs text-gray-600">acompanhar a evolução</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Page break after charts */}
              {/* <div className="page-break"></div> */}
            </>
          )}

          {/* Results with Progress */}
          {consulta.results && Object.keys(consulta.results).length > 0 && allConsultas.length > 1 && (
            <div className="mb-6">
              <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">
                Composição Corporal - Histórico
                {previousConsulta && <span className="text-xs font-normal text-gray-600"> (com evolução)</span>}
              </h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">
                      Métrica
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Valor Atual
                    </th>
                    {previousConsulta && (
                      <>
                        <th className="border border-gray-300 p-2 text-right">
                          Valor Anterior
                        </th>
                        <th className="border border-gray-300 p-2 text-right">
                          Variação
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {RESULTS.map((result) => {
                    const currentValue = (consulta.results as any)?.[result.value];
                    const previousValue = previousConsulta?.results?.[result.value as keyof typeof previousConsulta.results];
                    if (!currentValue) return null;
                    return (
                      <tr key={result.value}>
                        <td className="border border-gray-300 p-2">
                          {result.label}
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-semibold">
                          {currentValue.toFixed(2)} {result.value === "fat" ? "%" : "kg"}
                        </td>
                        {previousConsulta && (
                          <>
                            <td className="border border-gray-300 p-2 text-right">
                              {previousValue ? `${(previousValue as number).toFixed(2)} ${result.value === "fat" ? "%" : "kg"}` : "-"}
                            </td>
                            <td className="border border-gray-300 p-2 text-right">
                              {calculateChange(currentValue as number, previousValue as number)}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Page break */}
          {/* <div className="page-break"></div> */}

          {/* Dobras Cutâneas with Progress */}
          {consulta.dobras && Object.keys(consulta.dobras).length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">
                Dobras Cutâneas
                {previousConsulta && <span className="text-xs font-normal text-gray-600"> (com evolução)</span>}
              </h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">
                      Dobra
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Valor Atual (mm)
                    </th>
                    {previousConsulta && (
                      <>
                        <th className="border border-gray-300 p-2 text-right">
                          Valor Anterior (mm)
                        </th>
                        <th className="border border-gray-300 p-2 text-right">
                          Variação
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {consulta.results?.dobras && (
                    <tr className="bg-gray-50 font-bold">
                      <td className="border border-gray-300 p-2">Soma Total</td>
                      <td className="border border-gray-300 p-2 text-right">
                        {consulta.results.dobras.toFixed(2)} mm
                      </td>
                      {previousConsulta && (
                        <>
                          <td className="border border-gray-300 p-2 text-right">
                            {previousConsulta.results?.dobras ? `${previousConsulta.results.dobras.toFixed(2)} mm` : "-"}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">
                            {calculateChange(consulta.results.dobras, previousConsulta.results?.dobras)}
                          </td>
                        </>
                      )}
                    </tr>
                  )}
                  {FOLDS.map((fold) => {
                    const currentValue = (consulta.dobras as any)?.[fold.value];
                    const previousValue = previousConsulta?.dobras?.[fold.value as keyof typeof previousConsulta.dobras];
                    if (!currentValue) return null;
                    return (
                      <tr key={fold.value}>
                        <td className="border border-gray-300 p-2 capitalize">
                          {fold.label}
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-semibold">
                          {currentValue} mm
                        </td>
                        {previousConsulta && (
                          <>
                            <td className="border border-gray-300 p-2 text-right">
                              {previousValue ? `${previousValue} mm` : "-"}
                            </td>
                            <td className="border border-gray-300 p-2 text-right">
                              {calculateChange(Number(currentValue), Number(previousValue))}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Circunferências with Progress */}
          {consulta.medidas && Object.keys(consulta.medidas).length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">
                Circunferências
                {previousConsulta && <span className="text-xs font-normal text-gray-600"> (com evolução)</span>}
              </h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">
                      Medida
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Valor Atual (cm)
                    </th>
                    {previousConsulta && (
                      <>
                        <th className="border border-gray-300 p-2 text-right">
                          Valor Anterior (cm)
                        </th>
                        <th className="border border-gray-300 p-2 text-right">
                          Variação
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {MEASURES.map((measure) => {
                    const currentValue = (consulta.medidas as any)?.[measure.value];
                    const previousValue = previousConsulta?.medidas?.[measure.value as keyof typeof previousConsulta.medidas];
                    if (!currentValue) return null;
                    return (
                      <tr key={measure.value}>
                        <td className="border border-gray-300 p-2">
                          {measure.label}
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-semibold">
                          {currentValue} cm
                        </td>
                        {previousConsulta && (
                          <>
                            <td className="border border-gray-300 p-2 text-right">
                              {previousValue ? `${previousValue} cm` : "-"}
                            </td>
                            <td className="border border-gray-300 p-2 text-right">
                              {calculateChange(Number(currentValue), Number(previousValue))}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Observations */}
          {consulta.obs && (
            <div className="mb-6">
              <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">
                Observações
              </h2>
              <p className="whitespace-pre-wrap text-sm">{consulta.obs}</p>
            </div>
          )}

          {/* Notes */}
          {consulta.notes && consulta.notes.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">
                Notas
              </h2>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {consulta.notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Food Recall */}
          {consulta.meals && consulta.meals.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 border-b border-gray-300 pb-1 text-lg font-bold">
                Recordatório Alimentar
              </h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">
                      Horário
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Refeição
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consulta.meals.map((meal, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2 font-semibold">
                        {meal.time}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {meal.description || meal.meal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-gray-300 pt-3 text-center text-xs text-gray-600">
            <p>
              Relatório gerado automaticamente em{" "}
              {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="mt-1">NutriOffice - Sistema de Gestão Nutricional</p>
          </div>
        </div>
      </div>
    </>
  );
};
