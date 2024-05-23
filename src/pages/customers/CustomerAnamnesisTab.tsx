import React from "react";
import { useParams } from "react-router-dom";
import { useGetAnamnesisData } from "@/components/Anamnesis/hooks";
import { useGetCustomerData } from "@/components/Customers/hooks";

const CustomerAnamnesisTab: React.FC = () => {
  const { id } = useParams();
  const anamnesis = useGetAnamnesisData(id);
  const customer = useGetCustomerData(id);

  return (
    anamnesis && (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Anamnese</h3>
          <p className="text-sm text-muted-foreground"></p>
        </div>
        <div className="mt-6 border-t border-gray-200 px-4 py-3 sm:p-0">
          <dl className="divide-y divide-gray-200 flex flex-wrap">
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">OBJETIVOS</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.objetivos}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">
                ATIVIDADES FÍSICAS
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.atividades}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">
                CONSUMO DE ÁGUA
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.agua}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">PATOLOGIAS</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.patologias}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">
                MEDICAMENTOS
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.medicamentos}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">SUPLEMENTOS</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.suplementos}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">
                CONSUMO DE ALCOOL
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.bebida}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">FUMANTE</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.fumante}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">
                ALERGIAS/INTOLERÂNCIAS
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.alergias}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">
                NÍVEL DE ESTRESSE
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.estresse}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">INFÂNCIA</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.infancia}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">INTESTINO</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.intestino}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">
                HORAS DE SONO
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.horas_sono}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
              <dt className="text-xs font-medium text-gray-500">
                QUALIDADE DO SONO
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {anamnesis.sono}
              </dd>
            </div>
            <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
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
            <dl className="divide-y divide-gray-200 flex flex-wrap">
              <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
                <dt className="text-xs font-medium text-gray-500">LIBIDO</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {anamnesis.libido}
                </dd>
              </div>
              <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
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
            <dl className="divide-y divide-gray-200 flex flex-wrap">
              <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
                <dt className="text-xs font-medium text-gray-500">
                  JÁ FOI/ É GESTANTE
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {anamnesis.gestante}
                </dd>
              </div>
              <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
                <dt className="text-xs font-medium text-gray-500">
                  NÍVEL DE TPM
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {anamnesis.tpm}
                </dd>
              </div>
              <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
                <dt className="text-xs font-medium text-gray-500">
                  USOU / USA ANTICONCEPCIONAL
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {anamnesis.anticoncepcional}
                </dd>
              </div>
              <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
                <dt className="text-xs font-medium text-gray-500">
                  QUANDO INICIOU O ANTI
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {anamnesis.idade_anti}
                </dd>
              </div>
              <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
                <dt className="text-xs font-medium text-gray-500">FLACIDEZ</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {anamnesis.flacidez}
                </dd>
              </div>
              <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
                <dt className="text-xs font-medium text-gray-500">CELULITE</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {anamnesis.celulite}
                </dd>
              </div>
              <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
                <dt className="text-xs font-medium text-gray-500">
                  QUEDA DE CABELO
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {anamnesis.queda_cabelo}
                </dd>
              </div>
              <div className="py-3 sm:py-3 gap-4 sm:px-0 flex flex-col items-start justify-between w-1/2">
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
      </div>
    )
  );
};

export default CustomerAnamnesisTab;
