import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useGetCustomerData } from "@/components/Customers/hooks";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ICustomer } from "@/domain/entities";
import CustomerAnamnesisTab from "@/pages/customers/CustomerAnamnesisTab";
import CustomerConsultasTab from "@/pages/customers/CustomerConsultasTab";
import CustomerFinancesTab from "@/pages/customers/CustomerFinancesTab";
import CustomerProfileTab from "@/pages/customers/CustomerProfileTab";
import CustomerResultsTab from "@/pages/customers/CustomerResultTab";
import CustomerSummaryTab from "@/pages/customers/CustomerSummaryTab";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFetchCustomersQuery } from "@/app/state/features/customersSlice";
import { useAuth } from "@/infra/firebase";

const CustomerDetailsPage: React.FC = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { dbUid } = useAuth();

  // Fetch customers with loading state
  const { isLoading } = useFetchCustomersQuery(dbUid || "", {
    skip: !dbUid,
  });

  const customer: ICustomer | undefined = useGetCustomerData(customerId!);

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Clientes", href: `/${ROUTES.CUSTOMERS.BASE}` },
    { label: customer?.name || "Cliente" },
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

  // Show loading state while fetching OR when customer is not yet in cache
  if (isLoading || (!customer && dbUid)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state only if customer not found AND not loading AND we have dbUid
  if (!customer && !isLoading && dbUid) {
    return (
      <div className="space-y-6 p-6 md:p-10">
        <PageHeader
          breadcrumbs={breadcrumbs}
          backTo={`/${ROUTES.CUSTOMERS.BASE}`}
        />
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
          <p className="text-muted-foreground">
            O cliente que você está procurando não existe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader
        breadcrumbs={breadcrumbs}
        backTo={`/${ROUTES.CUSTOMERS.BASE}`}
      />

      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">{customer?.name}</h2>
        <p className="text-muted-foreground">
          Cliente desde {customer?.createdAt}
        </p>
      </div>

      <Tabs
        value={getActiveTab()}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
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
  );
};

export default CustomerDetailsPage;
