import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gender, GENDERS } from "@/domain/entities";
import { calculateAge } from "@/lib/utils";

import { Separator } from "../ui/separator";
import { useConsultaContext } from "./context/ConsultaContext";

export const PersonalData = () => {
  const { customer } = useConsultaContext();

  return (
    customer && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <span className="text-2xl">{customer.name}</span>
            <Separator orientation="vertical" className="mx-4" />
            <span className="rounded-xl bg-secondary-foreground p-2 text-secondary">
              Protocolo Fit - Consulta 1/6
            </span>
          </CardTitle>
          <CardDescription>Criado em {customer.createdAt}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-start gap-10">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Sexo
              </span>
              <span className="text-md font-medium text-foreground">
                {customer.gender && GENDERS[customer.gender as Gender].text}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Idade
              </span>
              <span className="text-md font-medium text-foreground">
                {calculateAge(customer.birthday)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                # Consultas
              </span>
              <span className="text-md font-medium text-foreground">1</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Email
              </span>
              <span className="text-md font-medium text-foreground">
                {customer.email}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      // <div className="flex flex items-center space-x-10">
      //   <div className="flex flex-col gap-1">
      //     <span className="text-xs font-semibold text-muted-foreground">
      //       Cliente
      //     </span>
      //     <h2 className="text-2xl font-semibold">{customer.name}</h2>
      //     <span className="text-sm text-muted-foreground">
      //       Criado em {customer?.createdAt}
      //     </span>
      //   </div>
      //   <Separator orientation="vertical" className="text-primary" />
      //   <div className="flex justify-start gap-10">
      //     <div className="flex flex-col gap-1">
      //       <span className="text-sm font-medium text-muted-foreground">
      //         Sexo
      //       </span>
      //       <span className="text-md font-medium text-foreground">
      //         {customer.gender && GENDERS[customer.gender as Gender].text}
      //       </span>
      //     </div>
      //     <div className="flex flex-col gap-1">
      //       <span className="text-sm font-medium text-muted-foreground">
      //         Idade
      //       </span>
      //       <span className="text-md font-medium text-foreground">
      //         {calculateAge(customer.birthday)}
      //       </span>
      //     </div>
      //     <div className="flex flex-col gap-1">
      //       <span className="text-sm font-medium text-muted-foreground">
      //         # Consultas
      //       </span>
      //       <span className="text-md font-medium text-foreground">1</span>
      //     </div>
      //     <div className="flex flex-col gap-1">
      //       <span className="text-sm font-medium text-muted-foreground">
      //         Email
      //       </span>
      //       <span className="text-md font-medium text-foreground">
      //         {customer.email}
      //       </span>
      //     </div>
      //   </div>
      // </div>
    )
  );
};
