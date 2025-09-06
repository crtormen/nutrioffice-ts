import React from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { IConsulta, type ICustomerConsulta } from "@/domain/entities";
import { SidebarNav } from "@/pages/_layouts/SidebarNav";
import { useGetCustomerConsultaData } from "@/components/Consultas/hooks/useGetCustomerConsultas";
import CustomerAnamnesisTab from "@/pages/customers/CustomerAnamnesisTab";
import CustomerConsultasTab from "@/pages/customers/CustomerConsultasTab";
import CustomerFinancesTab from "@/pages/customers/CustomerFinancesTab";
import CustomerProfileTab from "@/pages/customers/CustomerProfileTab";
import CustomerResultsTab from "@/pages/customers/CustomerResultTab";
import NewAnamnesisPage from "../anamnesis/NewAnamnesisPage";

const sidebarNavItems = [
  {
    title: "Dados da Consulta",
    link: "",
  },
  {
    title: "Metas e Resultados",
    link: "results",
  },
  {
    title: "Fotos",
    link: "pictures",
  },
];

const ConsultaDetailsPage: React.FC = () => {
  const { consultaId } = useParams();
  const consulta: ICustomerConsulta | undefined = useGetCustomerConsultaData(consultaId!);

  return (
    consulta && (
      <div className="hidden space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{consulta.name}</h2>
          <p className="text-muted-foreground">
            Cliente desde {consulta.createdAt}
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<ConsultaProfileTab />} />
              <Route path="results" element={<ConsultaAnamnesisTab />} />
              <Route path="pictures" element={<NewAnamnesisPage />} />
            </Routes>
          </div>
        </div>
      </div>
    )
  );
};

export default ConsultaDetailsPage;
