import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import React, { useState } from "react";

import {
  useFetchFinancePaymentsQuery,
  useFetchPaymentInstallmentsQuery,
} from "@/app/state/features/paymentsSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IPayment, PAYMENT_METHODS } from "@/domain/entities/finances";
import { useAuth } from "@/infra/firebase/hooks";

import { InstallmentRow } from "./InstallmentRow";

interface PaymentHistoryCardProps {
  financeId: string;
}

export const PaymentHistoryCard = ({ financeId }: PaymentHistoryCardProps) => {
  const { dbUid } = useAuth();
  const { data: payments = [], isLoading } = useFetchFinancePaymentsQuery({
    uid: dbUid!,
    financeId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pagamentos</CardTitle>
        <CardDescription>
          Todos os pagamentos registrados para esta venda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Nenhum pagamento registrado
          </p>
        ) : (
          payments.map((payment) => (
            <PaymentItem key={payment.id} payment={payment} />
          ))
        )}
      </CardContent>
    </Card>
  );
};

interface PaymentItemProps {
  payment: IPayment;
}

const PaymentItem = ({ payment }: PaymentItemProps) => {
  const { dbUid } = useAuth();
  const { data: installments = [], isLoading } =
    useFetchPaymentInstallmentsQuery(
      {
        uid: dbUid!,
        paymentId: payment.id!,
      },
      {
        skip: !payment.hasInstallments,
      },
    );
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const paymentMethodLabel =
    PAYMENT_METHODS.find((m) => m.value === payment.method)?.label ||
    payment.method;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{paymentMethodLabel}</p>
            {payment.hasInstallments && payment.installmentsCount && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {payment.installmentsCount}x
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(payment.createdAt), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatCurrency(payment.valor)}</p>
          {payment.hasInstallments && payment.installmentsCount && (
            <p className="text-xs text-muted-foreground">
              {payment.installmentsCount}x de{" "}
              {formatCurrency(payment.valor / payment.installmentsCount)}
            </p>
          )}
        </div>
      </div>

      {payment.obs && (
        <p className="border-t pt-2 text-sm text-muted-foreground">
          {payment.obs}
        </p>
      )}

      {payment.hasInstallments && (
        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full justify-between"
          >
            <span className="text-sm font-medium">
              {expanded ? "Ocultar" : "Ver"} Parcelas
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {expanded && (
            <div className="mt-3 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : installments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma parcela encontrada
                </p>
              ) : (
                installments.map((inst) => (
                  <InstallmentRow key={inst.id} installment={inst} />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
