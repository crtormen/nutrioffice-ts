import { UserCheck } from "lucide-react";

import { ILead } from "@/domain/entities";
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

import { useLeadConversion } from "./hooks/useLeadConversion";

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: ILead;
}

export function ConvertLeadDialog({ open, onOpenChange, lead }: ConvertLeadDialogProps) {
  const { convertLead, isLoading, error } = useLeadConversion();

  async function handleConfirm() {
    if (!lead.id) return;
    const success = await convertLead(lead.id);
    if (success) onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-500" />
            Converter em Cliente
          </AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{lead.name}</strong> será registrado como cliente no sistema.
            O lead permanecerá no funil na etapa "Convertido".
            {lead.phone && (
              <span className="block mt-1 text-xs">Telefone: {lead.phone}</span>
            )}
            {lead.email && (
              <span className="block text-xs">E-mail: {lead.email}</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-sm text-destructive px-1">{error}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? "Convertendo..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
