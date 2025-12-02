import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Calendar } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { useGetCustomerConsultaData } from "@/components/Consultas/hooks/useGetCustomerConsultas";
import { useGetCustomerData } from "@/components/Customers/hooks";
import { ROUTES } from "@/app/router/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConsultaProfileTab from "./tabs/ConsultaProfileTab";
import ConsultaResultsTab from "./tabs/ConsultaResultsTab";
import ConsultaPhotosTab from "./tabs/ConsultaPhotosTab";
import { EditConsultaDialog } from "@/components/Consultas/EditConsultaDialog";

const ConsultaDetailsPage: React.FC = () => {
  const { customerId, consultaId } = useParams<{ customerId: string; consultaId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch consulta data with both parameters
  const consulta = useGetCustomerConsultaData(customerId, consultaId);

  // Fetch customer data for breadcrumb
  const customer = useGetCustomerData(customerId);

  // Format consultation date safely
  const formatConsultaDate = (dateString?: string) => {
    if (!dateString) return "Data não informada";
    let date;
    try {
      date = parse(dateString, "dd/MM/yyyy", new Date());
    } catch {
      date = undefined;
    }
    return date && !isNaN(date.getTime()) ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""
  };

  const consultaDate = formatConsultaDate(consulta?.date);

  // Determine active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/results")) return "results";
    if (path.includes("/pictures")) return "pictures";
    return "profile";
  };

  const handleTabChange = (value: string) => {
    const baseUrl = `/${ROUTES.CUSTOMERS.BASE}/${customerId}/${ROUTES.CONSULTAS.BASE}/${consultaId}`;
    if (value === "profile") {
      navigate(baseUrl);
    } else {
      navigate(`${baseUrl}/${value}`);
    }
  };

  // Loading state
  if (!consulta) {
    return (
      <div className="space-y-6 p-6 md:p-10">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4 mt-8">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Clientes", href: `/${ROUTES.CUSTOMERS.BASE}` },
    { label: customer?.name || "Cliente", href: `/${ROUTES.CUSTOMERS.DETAILS(customerId!)}` },
    { label: `Consulta ${consultaDate}` },
  ];

  return (
    <div className="space-y-6 p-6 md:p-10">
      <PageHeader
        breadcrumbs={breadcrumbs}
        backTo={`/${ROUTES.CUSTOMERS.DETAILS(customerId!)}`}
      />

      {/* Page subtitle with date and edit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <p>Consulta realizada em {consultaDate}</p>
        </div>
        <EditConsultaDialog consulta={consulta} />
      </div>

      {/* Horizontal tabs navigation and content */}
      <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Dados da Consulta
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Metas e Resultados
          </TabsTrigger>
          <TabsTrigger
            value="pictures"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Fotos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ConsultaProfileTab />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <ConsultaResultsTab />
        </TabsContent>

        <TabsContent value="pictures" className="mt-6">
          <ConsultaPhotosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultaDetailsPage;
