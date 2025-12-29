import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

import { useUpdateInstallmentStatusMutation } from "@/app/state/features/paymentsSlice";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  IInstallment,
  INSTALLMENT_STATUS_LABELS,
} from "@/domain/entities/finances";
import { useAuth } from "@/infra/firebase/hooks";

interface InstallmentRowProps {
  installment: IInstallment;
}

export const InstallmentRow = ({ installment }: InstallmentRowProps) => {
  const { dbUid } = useAuth();
  const [updateStatus] = useUpdateInstallmentStatusMutation();
  const { toast } = useToast();

  const handleMarkAsPaid = async () => {
    try {
      await updateStatus({
        uid: dbUid!,
        installmentId: installment.id!,
        status: "paid",
        paidDate: new Date().toISOString(),
      }).unwrap();

      toast({
        title: "Parcela atualizada",
        description: "Parcela marcada como paga com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a parcela. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const statusColors = {
    pending:
      "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
    paid: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
    reconciled: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            Parcela {installment.installmentNumber}
          </p>
          <span className="text-sm text-muted-foreground">-</span>
          <p className="text-sm font-semibold">
            {formatCurrency(installment.valor)}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Vencimento:{" "}
            {format(new Date(installment.dueDate), "dd/MM/yyyy", {
              locale: ptBR,
            })}
          </span>
          {installment.paidDate && (
            <>
              <span>•</span>
              <span>
                Pago em:{" "}
                {format(new Date(installment.paidDate), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
            </>
          )}
        </div>
        {installment.obs && (
          <p className="mt-1 text-xs text-muted-foreground">
            {installment.obs}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[installment.status]}`}
        >
          {INSTALLMENT_STATUS_LABELS[installment.status]}
        </span>

        {installment.status === "pending" && (
          <Button variant="outline" size="sm" onClick={handleMarkAsPaid}>
            Marcar como Pago
          </Button>
        )}
      </div>
    </div>
  );
};
