import { Plus } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { useShowAnamnesisData } from "@/components/Anamnesis/hooks/useShowAnamnesisData";
// import { useGetCustomerData } from "@/components/Customers/hooks";
import { Button } from "@/components/ui/button";

const CustomerAnamnesisTab: React.FC = () => {
  const navigate = useNavigate();
  const anamnesis = useShowAnamnesisData();

  return anamnesis ? (
    <div className="space-y-6">
      <div className="flex w-full justify-between">
        <h3 className="text-xl font-medium">Anamnese</h3>
        <div className="flex gap-1">
          {/* TODO */}
          <Button variant="outline">Editar Anamnese</Button>
          <Button variant="default">+ Nova Anamnese</Button>
          <Button variant="destructive">Excluir Anamnese</Button>
        </div>
      </div>
      <div className="mt-6 border-t border-gray-200 px-4 py-3 sm:p-0">
        <dl className="flex flex-wrap divide-y divide-gray-200">
          {anamnesis.map((field, i) => (
            <div
              key={i}
              className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3"
            >
              <dt className="text-xs font-medium text-muted-foreground">
                {field.label.toUpperCase()}
              </dt>
              <dd className="mt-1 text-sm font-semibold leading-6 text-foreground sm:col-span-2 sm:mt-0">
                {Array.isArray(field.value)
                  ? field.value.map((value) => value).join(", ")
                  : field.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      <div>
        <h4 className="text-md space-y-2 font-medium">
          Nenhuma anamnese cadastrada.
        </h4>
        <p className="text-sm text-muted-foreground">
          Clique no botão abaixo para criar uma nova anamnese.
        </p>
      </div>
      <Button
        variant="outline"
        className="flex items-center"
        onClick={() => navigate("../create-anamnesis")}
      >
        <Plus size="16" /> <span>Nova Anamnese</span>
      </Button>
    </div>
  );
};

export default CustomerAnamnesisTab;
// eslint-disable-next-line no-lone-blocks
{
  /* <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">OBJETIVOS</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.objetivos}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">
              ATIVIDADES FÍSICAS
            </dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.atividades}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">
              CONSUMO DE ÁGUA
            </dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.agua}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">PATOLOGIAS</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.patologias}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">MEDICAMENTOS</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.medicamentos}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">SUPLEMENTOS</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.suplementos}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">
              CONSUMO DE ALCOOL
            </dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.bebida}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">FUMANTE</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.fumante}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">
              ALERGIAS/INTOLERÂNCIAS
            </dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.alergias}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">
              NÍVEL DE ESTRESSE
            </dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.estresse}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">INFÂNCIA</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.infancia}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">INTESTINO</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.intestino}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">HORAS DE SONO</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.horas_sono}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">
              QUALIDADE DO SONO
            </dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.sono}
            </dd>
          </div>
          <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">
              FATORES EMOCIONAIS
            </dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {anamnesis.emocional}
            </dd>
          </div>
        </dl>
      </div>
      {customer?.gender === "H" && (
        <div className="mt-6 border-t border-gray-200 px-4 py-3 sm:p-0">
          <dl className="flex flex-wrap divide-y divide-gray-200">
            <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
              <dt className="text-xs font-medium text-gray-500">LIBIDO</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.libido}
              </dd>
            </div>
            <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
              <dt className="text-xs font-medium text-gray-500">CALVICIE</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.calvicie}
              </dd>
            </div>
          </dl>
        </div>
      )}
      {customer?.gender === "M" && (
        <div className="mt-6 border-t border-gray-200 px-4 py-3 sm:p-0">
          <dl className="flex flex-wrap divide-y divide-gray-200">
            <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
              <dt className="text-xs font-medium text-gray-500">
                JÁ FOI/ É GESTANTE
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.gestante}
              </dd>
            </div>
            <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
              <dt className="text-xs font-medium text-gray-500">
                NÍVEL DE TPM
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.tpm}
              </dd>
            </div>
            <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
              <dt className="text-xs font-medium text-gray-500">
                USOU / USA ANTICONCEPCIONAL
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.anticoncepcional}
              </dd>
            </div>
            <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
              <dt className="text-xs font-medium text-gray-500">
                QUANDO INICIOU O ANTI
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.idade_anti}
              </dd>
            </div>
            <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
              <dt className="text-xs font-medium text-gray-500">FLACIDEZ</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.flacidez}
              </dd>
            </div>
            <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
              <dt className="text-xs font-medium text-gray-500">CELULITE</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.celulite}
              </dd>
            </div>
            <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
              <dt className="text-xs font-medium text-gray-500">
                QUEDA DE CABELO
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.queda_cabelo}
              </dd>
            </div>
            <div className="flex w-1/2 flex-col items-start justify-between gap-4 py-3 sm:px-0 sm:py-3">
              <dt className="text-xs font-medium text-gray-500">
                UNHAS FRACAS
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.unhas}
              </dd>
            </div>
          </dl>
        </div>
      )} 
    </div> */
}
