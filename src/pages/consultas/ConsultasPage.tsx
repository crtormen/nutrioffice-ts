import React from "react";

import { ConsultasTable } from "@/components/Consultas/ConsultasTable";

const ConsultasPage = () => {
  // const navigate = useNavigate();

  return (
    <div className="flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Consultas</h2>
            {/* <Button
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-1.5 py-1 text-xs text-white"
              onClick={() => navigate("create")}
            >
              <Plus className="size-3" />
              Nova Consulta
            </Button> */}
          </div>
          <p className="text-muted-foreground">Lista de Consultas</p>
        </div>
      </div>
      <div className="container mx-auto py-10">
        <ConsultasTable />
      </div>
    </div>
  );
};

export default ConsultasPage;
