import { EntityId } from "@reduxjs/toolkit";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Wifi, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { Badge } from "@/components/ui/badge";
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
  id: EntityId;
  customerId: EntityId;
  name: string;
  date: string | undefined;
  index: number;
  peso: string | undefined;
  online: boolean | undefined;
  createdAt: string | undefined;
};

export const columns: ColumnDef<ConsultaData>[] = [
  {
    accessorKey: "Consulta",
    header: "Consulta",
    cell: ({ row }) => {
      const consulta = row.original;
      return (
        <div className="text-left font-medium">
          <Link
            to={ROUTES.CONSULTAS.DETAILS(consulta.customerId as string, consulta.id as string)}
            className="hover:underline"
          >
            Consulta nº {consulta.index}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Cliente",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>;
    },
  },
  {
    accessorKey: "date",
    header: "Data",
  },
  {
    accessorKey: "peso",
    header: "Peso",
    cell: ({ row }) => {
      const peso = row.getValue("peso") as string | undefined;
      return peso ? `${peso} kg` : "-";
    },
  },
  {
    accessorKey: "online",
    header: "Tipo",
    cell: ({ row }) => {
      const online = row.getValue("online") as boolean | undefined;
      return online !== undefined ? (
        <Badge variant={online ? "default" : "secondary"} className="gap-1">
          {online ? (
            <>
              <Wifi className="h-3 w-3" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Presencial
            </>
          )}
        </Badge>
      ) : (
        "-"
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const consulta = row.original;

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
            <DropdownMenuItem asChild>
              <Link
                to={ROUTES.CONSULTAS.DETAILS(consulta.customerId as string, consulta.id as string)}
              >
                Ver Detalhes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
