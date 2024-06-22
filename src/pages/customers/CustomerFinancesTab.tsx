import { useParams } from "react-router-dom";

import { CustomerFinancesTable } from "@/components/Finances/CustomerFinancesTable";

const CustomerFinancesTab = () => {
  const { id } = useParams();
  if (!id) return;

  return CustomerFinancesTable(id);
};

export default CustomerFinancesTab;
