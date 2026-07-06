import React from "react";
import { useParams } from "react-router-dom";

import { ConsultaTypeTabsContainer } from "@/components/Results/ConsultaTypeTabsContainer";

const CustomerResultsTab: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();

  if (!customerId) {
    return <div>Cliente não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <ConsultaTypeTabsContainer customerId={customerId} />
    </div>
  );
};

export default CustomerResultsTab;
