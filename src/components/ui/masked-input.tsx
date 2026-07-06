import { InputMask } from "@react-input/mask";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const MASK_TYPE = {
  phone: "(##)#####-####",
  cep: "#####-###",
  date: "##/##/####",
  time: "##:##",
  creditCard: "#### #### #### ####",
  cpf: "###.###.###-##",
} as const;

export interface MaskedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: keyof typeof MASK_TYPE;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, type, mask, ...props }, ref) => {
    return (
      <InputMask
        ref={ref}
        type={type}
        mask={MASK_TYPE[mask]}
        replacement={{ "#": /\d/ }}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
