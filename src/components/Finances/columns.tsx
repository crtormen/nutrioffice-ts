import { EntityId } from "@reduxjs/toolkit";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useDeleteFinanceMutation } from "@/app/state/features/customerFinancesSlice";
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
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/infra/firebase/hooks";

import { AddPaymentDialog } from "./AddPaymentDialog";

export type FinanceData = {
  id: EntityId;
  customerId: string;
  createdAt: string;
  services: string;
  total: number;
  pago: number;
  saldo: number;
  status: "pending" | "partial" | "paid";
};

export const columns: ColumnDef<FinanceData>[] = [
  {
    accessorKey: "createdAt",
    header: "Data da Compra",
    cell: ({ row }) => {
      const finance = row.original;
      return (
        <div className="text-left font-medium">
          <Link to={`/finances/details/${finance.id}`}>
            {row.getValue("createdAt")}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "services",
    header: "Serviços",
    cell: ({ row }) => {
      return (
        <div className="text-left font-medium">{row.getValue("services")}</div>
      );
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
        pending: "text-red-600 bg-red-50",
        partial: "text-yellow-600 bg-yellow-50",
        paid: "text-green-600 bg-green-50",
      };
      return (
        <div
          className={`rounded px-2 py-1 text-center font-medium ${statusColors[status]}`}
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
