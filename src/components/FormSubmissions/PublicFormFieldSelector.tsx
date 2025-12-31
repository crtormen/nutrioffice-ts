import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { updateAnamnesisFormToken } from "@/app/services/PublicFormService";
import { useFetchSettingsQuery } from "@/app/state/features/settingsSlice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

interface PublicFormFieldSelectorProps {
  appointmentType: "online" | "presencial";
  enabledFields: string[];
}

export function PublicFormFieldSelector({
  appointmentType,
  enabledFields: initialEnabledFields,
}: PublicFormFieldSelectorProps) {
  const { dbUid } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useFetchSettingsQuery(dbUid || "", {
    skip: !dbUid,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check both custom and default anamnesis fields
  const customAnamnesis = settings?.custom?.anamnesis || {};
  const defaultAnamnesis = settings?.default?.anamnesis || {};

  // Merge custom and default fields (custom takes precedence)
  const allAnamnesisFields = {
    ...defaultAnamnesis,
    ...customAnamnesis,
  };

  const allFieldIds = Object.keys(allAnamnesisFields);
  const anamnesisFields = Object.entries(allAnamnesisFields);

  // Initialize with all fields selected if no fields are enabled yet
  const [enabledFields, setEnabledFields] = useState<string[]>(
    initialEnabledFields.length > 0 ? initialEnabledFields : allFieldIds,
  );

  useEffect(() => {
    // Only update if we have initial fields, otherwise keep all selected
    if (initialEnabledFields.length > 0) {
      setEnabledFields(initialEnabledFields);
      setHasChanges(false);
    } else if (allFieldIds.length > 0) {
      // Auto-select all fields and mark as having changes so user knows to save
      setEnabledFields(allFieldIds);
      setHasChanges(true);
    }
  }, [initialEnabledFields.join(","), allFieldIds.join(",")]);

  const handleToggleField = (fieldId: string) => {
    setEnabledFields((prev) => {
      const newFields = prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId];
      setHasChanges(true);
      return newFields;
    });
  };

  const handleSave = async () => {
    if (!dbUid) return;

    setIsSaving(true);
    try {
      await updateAnamnesisFormToken(dbUid, appointmentType, enabledFields);
      toast.success("Campos atualizados com sucesso!");
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEnabledFields(
      initialEnabledFields.length > 0 ? initialEnabledFields : allFieldIds,
    );
    setHasChanges(false);
  };

  if (anamnesisFields.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Nenhum campo de anamnese disponível. Configure os campos na aba
          "Anamnese" primeiro.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>
            Campos Habilitados ({enabledFields.length}/{anamnesisFields.length})
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {anamnesisFields.map(([fieldId, field]: [string, any]) => (
            <div key={fieldId} className="flex items-start space-x-3 space-y-0">
              <Checkbox
                id={`${appointmentType}-${fieldId}`}
                checked={enabledFields.includes(fieldId)}
                onCheckedChange={() => handleToggleField(fieldId)}
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor={`${appointmentType}-${fieldId}`}
                  className="cursor-pointer text-sm font-medium"
                >
                  {field.label || fieldId}
                </Label>
                {field.gender && field.gender !== "B" && (
                  <p className="text-xs text-muted-foreground">
                    (
                    {field.gender === "H" ? "Apenas Homens" : "Apenas Mulheres"}
                    )
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
