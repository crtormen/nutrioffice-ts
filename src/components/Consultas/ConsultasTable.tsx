import { Loader2 } from "lucide-react";

import { useFillConsultasTable } from "@/components/Consultas/hooks";
import { DataTable } from "@/components/ui/data-table";

import { columns } from "./customerColumns";

export const ConsultasTable = () => {
  const { consultas, isLoading } = useFillConsultasTable();

  return isLoading ? (
    <Loader2 className="mx-auto size-8 animate-spin items-center text-zinc-500" />
  ) : consultas && consultas?.length > 0 ? (
    <DataTable columns={columns} data={consultas} />
  ) : (
    <div className="space-y-4">
      <div>
        <h4 className="text-md space-y-2 py-4 font-medium">
          Nenhuma consulta cadastrada.
        </h4>
      </div>
    </div>
  );
};
