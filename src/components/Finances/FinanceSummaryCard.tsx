import { AlertCircle, DollarSign } from "lucide-react";

import { useFetchCustomerFinancesQuery } from "@/app/state/features/customerFinancesSlice";
import { useFetchOverdueInstallmentsQuery } from "@/app/state/features/paymentsSlice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OVERDUE_TRACKABLE_METHODS } from "@/domain/entities/finances";
import { useAuth } from "@/infra/firebase/hooks";
import { dateInString, priceFormatter } from "@/lib/utils";

interface FinanceSummaryCardProps {
  customerId: string;
}

export const FinanceSummaryCard = ({ customerId }: FinanceSummaryCardProps) => {
  const { dbUid } = useAuth();

  const { data: finances, isLoading } = useFetchCustomerFinancesQuery({
    uid: dbUid || "",
    customerId,
  });

  const { data: overdueInstallments } = useFetchOverdueInstallmentsQuery({
    uid: dbUid || "",
    methodFilter: [...OVERDUE_TRACKABLE_METHODS],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">Carregando...</CardContent>
      </Card>
    );
  }

  if (!finances || finances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma venda registrada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const lastFinance = finances[0]; // Already sorted by createdAt desc
  const totalPending = finances
    .filter((f) => f.status !== "paid")
    .reduce((sum, f) => sum + f.saldo, 0);

  // Check for overdue installments for this customer
  const customerOverdue =
    overdueInstallments?.filter((inst) => inst.customerId === customerId) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue Alert */}
        {customerOverdue.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Pagamento em atraso!</strong> {customerOverdue.length}{" "}
              parcela(s) de Pix Programado/Recorrência vencida(s).
            </AlertDescription>
          </Alert>
        )}

        {/* Last Purchase */}
        <div>
          <p className="text-sm text-muted-foreground">Última Compra</p>
          <p className="font-medium">{dateInString(lastFinance.createdAt)}</p>
        </div>

        {/* Pending Payments */}
        {totalPending > 0 && (
          <div>
            <p className="text-sm text-muted-foreground">Saldo Pendente</p>
            <p className="font-medium text-orange-600">
              {priceFormatter.format(totalPending)}
            </p>
          </div>
        )}

        {/* Total Stats */}
        <div className="grid grid-cols-2 gap-4 border-t pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Total de Vendas</p>
            <p className="font-semibold">{finances.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-semibold">
              {totalPending > 0 ? (
                <span className="text-orange-600">Pendente</span>
              ) : (
                <span className="text-green-600">Em dia</span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
