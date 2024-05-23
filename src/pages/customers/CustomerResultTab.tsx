import CompositionChart from "@/components/Results/CompositionChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ResultsCard from "@/components/Results/ResultsCard";
import CompositionInfo from "@/components/Results/CompositionInfo";
import GoalsCard from "@/components/Results/GoalsCard";

const CustomerResultsTab = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <div className="col-span-4">
        <ResultsCard />
      </div>
      <Card className="col-span-3 px-1">
        <CardHeader>
          <CardTitle>Composição Corporal Atual</CardTitle>
        </CardHeader>
        <CardContent className="pl-2 flex flex-col">
          <CompositionChart />
          <CompositionInfo />
        </CardContent>
      </Card>
      <Card className="col-span-7 p-1">
        <CardHeader>
          <CardTitle>Metas</CardTitle>
        </CardHeader>
        <CardContent className="pl-2 flex flex-col">
          <GoalsCard />
        </CardContent>
      </Card>
    </div>
  );
  //gerar pdf
  //botões metas
  //grafico de resultados
  //grafico de avaliações
  //estatísticas de metas
  //tabela de resultados
  //tabela de dobras
  //tabela de medidas
};

export default CustomerResultsTab;
