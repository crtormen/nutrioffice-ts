import { EvaluationConfigCard } from "@/components/Evaluation/EvaluationConfigCard";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EvaluationSettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configuração de Avaliação</h3>
        <p className="text-sm text-muted-foreground">
          Configure os campos e protocolos de avaliação para consultas online e
          presenciais
        </p>
      </div>
      <Separator />

      <Tabs defaultValue="presencial" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presencial">Consultas Presenciais</TabsTrigger>
          <TabsTrigger value="online">Consultas Online</TabsTrigger>
        </TabsList>

        <TabsContent value="presencial" className="space-y-4">
          <EvaluationConfigCard appointmentType="presencial" />
        </TabsContent>

        <TabsContent value="online" className="space-y-4">
          <EvaluationConfigCard appointmentType="online" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
