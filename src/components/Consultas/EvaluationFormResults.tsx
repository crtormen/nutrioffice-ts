import { useMultiStepEvaluationFormContext } from "./context/MultiStepEvaluationFormContext";

export const EvaluationFormResult = ({ online }: { online?: boolean }) => {
  const { results, peso, idade } = useMultiStepEvaluationFormContext();

  return (
    results && (
      <div className="mt-6 border-t border-gray-200 px-4 py-3 sm:p-0">
        <dl className="divide-y divide-gray-200">
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">Idade</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {idade} anos
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 sm:py-3">
            <dt className="text-xs font-medium text-gray-500">Peso</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {peso} Kg
            </dd>
          </div>
          {!online && (
            <>
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 sm:py-3">
                <dt className="text-xs font-medium text-gray-500">% Gordura</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {results.fat} %
                </dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 sm:py-3">
                <dt className="text-xs font-medium text-gray-500">
                  Massa Gorda
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {results.mg} Kg
                </dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 sm:py-3">
                <dt className="text-xs font-medium text-gray-500">
                  Massa Magra
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {results.mm} Kg
                </dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 sm:py-3">
                <dt className="text-xs font-medium text-gray-500">
                  Massa Óssea
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {results.mo} Kg
                </dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 sm:py-3">
                <dt className="text-xs font-medium text-gray-500">
                  Massa Residual
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {results.mr} Kg
                </dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 sm:py-3">
                <dt className="text-xs font-medium text-gray-500">
                  Soma de Dobras
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {results.dobras}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>
    )
  );
};
