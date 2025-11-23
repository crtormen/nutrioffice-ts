import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import { useGetCustomerData } from "@/components/Customers/hooks";
import { ICustomer } from "@/domain/entities";
import CustomerAnamnesisTab from "@/pages/customers/CustomerAnamnesisTab";
import CustomerConsultasTab from "@/pages/customers/CustomerConsultasTab";
import CustomerFinancesTab from "@/pages/customers/CustomerFinancesTab";
import CustomerProfileTab from "@/pages/customers/CustomerProfileTab";
import CustomerResultsTab from "@/pages/customers/CustomerResultTab";
import CustomerSummaryTab from "@/pages/customers/CustomerSummaryTab";

import { ROUTES } from "@/app/router/routes";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CustomerDetailsPage: React.FC = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const customer: ICustomer | undefined = useGetCustomerData(customerId!);

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Clientes", href: `/${ROUTES.CUSTOMERS.BASE}` },
    { label: customer?.name || "Cliente" }
  ];

  // Determine active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/profile")) return "profile";
    if (path.includes("/anamnesis")) return "anamnesis";
    if (path.includes("/consultas")) return "consultas";
    if (path.includes("/finances")) return "finances";
    if (path.includes("/results")) return "results";
    return "summary";
  };

  const handleTabChange = (value: string) => {
    const baseUrl = `/${ROUTES.CUSTOMERS.BASE}/${customerId}`;
    if (value === "summary") {
      navigate(baseUrl);
    } else {
      navigate(`${baseUrl}/${value}`);
    }
  };

  return (
    customer && (
      <div className="space-y-6 p-6 md:p-10">
        <PageHeader
          breadcrumbs={breadcrumbs}
          backTo={`/${ROUTES.CUSTOMERS.BASE}`}
        />

        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
          <p className="text-muted-foreground">
            Cliente desde {customer.createdAt}
          </p>
        </div>

        <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0 h-auto">
            <TabsTrigger
              value="summary"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Resumo
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger
              value="anamnesis"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Anamnese
            </TabsTrigger>
            <TabsTrigger
              value="consultas"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Consultas
            </TabsTrigger>
            <TabsTrigger
              value="finances"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Financeiro
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Resultados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <CustomerSummaryTab />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <CustomerProfileTab />
          </TabsContent>

          <TabsContent value="anamnesis" className="mt-6">
            <CustomerAnamnesisTab />
          </TabsContent>

          <TabsContent value="consultas" className="mt-6">
            <CustomerConsultasTab />
          </TabsContent>

          <TabsContent value="finances" className="mt-6">
            <CustomerFinancesTab />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <CustomerResultsTab />
          </TabsContent>
        </Tabs>
      </div>
    )
  );
};

export default CustomerDetailsPage;
