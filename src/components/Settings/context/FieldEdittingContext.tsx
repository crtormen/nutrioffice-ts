import React, { createContext, ReactNode, useContext, useState } from "react";

import { FieldValuesSetting } from "@/domain/entities";

export interface IFieldEditting {
  field: FieldValuesSetting | undefined;
  type: "custom" | "default" | "";
  deleteDialogOpen: boolean;
  fieldDialogOpen: boolean;
}

interface FieldEdittingContextType {
  fieldEditting: IFieldEditting;
  setFieldEditting: (fieldEditting: IFieldEditting) => void;
}

const FieldEdittingContext = createContext<
  FieldEdittingContextType | undefined
>(undefined);

export const FieldEdittingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [fieldEditting, setFieldEditting] = useState<IFieldEditting>({
    field: undefined,
    type: "",
    deleteDialogOpen: false,
    fieldDialogOpen: false,
  });

  return (
    <FieldEdittingContext.Provider value={{ fieldEditting, setFieldEditting }}>
      {children}
    </FieldEdittingContext.Provider>
  );
};

export const useFieldEditting = () => {
  const context = useContext(FieldEdittingContext);
  if (!context)
    throw new Error(
      "useFieldEditting must be used within a FieldEdittingProvider",
    );

  return context;
};
