import { useParams } from "react-router-dom";

import { CustomerFinancesTable } from "@/components/Finances/CustomerFinancesTable";

const CustomerFinancesTab = () => {
  const { customerId } = useParams();
  if (!customerId) return;

  return CustomerFinancesTable(customerId);
};

export default CustomerFinancesTab;
