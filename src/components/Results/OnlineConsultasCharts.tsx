import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ICustomerConsulta } from "@/domain/entities";
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

// Most common circumference measurements to display
const COMMON_MEASURES = [
  { key: "circ_abdomen", label: "Abdômen" },
  { key: "circ_cintura", label: "Cintura" },
  { key: "circ_quadril", label: "Quadril" },
  { key: "circ_braco_direito", label: "Braço Direito" },
  { key: "circ_coxa_direita", label: "Coxa Direita" },
  { key: "circ_panturrilha_direita", label: "Panturrilha Direita" },
];

export const OnlineConsultasCharts = ({ consultas, customerId, userId }: OnlineConsultasChartsProps) => {
  if (!consultas || consultas.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Nenhuma consulta online encontrada</p>
      </div>
    );
  }

  // Get first and last consulta for photo comparison
  const sortedConsultas = [...consultas].sort((a, b) => {
    const dateA = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
    const dateB = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });

  const firstConsulta = sortedConsultas[0];
  const lastConsulta = sortedConsultas[sortedConsultas.length - 1];
  const hasPhotos = hasPhotoData(firstConsulta) || hasPhotoData(lastConsulta);

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
            {COMMON_MEASURES.map((measure) => (
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

      {/* Photo Comparison */}
      {hasPhotos && (
        <PhotoComparisonCard
          beforeConsulta={firstConsulta}
          afterConsulta={lastConsulta}
          showMetrics={true}
        />
      )}

      {/* Empty State for Photos */}
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
