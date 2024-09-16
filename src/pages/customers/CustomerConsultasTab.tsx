import { Plus } from "lucide-react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { CustomerConsultasTable } from "@/components/Consultas/CustomerConsultasTable";
import { Button } from "@/components/ui/button";

const CustomerConsultasTab = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  if (!customerId) return;

  return (
    <div className="space-y-6">
      <div className="flex w-full justify-between">
        <h3 className="text-xl font-medium">Consultas</h3>
        <div className="flex gap-1">
          {/* TODO */}
          <Button
            variant="outline"
            onClick={() => navigate(`/consultas/${customerId}/create`)}
          >
            <Plus size="16" /> Nova Consulta
          </Button>
        </div>
      </div>
      <div className="mt-6 border-t border-gray-200 px-4 py-3 sm:p-0">
        <CustomerConsultasTable />
      </div>
    </div>
  );
};

export default CustomerConsultasTab;
