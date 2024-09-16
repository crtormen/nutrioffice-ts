import { ArrowDownUp, CheckIcon } from "lucide-react";
import { useState } from "react";

import { ResultsChart } from "@/components/Results/ResultsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";

const options = [
  { label: "Massa Magra", value: "mm" },
  { label: "Massa Gorda", value: "mg" },
  { label: "% de Gordura", value: "fat" },
  { label: "Peso", value: "weight" },
];

const ResultsCard = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("fat");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados</CardTitle>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
            >
              {value
                ? options.find((option) => option.value === value)?.label
                : "Selecione um parâmetro"}

              <ArrowDownUp className="ml-2 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandList>
                <CommandEmpty>Nenhum parâmetro encontrado.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      value={option.value}
                      key={option.value}
                      onSelect={(currentValue) => {
                        setValue(currentValue);
                        setOpen(false);
                      }}
                    >
                      {option.label}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="pl-2">
        <ResultsChart param={value} />
      </CardContent>
    </Card>
  );
};

export default ResultsCard;
