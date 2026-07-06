import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useFetchCustomersQuery } from "@/app/state/features/customersSlice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/infra/firebase/hooks";

export const ExpiringCreditsCard = () => {
  const { dbUid } = useAuth();
  const { data: customers, isLoading } = useFetchCustomersQuery(dbUid || "");

  const today = new Date();
  const threshold = addDays(today, 7);

  const expiring = (customers ?? []).filter((c) => {
    if (!c.creditExpiresAt || (c.timeCredits ?? 0) === 0) return false;
    const expiry = new Date(c.creditExpiresAt);
    return expiry <= threshold;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-amber-600" />
            Planos Expirando
          </CardTitle>
        </CardHeader>
        <CardContent>Carregando...</CardContent>
      </Card>
    );
  }

  if (expiring.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-green-600" />
            Planos Expirando
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum plano expirando nos próximos 7 dias.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-amber-600" />
          Planos Expirando ({expiring.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {expiring.map((customer) => {
            const expiry = new Date(customer.creditExpiresAt!);
            const daysLeft = Math.ceil(
              (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
            );
            return (
              <li key={customer.id} className="flex items-center justify-between gap-2">
                <Link
                  to={ROUTES.CUSTOMERS.DETAILS(customer.id!)}
                  className="text-sm font-medium hover:underline"
                >
                  {customer.name}
                </Link>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-xs text-muted-foreground">
                    {format(expiry, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <Badge variant={daysLeft <= 2 ? "destructive" : "outline"}>
                    {daysLeft <= 0 ? "Hoje" : `${daysLeft}d`}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};
