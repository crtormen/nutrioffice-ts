import React from "react";
import { useGetCustomerData } from "@/components/Customers/hooks";
import { ICustomer } from "@/domain/entities";
import { useParams } from "react-router-dom";

const CustomerProfileTab: React.FC = () => {
  const { id } = useParams();
  const customer: ICustomer | undefined = useGetCustomerData(id);

  return (
    customer && (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Perfil</h3>
          <p className="text-sm text-muted-foreground">Dados pessoais</p>
        </div>
        <div className="mt-6 border-t border-gray-200 px-4 py-3 sm:p-0">
          <dl className="divide-y divide-gray-200">
            <div className="py-3 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-xs font-medium text-gray-500">NOME</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {customer.name}
              </dd>
            </div>
            <div className="py-3 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-xs font-medium text-gray-500">SEXO</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {customer.gender}
              </dd>
            </div>
            <div className="py-3 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-xs font-medium text-gray-500">E-MAIL</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {customer.email}
              </dd>
            </div>
            <div className="py-3 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-xs font-medium text-gray-500">
                DATA DE NASCIMENTO
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {customer.birthday}
              </dd>
            </div>
            <div className="py-3 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-xs font-medium text-gray-500">CPF</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {customer.cpf}
              </dd>
            </div>
            <div className="py-3 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-xs font-medium text-gray-500">TELEFONE</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {customer.phone}
              </dd>
            </div>
            <div className="py-3 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-xs font-medium text-gray-500">ENDEREÇO</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {customer.address?.street} - {customer.address?.district}
                <br />
                {customer.address?.city}, {customer.address?.cep}
              </dd>
            </div>
            <div className="py-3 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-xs font-medium text-gray-500">PROFISSÃO</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {customer.occupation}
              </dd>
            </div>
            <div className="py-3 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-xs font-medium text-gray-500">INSTAGRAM</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {customer.instagram}
              </dd>
            </div>
            <div className="py-3 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-xs font-medium text-gray-500">
                COMO ME CONHECEU?
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {customer.cameBy}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    )
  );
};

export default CustomerProfileTab;
