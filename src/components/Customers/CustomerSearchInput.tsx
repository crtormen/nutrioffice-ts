import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface CustomerSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomerSearchInput({
  value,
  onChange,
}: CustomerSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, 300);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  const handleClear = () => setLocalValue("");

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email, telefone ou CPF..."
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="pl-10 pr-10"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {localValue && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Buscando em:</span>
          <Badge variant="secondary" className="text-xs">
            Nome
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Email
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Telefone
          </Badge>
          <Badge variant="secondary" className="text-xs">
            CPF
          </Badge>
        </div>
      )}
    </div>
  );
}
