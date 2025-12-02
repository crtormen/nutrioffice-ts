import { Plus, DollarSign } from "lucide-react";
import { useParams } from "react-router-dom";

import { CustomerFinancesTable } from "@/components/Finances/CustomerFinancesTable";
import { NewFinanceDialog } from "@/components/Finances/NewFinanceDialog";
import { Separator } from "@/components/ui/separator";

const CustomerFinancesTab = () => {
  const { customerId } = useParams();

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
          <h3 className="text-2xl font-bold tracking-tight">Financeiro</h3>
          <p className="text-sm text-muted-foreground">
            Histórico de vendas e pagamentos
          </p>
        </div>
        <NewFinanceDialog customerId={customerId}>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
            <Plus className="mr-2 h-4 w-4" />
            Nova Venda
          </button>
        </NewFinanceDialog>
      </div>

      <Separator />

      {/* Finances Table */}
      <div className="space-y-4">
        {CustomerFinancesTable(customerId)}
      </div>
    </div>
  );
};

export default CustomerFinancesTab;
