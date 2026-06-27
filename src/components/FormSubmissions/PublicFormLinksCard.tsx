import {
  Check,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useFetchAnamnesisTokensQuery } from "@/app/state/features/anamnesisTokensSlice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

export function PublicFormLinksCard() {
  const { dbUid } = useAuth();
  const { data: tokens, isLoading } = useFetchAnamnesisTokensQuery(
    dbUid || "",
    {
      skip: !dbUid,
    },
  );

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const getFormUrl = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/anamnesis/public/${token}`;
  };

  const handleCopyLink = async (token: string, type: string) => {
    const url = getFormUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      toast.success(`Link ${type} copiado para a área de transferência!`);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      toast.error("Erro ao copiar link");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Links dos Formulários Públicos
          </CardTitle>
          <CardDescription>
            Compartilhe estes links com novos pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasOnlineToken = tokens?.onlineToken;
  const hasPresencialToken = tokens?.presencialToken;
  const hasReavaliacaoToken = tokens?.reavaliacaoToken;
  const hasConsultoriaToken = tokens?.consultoriaToken;
  const hasHibridoToken = tokens?.hibridoToken;

  if (!hasOnlineToken && !hasPresencialToken && !hasReavaliacaoToken && !hasConsultoriaToken && !hasHibridoToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Links dos Formulários Públicos
          </CardTitle>
          <CardDescription>
            Compartilhe estes links com novos pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Nenhum token de formulário público configurado. Configure os
              tokens nas{" "}
              <a href="/user/settings/public-forms" className="underline">
                configurações
              </a>
              .
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Links dos Formulários Públicos
        </CardTitle>
        <CardDescription>
          Compartilhe estes links com novos pacientes para que eles preencham o
          formulário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasOnlineToken && (
          <div className="space-y-2">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-blue-500 text-blue-700"
              >
                Online
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                value={getFormUrl(tokens.onlineToken!)}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopyLink(tokens.onlineToken!, "online")}
                title="Copiar link"
              >
                {copiedToken === tokens.onlineToken ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  window.open(getFormUrl(tokens.onlineToken!), "_blank")
                }
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {hasPresencialToken && (
          <div className="space-y-2">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-green-500 text-green-700"
              >
                Presencial
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                value={getFormUrl(tokens.presencialToken!)}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleCopyLink(tokens.presencialToken!, "presencial")
                }
                title="Copiar link"
              >
                {copiedToken === tokens.presencialToken ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  window.open(getFormUrl(tokens.presencialToken!), "_blank")
                }
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {hasReavaliacaoToken && (
          <div className="space-y-2">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-purple-500 text-purple-700"
              >
                Reavaliação
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                value={getFormUrl(tokens.reavaliacaoToken!)}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleCopyLink(tokens.reavaliacaoToken!, "presencial")
                }
                title="Copiar link"
              >
                {copiedToken === tokens.reavaliacaoToken ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  window.open(getFormUrl(tokens.reavaliacaoToken!), "_blank")
                }
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {hasConsultoriaToken && (
          <div className="space-y-2">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-orange-500 text-orange-700"
              >
                Consultoria
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                value={getFormUrl(tokens!.consultoriaToken!)}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopyLink(tokens!.consultoriaToken!, "consultoria")}
                title="Copiar link"
              >
                {copiedToken === tokens!.consultoriaToken ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  window.open(getFormUrl(tokens!.consultoriaToken!), "_blank")
                }
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {hasHibridoToken && (
          <div className="space-y-2">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-teal-500 text-teal-700"
              >
                Híbrido
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                value={getFormUrl(tokens!.hibridoToken!)}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopyLink(tokens!.hibridoToken!, "hibrido")}
                title="Copiar link"
              >
                {copiedToken === tokens!.hibridoToken ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  window.open(getFormUrl(tokens!.hibridoToken!), "_blank")
                }
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="pt-2 text-sm text-muted-foreground">
          <p>
            💡 <strong>Dica:</strong> Você pode enviar esses links via WhatsApp,
            email ou redes sociais para que novos pacientes preencham seus dados
            antes da consulta.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
