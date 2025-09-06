import { Route, Routes } from "react-router-dom";

import { useFetchUserQuery } from "@/app/state/features/userSlice";
// import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/infra/firebase";

import { SidebarNav } from "../_layouts/SidebarNav";
import CollaboratorsTab from "./CollaboratorsTab";
import PreferencesTab from "./PreferencesTab";
import UserProfileTab from "./UserProfileTab";

const sidebarNavItems = [
  {
    title: "Dados Pessoais",
    link: "",
  },
  {
    title: "Colaboradores",
    link: "collaborators",
  },
  {
    title: "Preferências",
    link: "preferences",
  },
];

const AccountPage = () => {
  const auth = useAuth();
  const { data: user } = useFetchUserQuery(auth.user?.uid);

  return (
    user && (
      <div className="hidden space-y-10 p-10 pb-16 md:block">
        <div className="space-y-5">
          <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
          <p className="text-muted-foreground"></p>
        </div>
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<UserProfileTab />} />
              <Route path="collaborators" element={<CollaboratorsTab />} />
              <Route path="preferences" element={<PreferencesTab />} />
            </Routes>
          </div>
        </div>
      </div>
    )
  );
};

export default AccountPage;
