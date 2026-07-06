import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useFetchSettingsQuery } from "@/app/state/features/settingsSlice";
import { useUpdateEnabledFieldsTokenMutation } from "@/app/state/features/anamnesisTokensSlice";
import { AppointmentType } from "@/domain/entities/formSubmission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

interface PublicFormFieldSelectorProps {
  appointmentType: AppointmentType;
  enabledFields: string[];
}

export function PublicFormFieldSelector({
  appointmentType,
  enabledFields: initialEnabledFields,
}: PublicFormFieldSelectorProps) {
  const { dbUid } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [updateEnabledFields, { isLoading: isSaving }] = useUpdateEnabledFieldsTokenMutation();

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

  const customAnamnesis = settings?.custom?.anamnesis || {};
  const defaultAnamnesis = settings?.default?.anamnesis || {};

  const allAnamnesisFields = {
    ...defaultAnamnesis,
    ...customAnamnesis,
  };

  const sortedByOrder = Object.entries(allAnamnesisFields).sort(
    ([, a], [, b]) => {
      const orderA = (a as any).order ?? Number.MAX_SAFE_INTEGER;
      const orderB = (b as any).order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    },
  );
  const allFieldIds = sortedByOrder.map(([id]) => id);

  const buildInitialOrder = (enabledIds: string[], allIds: string[]) => {
    // Start with enabled fields in their saved order, then append remaining fields
    const remaining = allIds.filter((id) => !enabledIds.includes(id));
    return [...enabledIds, ...remaining];
  };

  const [orderedFields, setOrderedFields] = useState<string[]>(() =>
    initialEnabledFields.length > 0
      ? buildInitialOrder(initialEnabledFields, allFieldIds)
      : allFieldIds,
  );

  const [enabledSet, setEnabledSet] = useState<Set<string>>(
    () => new Set(initialEnabledFields.length > 0 ? initialEnabledFields : allFieldIds),
  );

  useEffect(() => {
    const newOrder =
      initialEnabledFields.length > 0
        ? buildInitialOrder(initialEnabledFields, allFieldIds)
        : allFieldIds;
    setOrderedFields(newOrder);
    setEnabledSet(
      new Set(initialEnabledFields.length > 0 ? initialEnabledFields : allFieldIds),
    );
    setHasChanges(initialEnabledFields.length === 0 && allFieldIds.length > 0);
  }, [initialEnabledFields.join(","), allFieldIds.join(",")]);

  const handleToggleField = (fieldId: string) => {
    setEnabledSet((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleReorder = (newOrder: string[]) => {
    setOrderedFields(newOrder);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!dbUid) return;

    const enabledInOrder = orderedFields.filter((id) => enabledSet.has(id));

    try {
      await updateEnabledFields({ uid: dbUid, type: appointmentType, enabledFields: enabledInOrder }).unwrap();
      toast.success("Campos atualizados com sucesso!");
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar configurações");
    }
  };

  const handleReset = () => {
    const newOrder =
      initialEnabledFields.length > 0
        ? buildInitialOrder(initialEnabledFields, allFieldIds)
        : allFieldIds;
    setOrderedFields(newOrder);
    setEnabledSet(
      new Set(initialEnabledFields.length > 0 ? initialEnabledFields : allFieldIds),
    );
    setHasChanges(false);
  };

  if (sortedByOrder.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Nenhum campo de anamnese disponível. Configure os campos na aba
          "Anamnese" primeiro.
        </AlertDescription>
      </Alert>
    );
  }

  const enabledCount = orderedFields.filter((id) => enabledSet.has(id)).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>
            Campos Habilitados ({enabledCount}/{sortedByOrder.length})
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Arraste para reordenar. Os campos são exibidos no formulário público
          nesta ordem.
        </p>

        <Sortable
          value={orderedFields}
          onValueChange={handleReorder}
          getItemValue={(item) => item}
          orientation="vertical"
        >
          <SortableContent items={orderedFields}>
            <div className="flex flex-col gap-2">
              {orderedFields.map((fieldId) => {
                const field = allAnamnesisFields[fieldId] as any;
                if (!field) return null;
                return (
                  <SortableItem key={fieldId} value={fieldId} asChild>
                    <div className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
                      <SortableItemHandle className="h-7 w-7 text-muted-foreground hover:text-foreground" />
                      <Checkbox
                        id={`${appointmentType}-${fieldId}`}
                        checked={enabledSet.has(fieldId)}
                        onCheckedChange={() => handleToggleField(fieldId)}
                      />
                      <div className="min-w-0 flex-1 space-y-0.5 leading-none">
                        <Label
                          htmlFor={`${appointmentType}-${fieldId}`}
                          className="cursor-pointer text-sm font-medium"
                        >
                          {field.label || fieldId}
                        </Label>
                        {field.gender && field.gender !== "B" && (
                          <p className="text-xs text-muted-foreground">
                            (
                            {field.gender === "H"
                              ? "Apenas Homens"
                              : "Apenas Mulheres"}
                            )
                          </p>
                        )}
                      </div>
                    </div>
                  </SortableItem>
                );
              })}
            </div>
          </SortableContent>
        </Sortable>

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
