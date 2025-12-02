import { useFillCustomerFinancesTable } from "@/components/Finances/hooks";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Loader2 } from "lucide-react";

export const CustomerFinancesTable = (customerId: string) => {
  const { finances, isLoading } = useFillCustomerFinancesTable(customerId);

  return isLoading ? (
    <Loader2 className="size-8 animate-spin text-zinc-500 items-center mx-auto" />
  ) : finances && finances?.length > 0 ? (
    <DataTable columns={columns} data={finances} />
  ) : (
    <div className="space-y-4">
      <div>
        <h4 className="text-md space-y-2 py-4 font-medium">
          Nenhuma venda cadastrada.
        </h4>
      </div>
    </div>
  )
};
