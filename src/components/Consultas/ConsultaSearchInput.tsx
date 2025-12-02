import { Search, X } from "lucide-react";
import { useState } from "react";

import { useDebounce } from "@/lib/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConsultaSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ConsultaSearchInput = ({
  value: controlledValue,
  onChange,
}: ConsultaSearchInputProps) => {
  const [localValue, setLocalValue] = useState(controlledValue);
  const debouncedValue = useDebounce(localValue, 300);

  // Sync debounced value with parent
  if (debouncedValue !== controlledValue) {
    onChange(debouncedValue);
  }

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar consultas..."
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="pl-10 pr-10"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="text-xs text-muted-foreground">Buscando por:</span>
        <Badge variant="secondary" className="text-xs">
          Nome do Cliente
        </Badge>
        <Badge variant="secondary" className="text-xs">
          Data
        </Badge>
        <Badge variant="secondary" className="text-xs">
          Peso
        </Badge>
      </div>
    </div>
  );
};
