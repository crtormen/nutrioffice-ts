import { EntityId } from "@reduxjs/toolkit";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type FinanceTableData = {
  id: EntityId;
  createdAt: string;
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
      const dateStr = row.getValue("createdAt") as string;
      try {
        const date = parseISO(dateStr);
        return (
          <div className="text-left font-medium">
            {format(date, "dd/MM/yyyy", { locale: ptBR })}
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
        <div className="text-left font-medium">{row.getValue("customerName")}</div>
      );
    },
  },
  {
    accessorKey: "services",
    header: "Serviços",
    cell: ({ row }) => {
      return (
        <div className="text-left">{row.getValue("services")}</div>
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
        partial: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950",
        paid: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950",
      };
      return (
        <div className={`inline-flex items-center font-medium px-2.5 py-0.5 rounded-full text-xs ${statusColors[status]}`}>
          {statusLabels[status]}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const finance = row.original;

      return (
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
            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
            <DropdownMenuItem>Adicionar Pagamento</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
