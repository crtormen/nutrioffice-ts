import { useParams } from "react-router-dom";

import { CustomerFinancesTable } from "@/components/Finances/CustomerFinancesTable";
import { NewFinanceDialog } from "@/components/Finances/NewFinanceDialog";

const CustomerFinancesTab = () => {
  const { customerId } = useParams();
  if (!customerId) return;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewFinanceDialog customerId={customerId} />
      </div>
      {CustomerFinancesTable(customerId)}
    </div>
  );
};

export default CustomerFinancesTab;
