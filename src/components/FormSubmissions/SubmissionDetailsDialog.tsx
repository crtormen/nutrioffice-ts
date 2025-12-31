import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CheckCircle,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IFormSubmission } from "@/domain/entities/formSubmission";

interface SubmissionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: IFormSubmission;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export function SubmissionDetailsDialog({
  open,
  onOpenChange,
  submission,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: SubmissionDetailsDialogProps) {
  const {
    customerData,
    anamnesisData,
    evaluationData,
    appointmentType,
    status,
    submittedAt,
  } = submission;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const formatBirthday = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const statusConfig = {
    pending: {
      label: "Pendente",
      variant: "outline" as const,
      className: "border-yellow-500 text-yellow-700",
    },
    approved: {
      label: "Aprovada",
      variant: "default" as const,
      className: "bg-green-600",
    },
    rejected: {
      label: "Rejeitada",
      variant: "destructive" as const,
      className: "",
    },
  };

  const config = statusConfig[status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes da Submissão</DialogTitle>
            <Badge variant={config.variant} className={config.className}>
              {config.label}
            </Badge>
          </div>
          <DialogDescription>
            Enviado em {formatDate(submittedAt)} · Tipo:{" "}
            {appointmentType === "online" ? "Online" : "Presencial"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-200px)] overflow-y-auto pr-4">
          <Tabs defaultValue="customer" className="w-full">
            <TabsList
              className={`grid w-full ${evaluationData ? "grid-cols-3" : "grid-cols-2"}`}
            >
              <TabsTrigger value="customer">
                <User className="mr-2 h-4 w-4" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="anamnesis">
                <FileText className="mr-2 h-4 w-4" />
                Anamnese
              </TabsTrigger>
              {evaluationData && (
                <TabsTrigger value="evaluation">
                  <MapPin className="mr-2 h-4 w-4" />
                  Avaliação
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="customer" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Informações do Paciente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Nome Completo
                      </label>
                      <p className="mt-1 text-sm font-medium">
                        {customerData.name}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        CPF
                      </label>
                      <p className="mt-1 text-sm font-medium">
                        {customerData.cpf}
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        Email
                      </label>
                      <p className="mt-1 text-sm">{customerData.email}</p>
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        Telefone/WhatsApp
                      </label>
                      <p className="mt-1 text-sm">{customerData.phone}</p>
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Data de Nascimento
                      </label>
                      <p className="mt-1 text-sm">
                        {customerData.birthday
                          ? formatBirthday(customerData.birthday)
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Gênero
                      </label>
                      <p className="mt-1 text-sm">
                        {customerData.gender === "H" ? "Masculino" : "Feminino"}
                      </p>
                    </div>

                    {customerData.occupation && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Profissão
                        </label>
                        <p className="mt-1 text-sm">
                          {customerData.occupation}
                        </p>
                      </div>
                    )}

                    {customerData.instagram && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Instagram
                        </label>
                        <p className="mt-1 text-sm">{customerData.instagram}</p>
                      </div>
                    )}
                  </div>

                  {customerData.cameBy && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Como conheceu nosso trabalho?
                        </label>
                        <p className="mt-1 text-sm">{customerData.cameBy}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="anamnesis" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Respostas da Anamnese
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(anamnesisData).length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <FileText className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>Nenhum dado de anamnese foi enviado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(anamnesisData).map(([fieldId, value]) => (
                        <div
                          key={fieldId}
                          className="border-b pb-3 last:border-b-0 last:pb-0"
                        >
                          <label className="text-sm font-medium capitalize text-muted-foreground">
                            {fieldId.replace(/([A-Z])/g, " $1").trim()}
                          </label>
                          <div className="mt-1 text-sm">
                            {Array.isArray(value) ? (
                              <ul className="list-inside list-disc">
                                {value.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="whitespace-pre-wrap">
                                {value || "-"}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {evaluationData && (
              <TabsContent value="evaluation" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Dados de Avaliação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {evaluationData.weight !== undefined && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Peso
                          </label>
                          <p className="mt-1 text-sm font-medium">
                            {evaluationData.weight} kg
                          </p>
                        </div>
                      )}

                      {evaluationData.height !== undefined && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Altura
                          </label>
                          <p className="mt-1 text-sm font-medium">
                            {evaluationData.height} cm
                          </p>
                        </div>
                      )}
                    </div>

                    {evaluationData.measures &&
                      Object.keys(evaluationData.measures).length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div>
                            <h4 className="mb-3 text-sm font-medium">
                              Medidas Circunferenciais
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(evaluationData.measures).map(
                                ([measureId, value]) => (
                                  <div key={measureId}>
                                    <label className="text-sm capitalize text-muted-foreground">
                                      {measureId.replace(/_/g, " ")}
                                    </label>
                                    <p className="mt-1 text-sm font-medium">
                                      {value} cm
                                    </p>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </>
                      )}

                    {evaluationData.photos && (
                      <>
                        <Separator className="my-4" />
                        <div>
                          <h4 className="mb-3 text-sm font-medium">
                            Fotos de Evolução
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            {evaluationData.photos.front && (
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">
                                  Frente
                                </label>
                                <img
                                  src={evaluationData.photos.front}
                                  alt="Foto frontal"
                                  className="h-48 w-full rounded-lg border object-cover"
                                />
                              </div>
                            )}
                            {evaluationData.photos.side && (
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">
                                  Lateral
                                </label>
                                <img
                                  src={evaluationData.photos.side}
                                  alt="Foto lateral"
                                  className="h-48 w-full rounded-lg border object-cover"
                                />
                              </div>
                            )}
                            {evaluationData.photos.back && (
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">
                                  Costas
                                </label>
                                <img
                                  src={evaluationData.photos.back}
                                  alt="Foto de costas"
                                  className="h-48 w-full rounded-lg border object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {status === "pending" && (
          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={onReject}
              disabled={isRejecting || isApproving}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeitar
                </>
              )}
            </Button>
            <Button
              onClick={onApprove}
              disabled={isApproving || isRejecting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aprovando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar e Criar Cliente
                </>
              )}
            </Button>
          </DialogFooter>
        )}

        {status === "approved" && submission.createdCustomerId && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button
              onClick={() =>
                window.open(
                  `/customers/${submission.createdCustomerId}`,
                  "_blank",
                )
              }
            >
              <User className="mr-2 h-4 w-4" />
              Ver Cliente Criado
            </Button>
          </DialogFooter>
        )}

        {status === "rejected" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
