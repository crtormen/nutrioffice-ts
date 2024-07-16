/* eslint-disable prettier/prettier */

import { useParams } from "react-router-dom";

import { useGetAnamnesisData } from "@/components/Anamnesis/hooks";
import { PersonalData } from "@/components/Consultas/PersonalData";

import { SidebarNav } from "../_layouts/SidebarNav";

/* eslint-disable spaced-comment */
const sidebarNavItems = [
  {
    title: "Anamnese",
    link: "",
  },
  {
    title: "Metas",
    link: "",
  },
  {
    title: "Evolução",
    link: "",
  },
  {
    title: "Protocolo",
    link: "",
  },
];

const NewConsultaPage = () => {
  const { customerId } = useParams();
  const anamnesis = useGetAnamnesisData(customerId);

  return (
    <div className="hidden space-y-10 p-10 pb-16 md:block">
      <PersonalData id={customerId} />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Nova Consulta</h2>
          <p className="text-muted-foreground">Protocolo Fit - Consulta 1/6</p>
        </div>
      </div>
    </div>
  );

  //load last anamnesis
  //load goals
  //load previous consultas
  //load user data
  //load protocols

  //sidenav
  // Anamnesis
  // Goals
  // Previous Consultas
  // Protocols

  //Header
  //show name, date of creation, contact info, objetivos from anamnesis

  //body
  // Step 1
  //If 1st appointment => Feeding History
  // else Evolution Form

  // Step 2
  //Physical Avaliation

  //Step 3
  //Prescriptions

  //Step 4
  // notes

  // Step 5
  //attachments

  // Step 6
  //Schedule next appointment
};

export default NewConsultaPage;
