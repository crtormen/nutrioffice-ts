import { httpsCallable } from "firebase/functions";
import {
  AlertCircle,
  ArrowUpCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  TrendingUp,
  XCircle,
  XOctagon,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ROUTES } from "@/app/router/routes";
import {
  useFetchInvoicesQuery,
  useFetchPaymentHistoryQuery,
  useFetchSubscriptionQuery,
} from "@/app/state/features/subscriptionSlice";
import { PageHeader } from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  BILLING_INTERVALS,
  INVOICE_STATUS,
  PAYMENT_EVENTS,
  PLAN_CONFIGS,
  PLAN_TIERS,
  SUBSCRIPTION_STATUS,
} from "@/domain/entities";
import { functions, useAuth } from "@/infra/firebase";

const SubscriptionManagementPage = () => {
  const navigate = useNavigate();
  const { dbUid } = useAuth();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const { data: subscription, isLoading: subscriptionLoading } =
    useFetchSubscriptionQuery(dbUid || "", { skip: !dbUid });
  const { data: invoices = [], isLoading: invoicesLoading } =
    useFetchInvoicesQuery(dbUid || "", {
      skip: !dbUid,
    });
  const { data: paymentHistory = [], isLoading: historyLoading } =
    useFetchPaymentHistoryQuery(dbUid || "", { skip: !dbUid });

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Assinatura" },
  ];

  const planConfig = subscription ? PLAN_CONFIGS[subscription.planTier] : null;

  const getStatusBadge = () => {
    if (!subscription) return null;

    const variants = {
      [SUBSCRIPTION_STATUS.ACTIVE]: "default" as const,
      [SUBSCRIPTION_STATUS.PAST_DUE]: "destructive" as const,
      [SUBSCRIPTION_STATUS.CANCELED]: "secondary" as const,
      [SUBSCRIPTION_STATUS.INACTIVE]: "outline" as const,
    };

    const labels = {
      [SUBSCRIPTION_STATUS.ACTIVE]: "Ativo",
      [SUBSCRIPTION_STATUS.PAST_DUE]: "Pagamento Atrasado",
      [SUBSCRIPTION_STATUS.CANCELED]: "Cancelado",
      [SUBSCRIPTION_STATUS.INACTIVE]: "Inativo",
    };

    return (
      <Badge variant={variants[subscription.status]}>
        {labels[subscription.status]}
      </Badge>
    );
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setIsCanceling(true);
    try {
      const cancelSubscription = httpsCallable(functions, "cancelSubscription");
      await cancelSubscription();

      toast.success("Assinatura cancelada", {
        description: "Seu plano continuará ativo até o final do período pago.",
      });

      setShowCancelDialog(false);
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      toast.error("Erro ao cancelar assinatura", {
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case PAYMENT_EVENTS.SUBSCRIPTION_CREATED:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case PAYMENT_EVENTS.PAYMENT_SUCCEEDED:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case PAYMENT_EVENTS.PAYMENT_FAILED:
        return <XCircle className="h-4 w-4 text-destructive" />;
      case PAYMENT_EVENTS.UPGRADED:
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case PAYMENT_EVENTS.DOWNGRADED:
        return <ArrowUpCircle className="h-4 w-4 rotate-180 text-orange-500" />;
      case PAYMENT_EVENTS.CANCELED:
        return <XOctagon className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getEventLabel = (event: string) => {
    const labels = {
      [PAYMENT_EVENTS.SUBSCRIPTION_CREATED]: "Assinatura criada",
      [PAYMENT_EVENTS.PAYMENT_SUCCEEDED]: "Pagamento aprovado",
      [PAYMENT_EVENTS.PAYMENT_FAILED]: "Pagamento falhou",
      [PAYMENT_EVENTS.UPGRADED]: "Upgrade de plano",
      [PAYMENT_EVENTS.DOWNGRADED]: "Downgrade de plano",
      [PAYMENT_EVENTS.CANCELED]: "Assinatura cancelada",
    };
    return labels[event as keyof typeof labels] || event;
  };

  if (subscriptionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6 p-6 md:p-10">
        <PageHeader breadcrumbs={breadcrumbs} showBackButton />

        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Assinatura Ativa</CardTitle>
            <CardDescription>
              Você não possui uma assinatura ativa. Escolha um plano para
              começar.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate(ROUTES.SUBSCRIPTION.PRICING)}>
              Ver Planos Disponíveis
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader breadcrumbs={breadcrumbs} showBackButton />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Minha Assinatura
          </h2>
          <p className="text-muted-foreground">
            Gerencie seu plano e histórico de pagamentos
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Plano Atual
              </CardTitle>
              <CardDescription>Detalhes da sua assinatura</CardDescription>
            </div>
            {subscription.planTier !== PLAN_TIERS.FREE && (
              <Button
                variant="outline"
                onClick={() => navigate(ROUTES.SUBSCRIPTION.PRICING)}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Alterar Plano
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Plano</p>
              <p className="text-2xl font-bold">{planConfig?.name}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Período</p>
              <p className="text-xl font-semibold">
                {subscription.billingInterval === BILLING_INTERVALS.MONTHLY
                  ? "Mensal"
                  : "Anual"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Valor</p>
              <p className="text-xl font-semibold">
                {subscription.billingInterval === BILLING_INTERVALS.MONTHLY
                  ? formatCurrency(planConfig?.monthlyPrice || 0)
                  : formatCurrency(planConfig?.annualPrice || 0)}
                <span className="text-sm font-normal text-muted-foreground">
                  /
                  {subscription.billingInterval === BILLING_INTERVALS.MONTHLY
                    ? "mês"
                    : "ano"}
                </span>
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">
                Início do Período
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(subscription.currentPeriodStart)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">
                Fim do Período
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cancelamento Agendado</AlertTitle>
              <AlertDescription>
                Sua assinatura será cancelada em{" "}
                {formatDate(subscription.currentPeriodEnd)}. Você poderá
                continuar usando até essa data.
              </AlertDescription>
            </Alert>
          )}

          {subscription.planTier === PLAN_TIERS.FREE && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Plano Gratuito</AlertTitle>
              <AlertDescription>
                Faça upgrade para desbloquear mais recursos e aumentar seu
                limite de pacientes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        {subscription.planTier !== PLAN_TIERS.FREE &&
          !subscription.cancelAtPeriodEnd && (
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                Cancelar Assinatura
              </Button>
            </CardFooter>
          )}
      </Card>

      {/* Invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Faturas
            </CardTitle>
            <CardDescription>Histórico de cobranças</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {formatCurrency(invoice.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        invoice.status === INVOICE_STATUS.PAID
                          ? "default"
                          : invoice.status === INVOICE_STATUS.PENDING
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {invoice.status === INVOICE_STATUS.PAID && "Pago"}
                      {invoice.status === INVOICE_STATUS.PENDING && "Pendente"}
                      {invoice.status === INVOICE_STATUS.FAILED && "Falhou"}
                      {invoice.status === INVOICE_STATUS.REFUNDED &&
                        "Reembolsado"}
                    </Badge>
                    {invoice.pdfUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Atividades</CardTitle>
            <CardDescription>Registro de eventos da assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentHistory.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 border-b pb-3 last:border-0"
                >
                  {getEventIcon(entry.event)}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {getEventLabel(entry.event)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </p>
                    {entry.amount && (
                      <p className="text-sm font-semibold">
                        {formatCurrency(entry.amount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura?
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>O que acontece ao cancelar?</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                • Você poderá usar o plano até{" "}
                {formatDate(subscription.currentPeriodEnd)}
              </p>
              <p>• Após essa data, seu plano voltará para o Gratuito</p>
              <p>• Seus dados serão mantidos</p>
              <p>• Você pode reativar a qualquer momento</p>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Manter Assinatura
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCanceling}
            >
              {isCanceling ? "Cancelando..." : "Sim, Cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagementPage;
