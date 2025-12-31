import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import { useFetchSettingsQuery } from "@/app/state/features/settingsSlice";
// import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/infra/firebase";

import { SidebarNav } from "../_layouts/SidebarNav";
import AnamnesisSettingsTab from "./AnamnesisSettingsTab";
import AvaliationSettingsTab from "./AvaliationSettingsTab";
import PublicFormsSettingsTab from "./PublicFormsSettingsTab";
import ServicesSettingsTab from "./ServicesSettingsTab";
import { SystemTab } from "./SystemTab";
import ThemeSettingsTab from "./ThemeSettingsTab";

const sidebarNavItems = [
  {
    title: "Serviços",
    link: "",
  },
  {
    title: "Anamnese",
    link: "anamnesis",
  },
  {
    title: "Avaliação",
    link: "avaliation",
  },
  {
    title: "Formulários Públicos",
    link: "public-forms",
  },
  {
    title: "Aparência",
    link: "theme",
  },
  {
    title: "Sistema",
    link: "system",
  },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const { data: settings, refetch } = useFetchSettingsQuery(user?.uid);

  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0) {
      refetch();
    }
  }, [refetch, user, settings]);

  return (
    settings && (
      <div className="hidden space-y-10 p-10 pb-16 md:block">
        <div className="space-y-5">
          <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground"></p>
        </div>
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<ServicesSettingsTab />} />
              <Route path="anamnesis" element={<AnamnesisSettingsTab />} />
              <Route path="avaliation" element={<AvaliationSettingsTab />} />
              <Route path="public-forms" element={<PublicFormsSettingsTab />} />
              <Route path="theme" element={<ThemeSettingsTab />} />
              <Route path="system" element={<SystemTab />} />
            </Routes>
          </div>
        </div>
      </div>
    )
  );
};

export default SettingsPage;
