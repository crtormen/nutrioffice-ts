import { httpsCallable } from "firebase/functions";
import { CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { functions, useAuth } from "@/infra/firebase";

const ProcessingSubscriptionPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { dbUid } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const planTier = searchParams.get("plan");
  const billingInterval = searchParams.get("interval") as
    | "monthly"
    | "annual"
    | null;

  useEffect(() => {
    // Validate required parameters
    if (!dbUid || !planTier || !billingInterval) {
      console.error("Missing required parameters:", {
        dbUid,
        planTier,
        billingInterval,
      });
      setError("Parâmetros inválidos. Por favor, tente novamente.");
      return;
    }

    // Create subscription and redirect to Mercado Pago
    const createSubscription = async () => {
      try {
        console.log("🚀 ProcessingSubscriptionPage - Creating subscription:", {
          planTier,
          billingInterval,
        });

        const createSubscriptionFn = httpsCallable(
          functions,
          "createSubscription",
        );
        const result = await createSubscriptionFn({
          planTier,
          billingInterval,
        });

        const data = result.data as { initPoint: string };

        console.log("✅ Subscription created, redirecting to:", data.initPoint);

        // Redirect to Mercado Pago payment page
        window.location.href = data.initPoint;
      } catch (error: unknown) {
        console.error("❌ Error creating subscription:", error);
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Erro ao processar assinatura. Tente novamente.";
        setError(errorMessage);
      }
    };

    createSubscription();
  }, [dbUid, planTier, billingInterval]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Erro ao Processar Assinatura
            </CardTitle>
            <CardDescription className="text-center">
              Ocorreu um problema ao processar sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(ROUTES.SUBSCRIPTION.PRICING)}
              >
                Voltar aos Planos
              </Button>
              <Button
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <CreditCard className="h-16 w-16 text-primary" />
              <Loader2 className="absolute -bottom-2 -right-2 h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Processando sua assinatura</CardTitle>
          <CardDescription>
            Aguarde enquanto redirecionamos você para o pagamento seguro...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>✓ Validando informações</p>
            <p>✓ Criando assinatura</p>
            <p className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecionando para pagamento seguro
            </p>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              Você será redirecionado para a página de pagamento do Mercado
              Pago. Este processo é 100% seguro e criptografado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingSubscriptionPage;
