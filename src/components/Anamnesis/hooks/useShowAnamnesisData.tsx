import { useParams } from "react-router-dom";

import { useGetAnamnesisData } from "@/components/Anamnesis/hooks";
import { useSetAnamnesisForm } from "@/components/Anamnesis/hooks/useSetAnamnesisForm";

export const useShowAnamnesisData = () => {
  const { customerId } = useParams();
  const { anamnesisFieldArray } = useSetAnamnesisForm();
  const anamnesisData = useGetAnamnesisData(customerId);
  // const customer = useGetCustomerData(id);

  // return anamnesis data dynamically based on the fields defined at settings
  const anamnesis =
    anamnesisData &&
    anamnesisFieldArray
      ?.map(([key, field]) => {
        const values = anamnesisData[key];
        if (!values) return undefined;

        return {
          field: key,
          label: field.label,
          value: field.options
            ? typeof values === "string"
              ? field.options[values]
              : values.map((value) => field.options && field.options[value])
            : values,
        };
      })
      .filter((field) => field !== undefined);

  return anamnesis;
};
