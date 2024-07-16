import { Gender, GENDERS } from "@/domain/entities";
import { calculateAge } from "@/lib/utils";

import { useGetCustomerData } from "../Customers/hooks";
import { Separator } from "../ui/separator";

export const PersonalData = ({ id }: { id?: string }) => {
  const customer = useGetCustomerData(id);

  return (
    customer && (
      <div className="flex flex items-center space-x-10">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground">
            Cliente
          </span>
          <h2 className="text-2xl font-semibold">{customer.name}</h2>
          <span className="text-sm text-muted-foreground">
            Criado em {customer?.createdAt}
          </span>
        </div>
        <Separator orientation="vertical" className="text-primary" />
        <div className="flex justify-start gap-10">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-muted-foreground">
              Sexo
            </span>
            <span className="text-md text-primary">
              {customer.gender && GENDERS[customer.gender as Gender].text}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-muted-foreground">
              Idade
            </span>
            <span className="text-md text-primary">
              {calculateAge(customer.birthday)}
            </span>
          </div>
        </div>
      </div>
    )
  );
};
