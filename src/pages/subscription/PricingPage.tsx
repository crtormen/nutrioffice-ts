import { Building2, Check, TrendingUp, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ROUTES } from "@/app/router/routes";
import { useFetchSubscriptionQuery } from "@/app/state/features/subscriptionSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type BillingInterval,
  PLAN_CONFIGS,
  type PlanTier,
} from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

const PricingPage = () => {
  const { dbUid } = useAuth();
  const navigate = useNavigate();
  const { data: currentSubscription } = useFetchSubscriptionQuery(dbUid || "", {
    skip: !dbUid,
  });

  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handleSelectPlan = useCallback(
    async (planTier: PlanTier) => {
      console.log(
        "💰 handleSelectPlan called with:",
        planTier,
        "dbUid:",
        dbUid,
      );

      // For free plan, redirect to signup
      if (planTier === "free") {
        if (!dbUid) {
          navigate("/signup");
        } else {
          toast.info("Você já está no plano gratuito");
        }
        return;
      }

      // For paid plans, redirect to signup with plan selection
      if (!dbUid) {
        // Store selected plan in sessionStorage to resume after signup
        const planData = { planTier, billingInterval };
        console.log("💾 Storing plan in sessionStorage:", planData);
        sessionStorage.setItem("selectedPlan", JSON.stringify(planData));
        toast.info("Crie sua conta para continuar com a assinatura");
        console.log("🔄 Navigating to /signup");
        navigate("/signup");
        return;
      }

      console.log("✅ User authenticated, redirecting to processing page...");

      // Redirect to processing page with plan details
      navigate(
        `/${ROUTES.SUBSCRIPTION.PROCESSING}?plan=${planTier}&interval=${billingInterval}`,
      );
    },
    [dbUid, billingInterval, navigate],
  );

  // Check if user just logged in with a selected plan
  useEffect(() => {
    console.log("🎯 PricingPage useEffect - dbUid:", dbUid);
    if (dbUid) {
      const storedPlan = sessionStorage.getItem("selectedPlan");
      console.log("📦 PricingPage - storedPlan:", storedPlan);
      if (storedPlan) {
        try {
          const { planTier, billingInterval: savedInterval } =
            JSON.parse(storedPlan);
          console.log("✅ PricingPage - Parsed plan:", {
            planTier,
            savedInterval,
          });
          sessionStorage.removeItem("selectedPlan"); // Clear after reading

          // Set the billing interval from storage
          setBillingInterval(savedInterval);

          // Automatically trigger subscription creation
          toast.info("Continuando com sua assinatura...");
          console.log(
            "🚀 PricingPage - Calling handleSelectPlan with:",
            planTier,
          );
          handleSelectPlan(planTier);
        } catch (error) {
          console.error("❌ Error parsing stored plan:", error);
          sessionStorage.removeItem("selectedPlan");
        }
      } else {
        console.log("ℹ️ PricingPage - No stored plan found");
      }
    } else {
      console.log("⚠️ PricingPage - No dbUid (user not authenticated)");
    }
  }, [dbUid, handleSelectPlan]);

  const isCurrentPlan = (planTier: PlanTier) => {
    return currentSubscription?.planTier === planTier;
  };

  const planIcons = {
    free: Zap,
    starter: TrendingUp,
    professional: Building2,
    enterprise: Building2,
  };

  const tiers: PlanTier[] = ["free", "starter", "professional", "enterprise"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            Escolha o plano ideal para seu consultório
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Comece grátis e escale conforme seu consultório cresce. Sem taxas de
            setup, cancele quando quiser.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <Label
            htmlFor="billing-toggle"
            className={billingInterval === "monthly" ? "font-semibold" : ""}
          >
            Mensal
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingInterval === "annual"}
            onCheckedChange={(checked) =>
              setBillingInterval(checked ? "annual" : "monthly")
            }
          />
          <Label
            htmlFor="billing-toggle"
            className={billingInterval === "annual" ? "font-semibold" : ""}
          >
            Anual
            <span className="ml-2 text-sm font-bold text-primary">
              Economize 20%
            </span>
          </Label>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => {
            const config = PLAN_CONFIGS[tier];
            const Icon = planIcons[tier];
            const price =
              billingInterval === "annual"
                ? config.annualPrice
                : config.monthlyPrice;
            const monthlyEquivalent =
              billingInterval === "annual" ? price / 12 : price;
            const isCurrent = isCurrentPlan(tier);
            const isPopular = tier === "professional";

            return (
              <Card
                key={tier}
                className={`relative ${
                  isPopular ? "scale-105 border-primary shadow-lg" : ""
                } ${isCurrent ? "border-primary bg-primary/5" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                      Mais Popular
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-green-500 px-4 py-1 text-sm font-semibold text-white">
                      Plano Atual
                    </span>
                  </div>
                )}

                <CardHeader className="pb-4 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{config.name}</CardTitle>
                  <CardDescription>
                    {config.maxCustomers === Infinity
                      ? "Pacientes ilimitados"
                      : `Até ${config.maxCustomers} pacientes`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="text-center">
                    {tier === "free" ? (
                      <div>
                        <p className="text-4xl font-bold">Grátis</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Para sempre
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold">
                            {formatPrice(monthlyEquivalent)}
                          </span>
                          <span className="text-muted-foreground">/mês</span>
                        </div>
                        {billingInterval === "annual" && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatPrice(price)} cobrado anualmente
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {config.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    disabled={isCurrent}
                    onClick={() => handleSelectPlan(tier)}
                  >
                    {isCurrent
                      ? "Plano Atual"
                      : tier === "free"
                        ? "Começar Grátis"
                        : "Assinar Agora"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold">
                Posso mudar de plano a qualquer momento?
              </h3>
              <p className="text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a
                qualquer momento. As alterações entram em vigor imediatamente.
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">
                O que acontece se eu exceder o limite de pacientes?
              </h3>
              <p className="text-muted-foreground">
                Você será notificado para fazer upgrade do seu plano. Não se
                preocupe, seus dados estão seguros e você terá acesso de leitura
                até fazer o upgrade.
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">
                Posso cancelar a assinatura?
              </h3>
              <p className="text-muted-foreground">
                Sim, você pode cancelar a qualquer momento. Seu plano continuará
                ativo até o final do período pago e depois voltará para o plano
                gratuito.
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">
                Quais formas de pagamento são aceitas?
              </h3>
              <p className="text-muted-foreground">
                Aceitamos PIX, cartão de crédito e boleto bancário através do
                Mercado Pago.
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">
                Há taxa de setup ou contrato de fidelidade?
              </h3>
              <p className="text-muted-foreground">
                Não! Sem taxas escondidas, sem contratos de longo prazo. Pague
                apenas pelo que usar.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="mt-20 text-center">
          <p className="mb-4 text-lg text-muted-foreground">
            Ainda tem dúvidas? Entre em contato conosco
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/contact")}
          >
            Falar com Suporte
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
