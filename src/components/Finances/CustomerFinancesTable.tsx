import { Loader2 } from "lucide-react";

import { useFillCustomerFinancesTable } from "@/components/Finances/hooks";
import { DataTable } from "@/components/ui/data-table";

import { columns } from "./columns";

interface CustomerFinancesTableProps {
  customerId: string;
}

export const CustomerFinancesTable = ({
  customerId,
}: CustomerFinancesTableProps) => {
  const { finances, isLoading } = useFillCustomerFinancesTable(customerId);

  // Show loading spinner during initial load only
  // Real-time listener will update the table automatically when data changes
  if (isLoading) {
    return (
      <Loader2 className="mx-auto size-8 animate-spin items-center text-zinc-500" />
    );
  }

  // Show table if we have data
  if (finances && finances.length > 0) {
    return <DataTable columns={columns} data={finances} />;
  }

  // Show empty state only when not loading and no data
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-md space-y-2 py-4 font-medium">
          Nenhuma venda cadastrada.
        </h4>
      </div>
    </div>
  );
};
