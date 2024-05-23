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
  createdAt: string | undefined;
  pacotes: string | undefined;
  pago: number | undefined;
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
    accessorKey: "pacotes",
    header: "Pacotes",
    cell: ({ row }) => {
      const finance = row.original;
      return (
        <div className="text-left font-medium">{row.getValue("pacotes")}</div>
      );
    },
  },
  {
    accessorKey: "pago",
    header: "Pago",
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
