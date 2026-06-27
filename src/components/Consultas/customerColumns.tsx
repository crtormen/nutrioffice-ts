import { EntityId } from "@reduxjs/toolkit";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useDeleteCustomerConsultaMutation } from "@/app/state/features/customerConsultasSlice";
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
import { useAuth } from "@/infra/firebase";

import { useToast } from "../ui/use-toast";

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
            to={ROUTES.CONSULTAS.DETAILS(
              consulta.customerId as string,
              consulta.id as string,
            )}
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
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [deleteConsulta, { isLoading: isDeleting }] =
        useDeleteCustomerConsultaMutation();
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
          await deleteConsulta({
            uid,
            customerId: consulta.customerId as string,
            consultaId: consulta.id as string,
          }).unwrap();

          toast({
            title: "Sucesso",
            description: "Consulta excluída com sucesso",
          });
        } catch {
          toast({
            title: "Erro",
            description: "Erro ao excluir consulta",
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
                <Link
                  to={ROUTES.CONSULTAS.DETAILS(
                    consulta.customerId as string,
                    consulta.id as string,
                  )}
                >
                  Ver Detalhes
                </Link>
              </DropdownMenuItem>
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
                  Tem certeza que deseja excluir esta consulta? Esta ação não
                  pode ser desfeita.
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
