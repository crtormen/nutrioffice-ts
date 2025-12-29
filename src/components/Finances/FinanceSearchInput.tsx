import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface FinanceSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const FinanceSearchInput = ({
  value,
  onChange,
  placeholder = "Buscar por cliente...",
}: FinanceSearchInputProps) => {
  return (
    <div className="relative max-w-sm flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
};
