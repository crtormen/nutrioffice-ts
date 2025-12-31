import { FileCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useFetchAnamnesisTokensQuery,
  useGenerateAnamnesisTokenMutation,
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
import { useAuth } from "@/infra/firebase/hooks/useAuth";

export default function PublicFormsSettingsTab() {
  const { dbUid } = useAuth();
  const [regeneratingType, setRegeneratingType] = useState<
    "online" | "presencial" | null
  >(null);

  const {
    data: tokensData,
    isLoading,
    error,
  } = useFetchAnamnesisTokensQuery(dbUid || "", {
    skip: !dbUid,
  });

  const [generateToken, { isLoading: isGenerating }] =
    useGenerateAnamnesisTokenMutation();

  const handleRegenerateToken = async (type: "online" | "presencial") => {
    if (!dbUid) return;

    setRegeneratingType(type);
    try {
      await generateToken({
        uid: dbUid,
        type,
      }).unwrap();

      toast.success(
        `Link ${type === "online" ? "Online" : "Presencial"} regenerado com sucesso!`,
      );
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
    onlineEnabledFields,
    presencialEnabledFields,
    onlineEnabledEvaluationFields,
    presencialEnabledEvaluationFields,
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
        </CardContent>
      </Card>
    </div>
  );
}
