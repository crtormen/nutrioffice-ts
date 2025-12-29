import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from "lucide-react";
import React, { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  FOLDS,
  ICustomerConsulta,
  MEASURES,
  RESULTS,
} from "@/domain/entities/consulta";
import { ICustomer } from "@/domain/entities/customer";

interface ConsultaPDFReportProps {
  consulta: ICustomerConsulta;
  customer: ICustomer | undefined;
}

export const ConsultaPDFReport: React.FC<ConsultaPDFReportProps> = ({
  consulta,
  customer,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
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

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <FileText className="mr-2 h-4 w-4" />
        Gerar PDF
      </Button>

      {/* Hidden content for printing */}
      <div ref={printRef} className="hidden">
        <div className="bg-white p-8 text-black">
          {/* Header */}
          <div className="mb-8 border-b-2 border-gray-300 pb-4 text-center">
            <h1 className="mb-2 text-3xl font-bold">
              Relatório de Avaliação Nutricional
            </h1>
            <p className="text-lg text-gray-600">
              {customer?.name} - {formatDate(consulta.date)}
            </p>
          </div>

          {/* Patient Info */}
          <div className="mb-8">
            <h2 className="mb-4 border-b border-gray-300 pb-2 text-xl font-bold">
              Dados do Paciente
            </h2>
            <div className="grid grid-cols-2 gap-4">
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
            <h2 className="mb-4 border-b border-gray-300 pb-2 text-xl font-bold">
              Dados da Consulta
            </h2>
            <div className="grid grid-cols-2 gap-4">
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

          {/* Results */}
          {consulta.results && Object.keys(consulta.results).length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-300 pb-2 text-xl font-bold">
                Composição Corporal
              </h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">
                      Métrica
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RESULTS.map((result) => {
                    const value = (consulta.results as any)?.[result.value];
                    if (!value) return null;
                    return (
                      <tr key={result.value}>
                        <td className="border border-gray-300 p-2">
                          {result.label}
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-semibold">
                          {value} {result.value === "fat" ? "%" : "kg"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Page break */}
          <div className="page-break"></div>

          {/* Dobras Cutâneas */}
          {consulta.dobras && Object.keys(consulta.dobras).length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-300 pb-2 text-xl font-bold">
                Dobras Cutâneas
              </h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">
                      Dobra
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Valor (mm)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consulta.results?.dobras && (
                    <tr className="bg-gray-50 font-bold">
                      <td className="border border-gray-300 p-2">Soma Total</td>
                      <td className="border border-gray-300 p-2 text-right">
                        {consulta.results.dobras} mm
                      </td>
                    </tr>
                  )}
                  {FOLDS.map((fold) => {
                    const value = (consulta.dobras as any)?.[fold.value];
                    if (!value) return null;
                    return (
                      <tr key={fold.value}>
                        <td className="border border-gray-300 p-2 capitalize">
                          {fold.label}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {value} mm
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Circunferências */}
          {consulta.medidas && Object.keys(consulta.medidas).length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-300 pb-2 text-xl font-bold">
                Circunferências
              </h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">
                      Medida
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Valor (cm)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MEASURES.map((measure) => {
                    const value = (consulta.medidas as any)?.[measure.value];
                    if (!value) return null;
                    return (
                      <tr key={measure.value}>
                        <td className="border border-gray-300 p-2">
                          {measure.label}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {value} cm
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Observations */}
          {consulta.obs && (
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-300 pb-2 text-xl font-bold">
                Observações
              </h2>
              <p className="whitespace-pre-wrap">{consulta.obs}</p>
            </div>
          )}

          {/* Notes */}
          {consulta.notes && consulta.notes.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-300 pb-2 text-xl font-bold">
                Notas
              </h2>
              <ul className="list-inside list-disc space-y-2">
                {consulta.notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Food Recall */}
          {consulta.meals && consulta.meals.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 border-b border-gray-300 pb-2 text-xl font-bold">
                Recordatório Alimentar
              </h2>
              <table className="w-full border-collapse">
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
          <div className="mt-12 border-t border-gray-300 pt-4 text-center text-sm text-gray-600">
            <p>
              Relatório gerado automaticamente em{" "}
              {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="mt-2">NutriOffice - Sistema de Gestão Nutricional</p>
          </div>
        </div>
      </div>
    </>
  );
};
