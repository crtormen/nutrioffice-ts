import { Lock, Plus, Users } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useFetchCustomersQuery } from "@/app/state/features/customersSlice";
import {
  useCanAddCustomerQuery,
  useFetchSubscriptionQuery,
} from "@/app/state/features/subscriptionSlice";
import { useFetchUserQuery } from "@/app/state/features/userSlice";
import CustomersTable from "@/components/Customers/CustomersTable";
import { PageHeader } from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLAN_CONFIGS } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { dbUid } = useAuth();
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  // Fetch current customers, subscription, and user data
  const { data: customers = [] } = useFetchCustomersQuery(dbUid || "", {
    skip: !dbUid,
  });
  const { data: subscription } = useFetchSubscriptionQuery(dbUid || "", {
    skip: !dbUid,
  });
  const { data: user } = useFetchUserQuery(dbUid || "", {
    skip: !dbUid,
  });

  // Check if user can add more customers (includes permanentFree check)
  const currentCount = customers.length;
  const { data: canAddCustomer = true } = useCanAddCustomerQuery(
    { uid: dbUid || "", currentCount },
    { skip: !dbUid },
  );

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Clientes" },
  ];

  // Calculate limits for display purposes
  const isPermanentFree = user?.permanentFree === true;
  const planTier = subscription?.planTier || "free";
  const planConfig = PLAN_CONFIGS[planTier];
  const customerLimit = isPermanentFree ? Infinity : planConfig.maxCustomers;
  const isNearLimit =
    !isPermanentFree && currentCount >= customerLimit * 0.8 && canAddCustomer; // 80% of limit

  const handleAddCustomer = () => {
    if (!canAddCustomer) {
      setShowLimitDialog(true);
    } else {
      navigate("create");
    }
  };

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader breadcrumbs={breadcrumbs} showBackButton={false} />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
              <p className="text-sm text-muted-foreground">
                {currentCount} /{" "}
                {isPermanentFree || customerLimit === Infinity
                  ? "∞"
                  : customerLimit}{" "}
                clientes
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Gerencie seus clientes e acompanhe seu histórico
          </p>
        </div>
        <Button
          onClick={handleAddCustomer}
          size="default"
          variant={canAddCustomer ? "default" : "outline"}
          disabled={!canAddCustomer}
        >
          {canAddCustomer ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Limite Atingido
            </>
          )}
        </Button>
      </div>

      {/* Warning when near limit */}
      {isNearLimit && canAddCustomer && (
        <Alert>
          <AlertTitle>Você está próximo do limite</AlertTitle>
          <AlertDescription>
            Você usou {currentCount} de {customerLimit} clientes disponíveis no
            plano {planConfig.name}. Considere fazer upgrade para continuar
            crescendo.
            <Button
              variant="link"
              className="px-2"
              onClick={() => navigate(ROUTES.SUBSCRIPTION.PRICING)}
            >
              Ver planos
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <CustomersTable />

      {/* Limit reached dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limite de Clientes Atingido</DialogTitle>
            <DialogDescription>
              Você atingiu o limite de {customerLimit} clientes do plano{" "}
              {planConfig.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertTitle>Upgrade Necessário</AlertTitle>
              <AlertDescription>
                Para adicionar mais clientes, você precisa fazer upgrade para um
                plano superior.
              </AlertDescription>
            </Alert>

            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Planos disponíveis:</p>
              <ul className="list-inside list-disc space-y-1">
                {planTier === "free" && (
                  <>
                    <li>Plano Iniciante: até 200 clientes por R$ 79/mês</li>
                    <li>Plano Profissional: até 500 clientes por R$ 149/mês</li>
                    <li>
                      Plano Corporativo: clientes ilimitados por R$ 299/mês
                    </li>
                  </>
                )}
                {planTier === "starter" && (
                  <>
                    <li>Plano Profissional: até 500 clientes por R$ 149/mês</li>
                    <li>
                      Plano Corporativo: clientes ilimitados por R$ 299/mês
                    </li>
                  </>
                )}
                {planTier === "professional" && (
                  <li>Plano Corporativo: clientes ilimitados por R$ 299/mês</li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => navigate(ROUTES.SUBSCRIPTION.PRICING)}>
              Ver Planos e Fazer Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;
