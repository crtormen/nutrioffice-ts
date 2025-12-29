import { ArrowLeft, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { CustomersService } from "@/app/services/CustomersService";
import { FinancesService } from "@/app/services/FinancesService";
import { AddPaymentDialog } from "@/components/Finances/AddPaymentDialog";
import { PaymentHistoryCard } from "@/components/Finances/PaymentHistoryCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ICustomer } from "@/domain/entities";
import { IFinance } from "@/domain/entities/finances";
import { useAuth } from "@/infra/firebase/hooks";

const FinanceDetailsPage = () => {
  const { financeId } = useParams<{ financeId: string }>();
  const { dbUid } = useAuth();
  const navigate = useNavigate();

  const [finance, setFinance] = useState<IFinance | null>(null);
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbUid || !financeId) return;

    const loadFinanceData = async () => {
      try {
        setLoading(true);

        // Try loading from global finances collection first
        const querySnapshot = await FinancesService(dbUid)?.getAllOnce();
        const financeDoc = querySnapshot
          ? Array.from(querySnapshot.docs).find((doc) => doc.id === financeId)
          : undefined;

        // If not found in global collection, this is an old finance record
        // We need to get it from the finances table and extract customerId from there
        if (!financeDoc) {
          navigate(`/${ROUTES.FINANCES.BASE}`);
          return;
        }

        const rawData = financeDoc.data() as IFinance;

        // Calculate missing fields if they don't exist (for backwards compatibility)
        // Calculate subtotal from items if missing
        let subtotal = rawData.subtotal;
        if (
          subtotal === undefined &&
          rawData.items &&
          rawData.items.length > 0
        ) {
          subtotal = rawData.items.reduce(
            (sum, item) => sum + item.totalPrice,
            0,
          );
        }
        // If still no subtotal and we have a total, use total + discount
        if (subtotal === undefined && rawData.total !== undefined) {
          subtotal = rawData.total + (rawData.discount ?? 0);
        }
        // Last resort: use 0
        if (subtotal === undefined) {
          subtotal = 0;
        }

        const total = rawData.total ?? subtotal - (rawData.discount ?? 0);
        const pago = rawData.pago ?? 0;
        const saldo = rawData.saldo ?? total - pago;
        const status =
          rawData.status ??
          (saldo <= 0 ? "paid" : pago > 0 ? "partial" : "pending");

        const financeData: IFinance = {
          ...rawData,
          subtotal,
          total,
          pago,
          saldo,
          status,
          discount: rawData.discount ?? 0,
          creditsGranted: rawData.creditsGranted ?? 0,
        };

        setFinance(financeData);

        // Load customer data if customerId exists
        if (financeData.customerId) {
          const customersSnapshot = await CustomersService(dbUid)?.getAllOnce();
          if (customersSnapshot) {
            const customerDoc = Array.from(customersSnapshot.docs).find(
              (doc) => doc.id === financeData.customerId,
            );
            if (customerDoc) {
              setCustomer(customerDoc.data() as ICustomer);
            }
          }
        }
        // Note: Old finance records may not have customerId field (they were in nested collections)
      } catch (error) {
        console.error("Error loading finance details:", error);
        navigate(`/${ROUTES.FINANCES.BASE}`);
      } finally {
        setLoading(false);
      }
    };

    loadFinanceData();
  }, [dbUid, financeId, navigate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const statusColors = {
    pending: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
    partial:
      "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
    paid: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  };

  const statusLabels = {
    pending: "Pendente",
    partial: "Parcial",
    paid: "Pago",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!finance) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Venda não encontrada</p>
          <Button onClick={() => navigate(`/${ROUTES.FINANCES.BASE}`)}>
            Voltar para Finanças
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/${ROUTES.FINANCES.BASE}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes da Venda</h1>
            <p className="text-muted-foreground">
              Venda realizada em {formatDate(finance.createdAt)}
            </p>
          </div>
        </div>
        {finance.status !== "paid" && (
          <AddPaymentDialog
            financeId={financeId!}
            customerId={finance.customerId}
            remainingBalance={finance.saldo}
          />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {customer ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <Link
                    to={ROUTES.CUSTOMERS.DETAILS(customer.id!)}
                    className="font-medium hover:underline"
                  >
                    {customer.name}
                  </Link>
                </div>
                {customer.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  Informações do cliente não disponíveis para este registro
                  antigo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(finance.subtotal)}
              </span>
            </div>
            {finance.discount && finance.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto:</span>
                <span className="font-medium text-red-600">
                  - {formatCurrency(finance.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(finance.total)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Pago:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(finance.pago)}
              </span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Saldo:</span>
              <span className="font-medium text-red-600">
                {formatCurrency(finance.saldo)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground">Status:</span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[finance.status]}`}
              >
                {statusLabels[finance.status]}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services/Items */}
      {finance.items && finance.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
            <CardDescription>Serviços incluídos nesta venda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {finance.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.serviceName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.unitPrice)} x {item.quantity}
                      {item.credits > 0 && ` • ${item.credits} crédito(s)`}
                    </p>
                  </div>
                  <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credits Granted */}
      {finance.creditsGranted > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Créditos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Esta venda concedeu{" "}
              <span className="font-bold text-primary">
                {finance.creditsGranted} crédito
                {finance.creditsGranted > 1 ? "s" : ""}
              </span>{" "}
              ao cliente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Observations */}
      {finance.obs && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{finance.obs}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <PaymentHistoryCard financeId={financeId!} />
    </div>
  );
};

export default FinanceDetailsPage;
