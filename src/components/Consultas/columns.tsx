import { EntityId } from "@reduxjs/toolkit";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ConsultaData = {
  customerId: EntityId;
  name: string;
  id: EntityId;
  date: string | undefined;
  index: number;
};

export const columns: ColumnDef<ConsultaData>[] = [
  {
    accessorKey: "Consulta",
    cell: ({ row }) => {
      const consulta = row.original;
      return (
        <div className="text-left font-medium">
          <Link to={`/consultas/details/${consulta.id}`}>
            Consulta nº {consulta.index}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Data",
  },
  {
    id: "actions",
    cell: () => {
      // const consulta = row.original;

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
