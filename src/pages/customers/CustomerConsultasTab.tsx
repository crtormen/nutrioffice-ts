import { Plus } from "lucide-react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { CustomerConsultasTable } from "@/components/Consultas/CustomerConsultasTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const CustomerConsultasTab = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  if (!customerId) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-muted-foreground">Cliente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">Consultas</h3>
          <p className="text-sm text-muted-foreground">
            Histórico de atendimentos e avaliações
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate(ROUTES.CONSULTAS.CREATE(customerId))}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Consulta
        </Button>
      </div>

      <Separator />

      {/* Consultas Table */}
      <div className="space-y-4">
        <CustomerConsultasTable />
      </div>
    </div>
  );
};

export default CustomerConsultasTab;
