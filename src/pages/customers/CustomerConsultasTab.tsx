import { useParams } from "react-router-dom";

import { CustomerConsultasTable } from "@/components/Consultas/CustomerConsultasTable";

const CustomerConsultasTab = () => {
  const { id } = useParams();
  if (!id) return;

  return CustomerConsultasTable(id);
};

export default CustomerConsultasTab;
