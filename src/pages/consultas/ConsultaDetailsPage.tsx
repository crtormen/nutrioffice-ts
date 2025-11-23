import React from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { Calendar } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarNav } from "@/pages/_layouts/SidebarNav";
import { PageHeader } from "@/components/PageHeader";
import { useGetCustomerConsultaData } from "@/components/Consultas/hooks/useGetCustomerConsultas";
import { useGetCustomerData } from "@/components/Customers/hooks";
import { useAuth } from "@/infra/firebase/hooks";
import { ROUTES } from "@/app/router/routes";
import ConsultaProfileTab from "./tabs/ConsultaProfileTab";
import ConsultaResultsTab from "./tabs/ConsultaResultsTab";
import ConsultaPhotosTab from "./tabs/ConsultaPhotosTab";

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
  const { customerId, consultaId } = useParams<{ customerId: string; consultaId: string }>();
  const { dbUid } = useAuth();

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

  // Loading state
  if (!consulta) {
    return (
      <div className="hidden space-y-6 p-10 pb-16 md:block">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Separator className="my-6" />
        <div className="flex gap-12">
          <Skeleton className="h-96 w-48" />
          <Skeleton className="h-96 flex-1" />
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
  // Future: AI suggestions (e.g., "Weight trend suggests goal achievable by [date]")
  return (
    <div className="hidden space-y-6 p-10 pb-16 md:block">
      <PageHeader
        breadcrumbs={breadcrumbs}
        backTo={`/${ROUTES.CUSTOMERS.DETAILS(customerId!)}`}
      />

      {/* Page subtitle with date */}
      <div className="flex items-center gap-2 text-muted-foreground -mt-4 mb-6">
        <Calendar className="h-4 w-4" />
        <p>Consulta realizada em {consultaDate}</p>
      </div>

      <Separator className="my-6" />

      {/* Tab navigation and content */}
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<ConsultaProfileTab />} />
            <Route path="results" element={<ConsultaResultsTab />} />
            <Route path="pictures" element={<ConsultaPhotosTab />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ConsultaDetailsPage;
