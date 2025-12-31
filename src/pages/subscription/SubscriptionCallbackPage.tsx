import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useFetchSubscriptionQuery } from "@/app/state/features/subscriptionSlice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/infra/firebase";

type CallbackStatus = "loading" | "success" | "pending" | "error";

const SubscriptionCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { dbUid } = useAuth();

  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("");

  // Fetch subscription to verify status
  const { data: subscription, isLoading: subscriptionLoading } =
    useFetchSubscriptionQuery(
      dbUid || "",
      { skip: !dbUid, pollingInterval: 2000 }, // Poll every 2 seconds
    );

  useEffect(() => {
    // Get Mercado Pago callback parameters
    // eslint-disable-next-line camelcase
    const collection_id = searchParams.get("collection_id");
    // eslint-disable-next-line camelcase
    const collection_status = searchParams.get("collection_status");
    // eslint-disable-next-line camelcase
    const payment_id = searchParams.get("payment_id");
    // eslint-disable-next-line camelcase
    const status_param = searchParams.get("status");
    // eslint-disable-next-line camelcase
    const external_reference = searchParams.get("external_reference");
    // eslint-disable-next-line camelcase
    const payment_type = searchParams.get("payment_type");
    // eslint-disable-next-line camelcase
    const merchant_order_id = searchParams.get("merchant_order_id");
    // eslint-disable-next-line camelcase
    const preference_id = searchParams.get("preference_id");
    // eslint-disable-next-line camelcase
    const site_id = searchParams.get("site_id");
    // eslint-disable-next-line camelcase
    const processing_mode = searchParams.get("processing_mode");
    // eslint-disable-next-line camelcase
    const merchant_account_id = searchParams.get("merchant_account_id");

    console.log("Mercado Pago callback params:", {
      // eslint-disable-next-line camelcase
      collection_id,
      // eslint-disable-next-line camelcase
      collection_status,
      // eslint-disable-next-line camelcase
      payment_id,
      // eslint-disable-next-line camelcase
      status: status_param,
      // eslint-disable-next-line camelcase
      external_reference,
      // eslint-disable-next-line camelcase
      payment_type,
      // eslint-disable-next-line camelcase
      merchant_order_id,
      // eslint-disable-next-line camelcase
      preference_id,
      // eslint-disable-next-line camelcase
      site_id,
      // eslint-disable-next-line camelcase
      processing_mode,
      // eslint-disable-next-line camelcase
      merchant_account_id,
    });

    // Determine status based on callback parameters
    // eslint-disable-next-line camelcase
    if (collection_status === "approved" || status_param === "approved") {
      setStatus("success");
      setMessage("Pagamento aprovado! Sua assinatura foi ativada com sucesso.");
      // eslint-disable-next-line camelcase
    } else if (collection_status === "pending" || status_param === "pending") {
      setStatus("pending");
      setMessage(
        "Pagamento pendente. Você receberá uma confirmação assim que o pagamento for processado.",
      );
      // eslint-disable-next-line camelcase
    } else if (
      // eslint-disable-next-line camelcase
      collection_status === "rejected" ||
      // eslint-disable-next-line camelcase
      status_param === "rejected"
    ) {
      setStatus("error");
      setMessage(
        "Pagamento rejeitado. Por favor, tente novamente com outro método de pagamento.",
      );
    } else if (searchParams.get("error")) {
      setStatus("error");
      setMessage(
        "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.",
      );
    } else {
      // Default to loading if we don't have clear status
      setStatus("loading");
      setMessage("Verificando status do pagamento...");
    }
  }, [searchParams]);

  // If we have subscription data and it's active, ensure we show success
  useEffect(() => {
    if (subscription?.status === "active" && status !== "success") {
      setStatus("success");
      setMessage("Assinatura ativada com sucesso!");
    }
  }, [subscription, status]);

  const handleContinue = () => {
    if (status === "success") {
      navigate(ROUTES.DASHBOARD);
    } else if (status === "error") {
      navigate(ROUTES.SUBSCRIPTION.PRICING);
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  const getIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-16 w-16 text-green-500" />;
      case "error":
        return <XCircle className="h-16 w-16 text-destructive" />;
      case "pending":
        return <Loader2 className="h-16 w-16 animate-spin text-yellow-500" />;
      default:
        return (
          <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
        );
    }
  };

  const getTitle = () => {
    switch (status) {
      case "success":
        return "Pagamento Confirmado!";
      case "error":
        return "Pagamento Não Processado";
      case "pending":
        return "Pagamento Pendente";
      default:
        return "Processando...";
    }
  };

  const getAlertVariant = () => {
    switch (status) {
      case "success":
        return "default";
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">{getIcon()}</div>
          <CardTitle className="text-3xl">{getTitle()}</CardTitle>
          <CardDescription>
            {status === "loading"
              ? "Aguarde enquanto verificamos seu pagamento..."
              : ""}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant={getAlertVariant()}>
            <AlertTitle>
              {status === "success" && "Tudo certo!"}
              {status === "pending" && "Aguardando confirmação"}
              {status === "error" && "Ops! Algo deu errado"}
              {status === "loading" && "Verificando..."}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          {status === "success" && subscription && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-4">
              <h4 className="font-semibold">Detalhes da Assinatura</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Plano</p>
                  <p className="font-medium capitalize">
                    {subscription.planTier}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Período</p>
                  <p className="font-medium">
                    {subscription.billingInterval === "monthly"
                      ? "Mensal"
                      : "Anual"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium text-green-600">Ativo</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Próxima cobrança</p>
                  <p className="font-medium">
                    {subscription.nextBillingDate
                      ? new Date(
                          subscription.nextBillingDate,
                        ).toLocaleDateString("pt-BR")
                      : new Date(
                          subscription.currentPeriodEnd,
                        ).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "pending" && (
            <div className="rounded-lg bg-yellow-500/10 p-4">
              <h4 className="mb-2 font-semibold">O que acontece agora?</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Seu pagamento está sendo processado</li>
                <li>Você receberá um email de confirmação em breve</li>
                <li>
                  A assinatura será ativada assim que o pagamento for confirmado
                </li>
                <li>
                  Você pode continuar usando o plano gratuito enquanto isso
                </li>
              </ul>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-lg bg-destructive/10 p-4">
              <h4 className="mb-2 font-semibold">Como proceder?</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Verifique se os dados do pagamento estão corretos</li>
                <li>Tente usar outro método de pagamento</li>
                <li>Entre em contato com seu banco se necessário</li>
                <li>Nossa equipe de suporte está disponível para ajudar</li>
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          {status === "success" && (
            <Button onClick={handleContinue} className="w-full sm:w-auto">
              Ir para o Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {status === "error" && (
            <>
              <Button
                onClick={handleContinue}
                variant="default"
                className="w-full sm:flex-1"
              >
                Tentar Novamente
              </Button>
              <Button
                onClick={() => navigate(ROUTES.DASHBOARD)}
                variant="outline"
                className="w-full sm:flex-1"
              >
                Voltar ao Dashboard
              </Button>
            </>
          )}

          {status === "pending" && (
            <Button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="w-full sm:w-auto"
            >
              Ir para o Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {status === "loading" && subscriptionLoading && (
            <div className="w-full text-center text-sm text-muted-foreground">
              Aguarde...
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubscriptionCallbackPage;
