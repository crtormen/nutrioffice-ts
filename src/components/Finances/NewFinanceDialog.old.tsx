import { Info, Plus } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface NewFinanceDialogProps {
  customerId?: string;
  variant?: "default" | "outline";
  children?: React.ReactNode;
}

export const NewFinanceDialog = ({
  variant = "default",
  children,
}: NewFinanceDialogProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={variant}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Venda
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
          <DialogDescription>
            Registrar uma nova venda para o cliente
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="space-y-2">
                <p className="font-medium text-blue-900">
                  Funcionalidade em desenvolvimento
                </p>
                <p className="text-sm text-blue-800">
                  O sistema de vendas será implementado nas próximas fases do
                  projeto. Esta funcionalidade incluirá:
                </p>
                <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                  <li>Seleção de serviços configurados</li>
                  <li>Cálculo automático de valores</li>
                  <li>Gestão de créditos</li>
                  <li>Registro de pagamentos</li>
                  <li>Upload de comprovantes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
