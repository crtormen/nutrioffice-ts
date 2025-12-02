import { Plus, Users } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import CustomersTable from "@/components/Customers/CustomersTable";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { ROUTES } from "@/app/router/routes";

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Clientes" },
  ];

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader breadcrumbs={breadcrumbs} showBackButton={false} />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          </div>
          <p className="text-muted-foreground">
            Gerencie seus clientes e acompanhe seu histórico
          </p>
        </div>
        <Button onClick={() => navigate("create")} size="default">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <CustomersTable />
    </div>
  );
};

export default CustomersPage;
