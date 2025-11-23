import { EntityId } from "@reduxjs/toolkit";
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type FinanceData = {
  id: EntityId;
  createdAt: string;
  services: string;
  total: number;
  pago: number;
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
        <div className={`text-center font-medium px-2 py-1 rounded ${statusColors[status]}`}>
          {statusLabels[status]}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;

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
            <DropdownMenuItem>Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
