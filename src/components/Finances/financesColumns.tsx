import { EntityId } from "@reduxjs/toolkit";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/router/routes";
import { AddPaymentDialog } from "./AddPaymentDialog";
import { useState } from "react";
import { useToast } from "../ui/use-toast";
import { useAuth } from "@/infra/firebase";
import { useDeleteFinanceMutation } from "@/app/state/features/customerFinancesSlice";

export type FinanceTableData = {
  id: EntityId;
  createdAt: string;
  customerId: string;
  customerName: string;
  services: string;
  total: number;
  pago: number;
  saldo: number;
  status: "pending" | "partial" | "paid";
};

export const financesColumns: ColumnDef<FinanceTableData>[] = [
  {
    accessorKey: "createdAt",
    header: "Data",
    cell: ({ row }) => {
      const finance = row.original;
      const dateStr = row.getValue("createdAt") as string;
      try {
        const date = parseISO(dateStr);
        return (
          <div className="text-left font-medium">
            <Link to={ROUTES.FINANCES.DETAILS(finance.id as string)}>
              {format(date, "dd/MM/yyyy", { locale: ptBR })}
            </Link>
          </div>
        );
      } catch {
        return <div className="text-left font-medium">{dateStr}</div>;
      }
    },
  },
  {
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row }) => {
      return (
        <div className="text-left font-medium">
          {row.getValue("customerName")}
        </div>
      );
    },
  },
  {
    accessorKey: "services",
    header: "Serviços",
    cell: ({ row }) => {
      return <div className="text-left">{row.getValue("services")}</div>;
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const total = row.getValue("total") as number;
      return (
        <div className="text-left font-medium">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(total)}
        </div>
      );
    },
  },
  {
    accessorKey: "pago",
    header: "Pago",
    cell: ({ row }) => {
      const pago = row.getValue("pago") as number;
      return (
        <div className="text-left font-medium">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(pago)}
        </div>
      );
    },
  },
  {
    accessorKey: "saldo",
    header: "Saldo",
    cell: ({ row }) => {
      const saldo = row.getValue("saldo") as number;
      return (
        <div className="text-left font-medium">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(saldo)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as "pending" | "partial" | "paid";
      const statusLabels = {
        pending: "Pendente",
        partial: "Parcial",
        paid: "Pago",
      };
      const statusColors = {
        pending: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
        partial:
          "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950",
        paid: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950",
      };
      return (
        <div
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}
        >
          {statusLabels[status]}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const finance = row.original;
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [deleteFinance, { isLoading: isDeleting }] =
        useDeleteFinanceMutation();
      const { toast } = useToast();
      const auth = useAuth();
      const uid = auth.dbUid;

            const handleDelete = async () => {
        if (!uid) {
          toast({
            title: "Erro",
            description: "Usuário não autenticado",
            variant: "destructive",
          });
          return;
        }

        try {
          await deleteFinance({
            uid,
            customerId: finance.customerId,
            financeId: finance.id as string,
          }).unwrap();

          toast({
            title: "Sucesso",
            description: "Venda excluída com sucesso",
          });
        } catch (error) {
          toast({
            title: "Erro",
            description: "Erro ao excluir venda",
            variant: "destructive",
          });
        } finally {
          setShowDeleteDialog(false);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={ROUTES.FINANCES.DETAILS(finance.id as string)}>
                  Ver Detalhes
                </Link>
              </DropdownMenuItem>
              {finance.status !== "paid" && (
                <AddPaymentDialog
                  financeId={finance.id as string}
                  customerId={finance.customerId}
                  remainingBalance={finance.saldo}
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                      }}
                    >
                      Adicionar Pagamento
                    </DropdownMenuItem>
                  }
                />
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                  className="text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowDeleteDialog(true);
                  }}
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta venda? Esta ação também
                    irá:
                    <ul className="mt-2 list-inside list-disc">
                      <li>Excluir todos os pagamentos relacionados</li>
                      <li>Excluir todas as parcelas relacionadas</li>
                      <li>Remover créditos concedidos (se houver)</li>
                    </ul>
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Excluindo..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
      );
    },
  },
];
