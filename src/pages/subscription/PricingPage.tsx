import { useState } from "react";
import { Check, Zap, TrendingUp, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PLAN_CONFIGS, type PlanTier, type BillingInterval } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";
import { useFetchSubscriptionQuery } from "@/app/state/features/subscriptionSlice";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/infra/firebase";
import { toast } from "sonner";

export const PricingPage = () => {
  const { dbUid } = useAuth();
  const navigate = useNavigate();
  const { data: currentSubscription } = useFetchSubscriptionQuery(dbUid || "", {
    skip: !dbUid,
  });

  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handleSelectPlan = async (planTier: PlanTier) => {
    if (!dbUid) {
      toast.error("Você precisa estar logado para assinar um plano");
      navigate("/login");
      return;
    }

    if (planTier === "free") {
      toast.info("Você já está no plano gratuito");
      return;
    }

    setLoadingPlan(planTier);

    try {
      const createSubscription = httpsCallable(functions, "createSubscription");
      const result = await createSubscription({
        planTier,
        billingInterval,
      });

      const data = result.data as { initPoint: string };

      // Redirect to Mercado Pago payment page
      window.location.href = data.initPoint;
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      toast.error(error.message || "Erro ao criar assinatura");
      setLoadingPlan(null);
    }
  };

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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha o plano ideal para seu consultório
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comece grátis e escale conforme seu consultório cresce. Sem taxas de setup, cancele quando quiser.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label htmlFor="billing-toggle" className={billingInterval === "monthly" ? "font-semibold" : ""}>
            Mensal
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingInterval === "annual"}
            onCheckedChange={(checked) => setBillingInterval(checked ? "annual" : "monthly")}
          />
          <Label htmlFor="billing-toggle" className={billingInterval === "annual" ? "font-semibold" : ""}>
            Anual
            <span className="ml-2 text-sm text-primary font-bold">Economize 20%</span>
          </Label>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier) => {
            const config = PLAN_CONFIGS[tier];
            const Icon = planIcons[tier];
            const price = billingInterval === "annual" ? config.annualPrice : config.monthlyPrice;
            const monthlyEquivalent = billingInterval === "annual" ? price / 12 : price;
            const isCurrent = isCurrentPlan(tier);
            const isPopular = tier === "professional";

            return (
              <Card
                key={tier}
                className={`relative ${
                  isPopular ? "border-primary shadow-lg scale-105" : ""
                } ${isCurrent ? "bg-primary/5 border-primary" : ""}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Mais Popular
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Plano Atual
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
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
                        <p className="text-sm text-muted-foreground mt-1">Para sempre</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold">{formatPrice(monthlyEquivalent)}</span>
                          <span className="text-muted-foreground">/mês</span>
                        </div>
                        {billingInterval === "annual" && (
                          <p className="text-sm text-muted-foreground mt-1">
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
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    disabled={isCurrent || loadingPlan === tier}
                    onClick={() => handleSelectPlan(tier)}
                  >
                    {loadingPlan === tier
                      ? "Processando..."
                      : isCurrent
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
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Posso mudar de plano a qualquer momento?</h3>
              <p className="text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações entram em vigor imediatamente.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">O que acontece se eu exceder o limite de pacientes?</h3>
              <p className="text-muted-foreground">
                Você será notificado para fazer upgrade do seu plano. Não se preocupe, seus dados estão seguros e você terá acesso de leitura até fazer o upgrade.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Posso cancelar a assinatura?</h3>
              <p className="text-muted-foreground">
                Sim, você pode cancelar a qualquer momento. Seu plano continuará ativo até o final do período pago e depois voltará para o plano gratuito.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Quais formas de pagamento são aceitas?</h3>
              <p className="text-muted-foreground">
                Aceitamos PIX, cartão de crédito e boleto bancário através do Mercado Pago.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Há taxa de setup ou contrato de fidelidade?</h3>
              <p className="text-muted-foreground">
                Não! Sem taxas escondidas, sem contratos de longo prazo. Pague apenas pelo que usar.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="mt-20 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Ainda tem dúvidas? Entre em contato conosco
          </p>
          <Button variant="outline" size="lg" onClick={() => navigate("/contact")}>
            Falar com Suporte
          </Button>
        </div>
      </div>
    </div>
  );
};
