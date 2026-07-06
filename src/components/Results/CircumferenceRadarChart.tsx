import { parse } from "date-fns";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ICustomerConsulta } from "@/domain/entities/consulta";

interface CircumferenceRadarChartProps {
  customerId: string;
  userId: string;
  compareConsultations?: boolean;
  consultas?: ICustomerConsulta[];
}

const chartConfig = {
  atual: {
    label: "Atual",
    color: "hsl(var(--chart-1))",
  },
  anterior: {
    label: "Anterior",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const measurementLabels: Record<string, string> = {
  circ_abdomen: "Abdômen",
  circ_gluteo: "Glúteo",
  circ_cintura: "Cintura",
  circ_coxa_dir: "Coxa D",
  circ_braco_dir: "Braço D",
};

export const CircumferenceRadarChart = ({
  customerId,
  userId,
  compareConsultations = true,
  consultas: consultasProp,
}: CircumferenceRadarChartProps) => {
  const { data: fetchedConsultas = [] } = useFetchCustomerConsultasQuery(
    { uid: userId, customerId },
    { skip: !!consultasProp },
  );
  const consultas = consultasProp ?? fetchedConsultas;

  const consultasWithMeasures = consultas
    .filter((c) => c.medidas && Object.keys(c.medidas).length > 0)
    .sort((a, b) => {
      try {
        return parse(a.date!, "dd/MM/yyyy", new Date()).getTime() -
               parse(b.date!, "dd/MM/yyyy", new Date()).getTime();
      } catch { return 0; }
    });

  if (consultasWithMeasures.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
        Sem dados de medidas disponíveis
      </div>
    );
  }

  const latestConsulta =
    consultasWithMeasures[consultasWithMeasures.length - 1];
  const previousConsulta =
    consultasWithMeasures[consultasWithMeasures.length - 2];


  const chartData = Object.entries(measurementLabels)
    .map(([key, label]) => {
      const atual =
        latestConsulta.medidas?.[key as keyof typeof latestConsulta.medidas];
      const anterior =
        compareConsultations && previousConsulta
          ? previousConsulta.medidas?.[
              key as keyof typeof previousConsulta.medidas
            ]
          : undefined;

      if (!atual) return null;

      return {
        measurement: label,
        atual: Number(atual),
        ...(anterior && { anterior: Number(anterior) }),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
        Sem medidas válidas para exibir
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <RadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="measurement" />
        <PolarRadiusAxis angle={90} domain={["auto", "auto"]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {compareConsultations && previousConsulta && (
          <ChartLegend content={<ChartLegendContent />} />
        )}
        <Radar
          name="Atual"
          dataKey="atual"
          stroke="var(--color-atual)"
          fill="var(--color-atual)"
          fillOpacity={0.6}
        />
        {compareConsultations && previousConsulta && (
          <Radar
            name="Anterior"
            dataKey="anterior"
            stroke="var(--color-anterior)"
            fill="var(--color-anterior)"
            fillOpacity={0.3}
          />
        )}
      </RadarChart>
    </ChartContainer>
  );
};
