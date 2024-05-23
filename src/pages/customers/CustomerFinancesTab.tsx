import { CustomerFinancesTable } from "@/components/Finances/CustomerFinancesTable";
import React from "react";
import { useParams } from "react-router-dom";

const CustomerFinancesTab = () => {
  const { id } = useParams();
  if (!id) return;

  return CustomerFinancesTable(id);
};

export default CustomerFinancesTab;
