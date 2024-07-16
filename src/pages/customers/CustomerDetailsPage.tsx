import React from "react";
import { Route, Routes, useParams } from "react-router-dom";

import { useGetCustomerData } from "@/components/Customers/hooks";
import { Separator } from "@/components/ui/separator";
import { ICustomer } from "@/domain/entities";
import { SidebarNav } from "@/pages/_layouts/SidebarNav";
import CustomerAnamnesisTab from "@/pages/customers/CustomerAnamnesisTab";
import CustomerConsultasTab from "@/pages/customers/CustomerConsultasTab";
import CustomerFinancesTab from "@/pages/customers/CustomerFinancesTab";
import CustomerProfileTab from "@/pages/customers/CustomerProfileTab";
import CustomerResultsTab from "@/pages/customers/CustomerResultTab";

import NewAnamnesisPage from "../anamnesis/NewAnamnesisPage";

const sidebarNavItems = [
  {
    title: "Dados Pessoais",
    link: "",
  },
  {
    title: "Anamnese",
    link: "anamnesis",
  },
  {
    title: "Consultas",
    link: "consultas",
  },
  {
    title: "Financeiro",
    link: "finances",
  },
  {
    title: "Resultados",
    link: "results",
  },
];

const CustomerDetailsPage: React.FC = () => {
  const { id } = useParams();
  const customer: ICustomer | undefined = useGetCustomerData(id!);

  return (
    customer && (
      <div className="hidden space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
          <p className="text-muted-foreground">
            Cliente desde {customer.createdAt}
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<CustomerProfileTab />} />
              <Route path="anamnesis" element={<CustomerAnamnesisTab />} />
              <Route path="create-anamnesis" element={<NewAnamnesisPage />} />
              <Route path="consultas" element={<CustomerConsultasTab />} />
              <Route path="finances" element={<CustomerFinancesTab />} />
              <Route path="results" element={<CustomerResultsTab />} />
            </Routes>
          </div>
        </div>
      </div>
    )
  );
};

export default CustomerDetailsPage;
