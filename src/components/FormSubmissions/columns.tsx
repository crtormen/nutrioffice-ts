import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Eye, MoreHorizontal, XCircle } from "lucide-react";

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
import { IFormSubmission } from "@/domain/entities/formSubmission";

interface ColumnsProps {
  onViewDetails: (submission: IFormSubmission) => void;
}

export const columns = ({
  onViewDetails,
}: ColumnsProps): ColumnDef<IFormSubmission>[] => [
  {
    accessorKey: "customerData.name",
    header: "Nome do Paciente",
    cell: ({ row }) => {
      const name = row.original.customerData.name;
      return <div className="font-medium">{name}</div>;
    },
  },
  {
    accessorKey: "customerData.email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.original.customerData.email;
      return <div className="text-sm text-muted-foreground">{email}</div>;
    },
  },
  {
    accessorKey: "customerData.phone",
    header: "Telefone",
    cell: ({ row }) => {
      const phone = row.original.customerData.phone;
      return <div className="text-sm">{phone}</div>;
    },
  },
  {
    accessorKey: "appointmentType",
    header: "Tipo de Consulta",
    cell: ({ row }) => {
      const type = row.original.appointmentType;
      return (
        <Badge variant={type === "online" ? "default" : "secondary"}>
          {type === "online" ? "Online" : "Presencial"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      const statusConfig = {
        pending: {
          label: "Pendente",
          variant: "outline" as const,
          className: "border-yellow-500 text-yellow-700",
        },
        approved: {
          label: "Aprovada",
          variant: "default" as const,
          className: "bg-green-600 hover:bg-green-700",
        },
        rejected: {
          label: "Rejeitada",
          variant: "destructive" as const,
          className: "",
        },
      };

      const config = statusConfig[status];

      return (
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Data de Envio",
    cell: ({ row }) => {
      const submittedAt = row.original.submittedAt;
      try {
        const date = new Date(submittedAt);
        return (
          <div className="text-sm text-muted-foreground">
            {format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        );
      } catch {
        return <div className="text-sm text-muted-foreground">-</div>;
      }
    },
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const submission = row.original;

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
            <DropdownMenuItem onClick={() => onViewDetails(submission)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            {submission.status === "pending" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onViewDetails(submission)}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onViewDetails(submission)}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeitar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
