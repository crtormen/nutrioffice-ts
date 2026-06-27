import { FileCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useFetchAnamnesisTokensQuery,
  useGenerateAnamnesisTokenMutation,
  useUpdateAttachmentsTokenMutation,
  useUpdateFeedingHistoryTokenMutation,
} from "@/app/state/features/anamnesisTokensSlice";
import { PublicEvaluationFieldSelector } from "@/components/FormSubmissions/PublicEvaluationFieldSelector";
import { PublicFormFieldSelector } from "@/components/FormSubmissions/PublicFormFieldSelector";
import { TokenDisplay } from "@/components/FormSubmissions/TokenDisplay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppointmentType } from "@/domain/entities/formSubmission";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

export default function PublicFormsSettingsTab() {
  const { dbUid } = useAuth();
  const [regeneratingType, setRegeneratingType] = useState<
    "online" | "presencial" | "reavaliacao" | "consultoria" | "hibrido" | null
  >(null);
  const [togglingFeedingType, setTogglingFeedingType] = useState<AppointmentType | null>(null);

  const {
    data: tokensData,
    isLoading,
    error,
  } = useFetchAnamnesisTokensQuery(dbUid || "", {
    skip: !dbUid,
  });

  const [generateToken, { isLoading: isGenerating }] =
    useGenerateAnamnesisTokenMutation();
  const [updateFeedingHistory] = useUpdateFeedingHistoryTokenMutation();
  const [updateAttachments] = useUpdateAttachmentsTokenMutation();
  const [togglingAttachmentsType, setTogglingAttachmentsType] = useState<AppointmentType | null>(null);

  const handleToggleFeedingHistory = async (type: AppointmentType, enabled: boolean) => {
    if (!dbUid) return;
    setTogglingFeedingType(type);
    try {
      await updateFeedingHistory({ uid: dbUid, type, enableFeedingHistory: enabled }).unwrap();
      toast.success(`Recordatório alimentar ${enabled ? "habilitado" : "desabilitado"} com sucesso!`);
    } catch (error: unknown) {
      const msg = error && typeof error === "object" && "data" in error ? String((error as any).data) : "Erro ao atualizar";
      toast.error(msg);
    } finally {
      setTogglingFeedingType(null);
    }
  };

  const handleToggleAttachments = async (type: AppointmentType, enabled: boolean) => {
    if (!dbUid) return;
    setTogglingAttachmentsType(type);
    try {
      await updateAttachments({ uid: dbUid, type, enableAttachments: enabled }).unwrap();
      toast.success(`Envio de arquivos ${enabled ? "habilitado" : "desabilitado"} com sucesso!`);
    } catch (error: unknown) {
      const msg = error && typeof error === "object" && "data" in error ? String((error as any).data) : "Erro ao atualizar";
      toast.error(msg);
    } finally {
      setTogglingAttachmentsType(null);
    }
  };

  const handleRegenerateToken = async (type: "online" | "presencial" | "reavaliacao" | "consultoria" | "hibrido") => {
    if (!dbUid) return;

    setRegeneratingType(type);
    try {
      await generateToken({
        uid: dbUid,
        type,
      }).unwrap();

      const typeLabel = type === "online" ? "Online" : type === "presencial" ? "Presencial" : type === "reavaliacao" ? "Reavaliação" : type === "hibrido" ? "Híbrido" : "Consultoria";
      toast.success(`Link ${typeLabel} regenerado com sucesso!`);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? String(error.data)
          : "Erro ao regenerar link";
      toast.error(errorMessage);
    } finally {
      setRegeneratingType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Formulários Públicos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os links públicos de anamnese para novos pacientes
          </p>
        </div>
        <Separator />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Formulários Públicos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os links públicos de anamnese para novos pacientes
          </p>
        </div>
        <Separator />
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar configurações. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const {
    onlineToken,
    presencialToken,
    reavaliacaoToken,
    consultoriaToken,
    hibridoToken,
    onlineEnabledFields,
    presencialEnabledFields,
    reavaliacaoEnabledFields,
    consultoriaEnabledFields,
    hibridoEnabledFields,
    onlineEnabledEvaluationFields,
    presencialEnabledEvaluationFields,
    reavaliacaoEnabledEvaluationFields,
    consultoriaEnabledEvaluationFields,
    hibridoEnabledEvaluationFields,
    onlineEnableFeedingHistory,
    presencialEnableFeedingHistory,
    reavaliacaoEnableFeedingHistory,
    consultoriaEnableFeedingHistory,
    hibridoEnableFeedingHistory,
    onlineEnableAttachments,
    presencialEnableAttachments,
    reavaliacaoEnableAttachments,
    consultoriaEnableAttachments,
    hibridoEnableAttachments,
  } = tokensData || {};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Formulários Públicos</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os links públicos de anamnese para novos pacientes
        </p>
      </div>
      <Separator />

      <Alert>
        <FileCheck className="h-4 w-4" />
        <AlertDescription>
          Compartilhe estes links com novos pacientes para que eles possam
          preencher a anamnese antes da primeira consulta. Os dados enviados
          aparecerão na página de submissões para aprovação.
        </AlertDescription>
      </Alert>

      {/* Online Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Formulário Online</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRegenerateToken("online")}
              disabled={isGenerating || regeneratingType === "online"}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${regeneratingType === "online" ? "animate-spin" : ""}`}
              />
              Regenerar Link
            </Button>
          </CardTitle>
          <CardDescription>
            Link para pacientes que farão consultas online (remotas)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {onlineToken ? (
            <TokenDisplay token={onlineToken} type="online" />
          ) : (
            <Button
              onClick={() => handleRegenerateToken("online")}
              disabled={isGenerating}
            >
              Gerar Link Online
            </Button>
          )}

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Campos de Anamnese</h4>
            <PublicFormFieldSelector
              appointmentType="online"
              enabledFields={onlineEnabledFields || []}
            />
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Campos de Avaliação</h4>
            <PublicEvaluationFieldSelector
              appointmentType="online"
              enabledFields={onlineEnabledEvaluationFields}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="online-feeding-history" className="text-sm font-medium">
                Recordatório Alimentar
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite ao paciente informar a rotina alimentar atual
              </p>
            </div>
            <Switch
              id="online-feeding-history"
              checked={onlineEnableFeedingHistory ?? false}
              onCheckedChange={(checked) => handleToggleFeedingHistory("online", checked)}
              disabled={togglingFeedingType === "online"}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="online-attachments" className="text-sm font-medium">
                Envio de Arquivos
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite enviar exames, receitas e outros documentos
              </p>
            </div>
            <Switch
              id="online-attachments"
              checked={onlineEnableAttachments ?? false}
              onCheckedChange={(checked) => handleToggleAttachments("online", checked)}
              disabled={togglingAttachmentsType === "online"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Presencial Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Formulário Presencial</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRegenerateToken("presencial")}
              disabled={isGenerating || regeneratingType === "presencial"}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${regeneratingType === "presencial" ? "animate-spin" : ""}`}
              />
              Regenerar Link
            </Button>
          </CardTitle>
          <CardDescription>
            Link para pacientes que farão consultas presenciais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {presencialToken ? (
            <TokenDisplay token={presencialToken} type="presencial" />
          ) : (
            <Button
              onClick={() => handleRegenerateToken("presencial")}
              disabled={isGenerating}
            >
              Gerar Link Presencial
            </Button>
          )}

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Campos de Anamnese</h4>
            <PublicFormFieldSelector
              appointmentType="presencial"
              enabledFields={presencialEnabledFields || []}
            />
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Campos de Avaliação</h4>
            <PublicEvaluationFieldSelector
              appointmentType="presencial"
              enabledFields={presencialEnabledEvaluationFields}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="presencial-feeding-history" className="text-sm font-medium">
                Recordatório Alimentar
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite ao paciente informar a rotina alimentar atual
              </p>
            </div>
            <Switch
              id="presencial-feeding-history"
              checked={presencialEnableFeedingHistory ?? false}
              onCheckedChange={(checked) => handleToggleFeedingHistory("presencial", checked)}
              disabled={togglingFeedingType === "presencial"}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="presencial-attachments" className="text-sm font-medium">
                Envio de Arquivos
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite enviar exames, receitas e outros documentos
              </p>
            </div>
            <Switch
              id="presencial-attachments"
              checked={presencialEnableAttachments ?? false}
              onCheckedChange={(checked) => handleToggleAttachments("presencial", checked)}
              disabled={togglingAttachmentsType === "presencial"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reavaliação Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Formulário de Reavaliação</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRegenerateToken("reavaliacao")}
              disabled={isGenerating || regeneratingType === "reavaliacao"}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${regeneratingType === "reavaliacao" ? "animate-spin" : ""}`}
              />
              Regenerar Link
            </Button>
          </CardTitle>
          <CardDescription>
            Link para pacientes em acompanhamento online realizarem reavaliação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reavaliacaoToken ? (
            <TokenDisplay token={reavaliacaoToken} type="reavaliacao" />
          ) : (
            <Button
              onClick={() => handleRegenerateToken("reavaliacao")}
              disabled={isGenerating}
            >
              Gerar Link de Reavaliação
            </Button>
          )}

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Campos de Anamnese</h4>
            <PublicFormFieldSelector
              appointmentType="reavaliacao"
              enabledFields={reavaliacaoEnabledFields || []}
            />
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Campos de Avaliação</h4>
            <PublicEvaluationFieldSelector
              appointmentType="reavaliacao"
              enabledFields={reavaliacaoEnabledEvaluationFields}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reavaliacao-feeding-history" className="text-sm font-medium">
                Recordatório Alimentar
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite ao paciente informar a rotina alimentar atual
              </p>
            </div>
            <Switch
              id="reavaliacao-feeding-history"
              checked={reavaliacaoEnableFeedingHistory ?? false}
              onCheckedChange={(checked) => handleToggleFeedingHistory("reavaliacao", checked)}
              disabled={togglingFeedingType === "reavaliacao"}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reavaliacao-attachments" className="text-sm font-medium">
                Envio de Arquivos
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite enviar exames, receitas e outros documentos
              </p>
            </div>
            <Switch
              id="reavaliacao-attachments"
              checked={reavaliacaoEnableAttachments ?? false}
              onCheckedChange={(checked) => handleToggleAttachments("reavaliacao", checked)}
              disabled={togglingAttachmentsType === "reavaliacao"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Híbrido Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Formulário Híbrido</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRegenerateToken("hibrido")}
              disabled={isGenerating || regeneratingType === "hibrido"}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${regeneratingType === "hibrido" ? "animate-spin" : ""}`}
              />
              Regenerar Link
            </Button>
          </CardTitle>
          <CardDescription>
            Link para pacientes que farão consultas híbridas (online + presencial)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hibridoToken ? (
            <TokenDisplay token={hibridoToken} type="hibrido" />
          ) : (
            <Button
              onClick={() => handleRegenerateToken("hibrido")}
              disabled={isGenerating}
            >
              Gerar Link Híbrido
            </Button>
          )}

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Campos de Anamnese</h4>
            <PublicFormFieldSelector
              appointmentType="hibrido"
              enabledFields={hibridoEnabledFields || []}
            />
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Campos de Avaliação</h4>
            <PublicEvaluationFieldSelector
              appointmentType="hibrido"
              enabledFields={hibridoEnabledEvaluationFields}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hibrido-feeding-history" className="text-sm font-medium">
                Recordatório Alimentar
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite ao paciente informar a rotina alimentar atual
              </p>
            </div>
            <Switch
              id="hibrido-feeding-history"
              checked={hibridoEnableFeedingHistory ?? false}
              onCheckedChange={(checked) => handleToggleFeedingHistory("hibrido", checked)}
              disabled={togglingFeedingType === "hibrido"}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hibrido-attachments" className="text-sm font-medium">
                Envio de Arquivos
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite enviar exames, receitas e outros documentos
              </p>
            </div>
            <Switch
              id="hibrido-attachments"
              checked={hibridoEnableAttachments ?? false}
              onCheckedChange={(checked) => handleToggleAttachments("hibrido", checked)}
              disabled={togglingAttachmentsType === "hibrido"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Consultoria Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Formulário de Consultoria</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRegenerateToken("consultoria")}
              disabled={isGenerating || regeneratingType === "consultoria"}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${regeneratingType === "consultoria" ? "animate-spin" : ""}`}
              />
              Regenerar Link
            </Button>
          </CardTitle>
          <CardDescription>
            Link para pacientes que farão consultas de consultoria nutricional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consultoriaToken ? (
            <TokenDisplay token={consultoriaToken} type="consultoria" />
          ) : (
            <Button
              onClick={() => handleRegenerateToken("consultoria")}
              disabled={isGenerating}
            >
              Gerar Link de Consultoria
            </Button>
          )}

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Campos de Anamnese</h4>
            <PublicFormFieldSelector
              appointmentType="consultoria"
              enabledFields={consultoriaEnabledFields || []}
            />
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 text-sm font-medium">Campos de Avaliação</h4>
            <PublicEvaluationFieldSelector
              appointmentType="consultoria"
              enabledFields={consultoriaEnabledEvaluationFields}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="consultoria-feeding-history" className="text-sm font-medium">
                Recordatório Alimentar
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite ao paciente informar a rotina alimentar atual
              </p>
            </div>
            <Switch
              id="consultoria-feeding-history"
              checked={consultoriaEnableFeedingHistory ?? false}
              onCheckedChange={(checked) => handleToggleFeedingHistory("consultoria", checked)}
              disabled={togglingFeedingType === "consultoria"}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="consultoria-attachments" className="text-sm font-medium">
                Envio de Arquivos
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite enviar exames, receitas e outros documentos
              </p>
            </div>
            <Switch
              id="consultoria-attachments"
              checked={consultoriaEnableAttachments ?? false}
              onCheckedChange={(checked) => handleToggleAttachments("consultoria", checked)}
              disabled={togglingAttachmentsType === "consultoria"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
