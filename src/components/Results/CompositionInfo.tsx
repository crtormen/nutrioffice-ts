import { useSetLastConsulta } from "./hooks/useSetLastConsulta";

const CompositionInfo = () => {
  const consulta = useSetLastConsulta();
  if (!consulta || !consulta.results) return;

  return (
    <div className="flex flex-col gap-1 w-2/3 divide-y">
      <div className="flex">
        <div className="w-2/3 text-gray-400 text-sm">PESO</div>
        <div className="font-semibold">{consulta.peso} kg</div>
      </div>
      <div className="flex">
        <div className="w-2/3 text-gray-400 text-sm">MASSA GORDA</div>
        <div className="font-semibold">{consulta.results.mg} kg</div>
      </div>
      <div className="flex">
        <div className="w-2/3 text-gray-400 text-sm">MASSA MAGRA</div>
        <div className="font-semibold">{consulta.results.mm} kg</div>
      </div>
      <div className="flex">
        <div className="w-2/3 text-gray-400 text-sm">MASSA ÓSSEA</div>
        <div className="font-semibold">{consulta.results.mo} kg</div>
      </div>
      <div className="flex">
        <div className="w-2/3 text-gray-400 text-sm">MASSA RESIDUAL</div>
        <div className="font-semibold">{consulta.results.mr} kg</div>
      </div>
    </div>
  );
};

export default CompositionInfo;
