import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useSetLastConsulta } from "./hooks/useSetLastConsulta";

const CompositionInfo = () => {
  const consulta = useSetLastConsulta();
  if (!consulta || (!consulta.results && !consulta.bioimpedance)) return;

  const hasBioimpedance = consulta.bioimpedance && Object.keys(consulta.bioimpedance).length > 0;
  const hasResults = consulta.results;

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Protocol Badge */}
      {consulta.evaluationProtocol && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Protocolo:</span>
          <Badge variant="secondary">{consulta.evaluationProtocol.toUpperCase()}</Badge>
        </div>
      )}

      {/* Formula-based Results (from folds) */}
      {hasResults && (
        <div className="flex flex-col gap-1 divide-y">
          <div className="flex">
            <div className="w-2/3 text-sm text-gray-400">PESO</div>
            <div className="font-semibold">{consulta.peso} kg</div>
          </div>
          <div className="flex">
            <div className="w-2/3 text-sm text-gray-400">MASSA GORDA</div>
            <div className="font-semibold">{consulta.results?.mg} kg</div>
          </div>
          <div className="flex">
            <div className="w-2/3 text-sm text-gray-400">MASSA MAGRA</div>
            <div className="font-semibold">{consulta.results?.mm} kg</div>
          </div>
          <div className="flex">
            <div className="w-2/3 text-sm text-gray-400">MASSA ÓSSEA</div>
            <div className="font-semibold">{consulta.results?.mo} kg</div>
          </div>
          <div className="flex">
            <div className="w-2/3 text-sm text-gray-400">MASSA RESIDUAL</div>
            <div className="font-semibold">{consulta.results?.mr} kg</div>
          </div>
        </div>
      )}

      {/* Bioimpedance Results */}
      {hasBioimpedance && (
        <>
          {hasResults && <Separator className="my-2" />}
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Bioimpedância
            </h4>
            <div className="divide-y">
              {consulta.bioimpedance?.bodyFatPercentage !== undefined && (
                <div className="flex">
                  <div className="w-2/3 text-sm text-gray-400">% GORDURA</div>
                  <div className="font-semibold">
                    {consulta.bioimpedance?.bodyFatPercentage}%
                  </div>
                </div>
              )}
              {consulta.bioimpedance?.leanMass !== undefined && (
                <div className="flex">
                  <div className="w-2/3 text-sm text-gray-400">MASSA MAGRA</div>
                  <div className="font-semibold">{consulta.bioimpedance?.leanMass} kg</div>
                </div>
              )}
              {consulta.bioimpedance?.fatMass !== undefined && (
                <div className="flex">
                  <div className="w-2/3 text-sm text-gray-400">MASSA GORDA</div>
                  <div className="font-semibold">{consulta.bioimpedance?.fatMass} kg</div>
                </div>
              )}
              {consulta.bioimpedance?.muscleMass !== undefined && (
                <div className="flex">
                  <div className="w-2/3 text-sm text-gray-400">MASSA MUSCULAR</div>
                  <div className="font-semibold">{consulta.bioimpedance?.muscleMass} kg</div>
                </div>
              )}
              {consulta.bioimpedance?.waterPercentage !== undefined && (
                <div className="flex">
                  <div className="w-2/3 text-sm text-gray-400">% ÁGUA</div>
                  <div className="font-semibold">
                    {consulta.bioimpedance?.waterPercentage}%
                  </div>
                </div>
              )}
              {consulta.bioimpedance?.bmr !== undefined && (
                <div className="flex">
                  <div className="w-2/3 text-sm text-gray-400">TMB</div>
                  <div className="font-semibold">{consulta.bioimpedance?.bmr} kcal</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompositionInfo;
