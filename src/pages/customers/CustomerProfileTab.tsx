import { Edit } from "lucide-react";
import React from "react";
import { useParams } from "react-router-dom";

import { EditCustomerDialog } from "@/components/Customers/EditCustomerDialog";
import { useGetCustomerData } from "@/components/Customers/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Gender, GENDERS, ICustomer } from "@/domain/entities";

const CustomerProfileTab: React.FC = () => {
  const { customerId } = useParams();
  const customer: ICustomer | undefined = useGetCustomerData(customerId);

  if (!customer) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">Dados Pessoais</h3>
          <p className="text-sm text-muted-foreground">
            Informações cadastrais do cliente
          </p>
        </div>
        <EditCustomerDialog customer={customer}>
          <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </button>
        </EditCustomerDialog>
      </div>

      <Separator />

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Dados cadastrais e contato</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                Nome
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {customer.name || "-"}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                Sexo
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {customer.gender
                  ? GENDERS[customer.gender as Gender].text
                  : "-"}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                E-mail
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {customer.email || "-"}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                Telefone
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {customer.phone || "-"}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                Data de Nascimento
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {customer.birthday || "-"}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                CPF
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {customer.cpf || "-"}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                Profissão
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {customer.occupation || "-"}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                Instagram
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {customer.instagram || "-"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Address */}
      {customer.address && (
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>Localização residencial</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-xs font-medium uppercase text-muted-foreground">
                  Rua
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {customer.address.street || "-"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-medium uppercase text-muted-foreground">
                  Bairro
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {customer.address.district || "-"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-medium uppercase text-muted-foreground">
                  Cidade
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {customer.address.city || "-"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-medium uppercase text-muted-foreground">
                  CEP
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {customer.address.cep || "-"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
          <CardDescription>Origem e observações</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-y-4">
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                Como me conheceu?
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {customer.cameBy || "-"}
              </dd>
            </div>
            {customer.createdAt && (
              <div className="space-y-1">
                <dt className="text-xs font-medium uppercase text-muted-foreground">
                  Cliente desde
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {customer.createdAt}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerProfileTab;
