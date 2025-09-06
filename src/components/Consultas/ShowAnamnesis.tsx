import { useShowAnamnesisData } from "../Anamnesis/hooks/useShowAnamnesisData";

export const ShowAnamnesis = () => {
  const anamnesis = useShowAnamnesisData();
  if (!anamnesis)
    return (
      <div>
        <h4 className="text-md space-y-2 font-medium">
          Nenhuma anamnese cadastrada.
        </h4>
      </div>
    );
  return (
    <dl className="flex flex-wrap divide-y divide-gray-200">
      {Object.entries(anamnesis).map(([, field], i) => (
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
  );
};
