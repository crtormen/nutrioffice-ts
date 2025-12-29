import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useFetchCustomersQuery } from "@/app/state/features/customersSlice";
import { useFetchOverdueByCustomerQuery } from "@/app/state/features/paymentsSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/infra/firebase/hooks";
import { dateInString, priceFormatter } from "@/lib/utils";

export const OverduePaymentsCard = () => {
  const { dbUid } = useAuth();

  const { data: overdueByCustomer, isLoading } = useFetchOverdueByCustomerQuery(
    {
      uid: dbUid || "",
    },
  );

  const { data: customers } = useFetchCustomersQuery(dbUid || "");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Pagamentos em Atraso
          </CardTitle>
        </CardHeader>
        <CardContent>Carregando...</CardContent>
      </Card>
    );
  }

  if (!overdueByCustomer || overdueByCustomer.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-600" />
            Pagamentos em Atraso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum pagamento em atraso. Tudo em dia!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Create customer map for quick lookup
  const customerMap = new Map(customers?.map((c) => [c.id, c.name]) || []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Pagamentos em Atraso ({overdueByCustomer.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {overdueByCustomer.map(
            ({ customerId, totalOverdue, oldestDueDate, installmentCount }) => (
              <Link
                key={customerId}
                to={ROUTES.CUSTOMERS.DETAILS(customerId)}
                className="block rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {customerMap.get(customerId) || "Cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento mais antigo: {dateInString(oldestDueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">
                      {priceFormatter.format(totalOverdue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {installmentCount} parcela
                      {installmentCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ),
          )}
        </div>
      </CardContent>
    </Card>
  );
};
