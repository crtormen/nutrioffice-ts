import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAppSelector } from "@/app/state";
import {
  selectCustomAnamnesisSettings,
  selectDefaultAnamnesisSettings,
  useFetchSettingsQuery,
  useSetSettingsMutation,
} from "@/app/state/features/settingsSlice";
import { InitializeUserSettingsButton } from "@/components/Admin/InitializeUserSettingsButton";
import SetAnamnesisFieldDialog from "@/components/Settings/SetAnamnesisFieldDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FieldSetting,
  FieldValuesSetting,
  GENDERS,
  ISettings,
} from "@/domain/entities";
import { useAuth } from "@/infra/firebase";
import { cn } from "@/lib/utils";

type settingType = "custom" | "default";
type fieldEdittingType = {
  field: FieldValuesSetting | undefined;
  type: settingType | "";
};
type fieldDetailsProps = {
  field: FieldValuesSetting;
  id: string;
};

const FieldDetails = ({ field, id }: fieldDetailsProps) => (
  <div className="flex justify-between gap-4 p-3">
    <div className="flex flex-col gap-2 px-2">
      <div className="text-sm font-normal text-muted-foreground">ID</div>
      <div className="font-semibold">{id}</div>
    </div>
    <div className="flex flex-col gap-2 px-2">
      <div className="text-sm font-normal text-muted-foreground">
        Placeholder
      </div>
      <div className="font-semibold">{field.placeholder}</div>
    </div>
    {field.options && (
      <div className="flex flex-col gap-2 px-2">
        <div className="text-sm font-normal text-muted-foreground">Opções</div>
        <div className="flex flex-col items-start gap-2">
          {Object.entries(field.options).map(([key, value]) => (
            <div key={key}>
              {key} - {value}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const AnamnesisSettingsTab = () => {
  const { user } = useAuth();
  const { refetch } = useFetchSettingsQuery(user?.uid);
  const [updateSettings] = useSetSettingsMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<fieldEdittingType>({
    field: undefined,
    type: "",
  });
  const customAnamnesisFields = useAppSelector(
    selectCustomAnamnesisSettings(user?.uid),
  );
  const defaultAnamnesisFields = useAppSelector(
    selectDefaultAnamnesisSettings(user?.uid),
  );

  const onClickDelete = (value: FieldValuesSetting, type: settingType | "") => {
    setFieldToEdit({ field: value, type });
    setDeleteDialogOpen(true);
  };

  const onClickEdit = (value: FieldValuesSetting, type: settingType | "") => {
    setFieldToEdit({ field: value, type });
    setDialogOpen(true);
  };

  function handleDeleteAnamnesisField(fieldId: string, type: string) {
    const anamnesisFields =
      type === "custom" ? customAnamnesisFields : defaultAnamnesisFields;
    if (!anamnesisFields || !anamnesisFields[fieldId]) return;

    const { [fieldId]: fieldToDelete, ...remainingAnamnesisFields } =
      anamnesisFields;

    const updatedSettings: Partial<ISettings> = {
      anamnesis: remainingAnamnesisFields,
    };

    setDeleteDialogOpen(false);
    // Update user's collaborators list
    updateSettings({
      uid: user?.uid,
      type,
      setting: updatedSettings,
      merge: false,
    })
      .then(() => {
        toast.success(`Campo "${fieldToDelete.label}" removido com sucesso.`);
        refetch();
      })
      .catch(() => {
        toast.error("Ocorreu um erro ao remover o campo. Tente Novamente.");
      });
    setFieldToEdit({ field: undefined, type: "" });
  }

  const getSortedFieldEntries = (
    fields: FieldSetting,
    gender?: string,
  ): [string, FieldValuesSetting][] => {
    return Object.entries(fields)
      .filter(([, value]) => value.gender === gender)
      .sort(([, a], [, b]) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
  };

  const SortableFieldsTable = ({
    anamnesisFields,
    type,
  }: {
    anamnesisFields: FieldSetting;
    type: settingType;
  }) => {
    const allSortedEntries = [
      ...getSortedFieldEntries(anamnesisFields),
      ...getSortedFieldEntries(anamnesisFields, "B"),
      ...getSortedFieldEntries(anamnesisFields, "M"),
      ...getSortedFieldEntries(anamnesisFields, "H"),
    ];

    const handleReorder = (newOrder: [string, FieldValuesSetting][]) => {
      const updatedFields: FieldSetting = {};
      newOrder.forEach(([key, value], index) => {
        updatedFields[key] = { ...value, order: index };
      });

      updateSettings({
        uid: user?.uid,
        type,
        setting: { anamnesis: updatedFields },
        merge: false,
      })
        .then(() => {
          toast.success("Ordem dos campos atualizada com sucesso.");
          refetch();
        })
        .catch(() => {
          toast.error("Ocorreu um erro ao atualizar a ordem. Tente novamente.");
        });
    };

    return (
      <Sortable
        value={allSortedEntries}
        onValueChange={handleReorder}
        getItemValue={(item) => item[0]}
        orientation="vertical"
      >
        <SortableContent items={allSortedEntries.map(([key]) => key)}>
          <div className="flex flex-col gap-2">
            {allSortedEntries.map(([key, value]) => {
              const genderClass =
                value.gender === "M"
                  ? "border-purple-200 bg-purple-50"
                  : value.gender === "H"
                    ? "border-blue-200 bg-blue-50"
                    : "";

              return (
                value && (
                  <SortableItem key={key} value={key}>
                    <Collapsible>
                      <div
                        className={cn(
                          "rounded-lg border bg-card text-card-foreground shadow-sm",
                          genderClass,
                        )}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex cursor-pointer items-center gap-3 p-4 hover:bg-accent/50">
                            <SortableItemHandle asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="h-4 w-4" />
                              </Button>
                            </SortableItemHandle>
                            <div className="grid flex-1 grid-cols-3 gap-4">
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                  Label
                                </div>
                                <div className="font-semibold">
                                  {value.label}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                  Tipo
                                </div>
                                <div>{value.type}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                  Gênero
                                </div>
                                <div>
                                  {value.gender
                                    ? GENDERS[value.gender].text
                                    : "Geral"}
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    onClickEdit({ ...value, name: key }, type)
                                  }
                                >
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    onClickDelete({ ...value, name: key }, type)
                                  }
                                >
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t px-4 pb-4">
                            <FieldDetails field={value} id={key} />
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </SortableItem>
                )
              );
            })}
          </div>
        </SortableContent>
      </Sortable>
    );
  };

  const hasNoFields =
    (!defaultAnamnesisFields ||
      Object.keys(defaultAnamnesisFields).length === 0) &&
    (!customAnamnesisFields || Object.keys(customAnamnesisFields).length === 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Anamnese</h3>
        <p className="text-muted-foreground">
          Gerencie os campos que estarão presentes em sua anamnese.
        </p>
      </div>
      <Separator />

      {hasNoFields && (
        <Alert>
          <AlertTitle>Nenhum campo de anamnese configurado</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Você ainda não possui campos de anamnese configurados. Clique no
              botão abaixo para inicializar os campos padrão ou crie seus
              próprios campos personalizados.
            </p>
            <InitializeUserSettingsButton />
          </AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end">
        <Dialog
          open={dialogOpen}
          onOpenChange={(isOpen) => {
            setDialogOpen(isOpen);
            setFieldToEdit({ field: undefined, type: "" });
          }}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus size="16" /> <span>Novo Campo</span>
            </Button>
          </DialogTrigger>
          <SetAnamnesisFieldDialog
            fieldToEdit={fieldToEdit.field}
            type={fieldToEdit.type}
            isOpen={dialogOpen}
            setDialogOpen={(isOpen: boolean) => {
              setDialogOpen(isOpen);
              setFieldToEdit({ field: undefined, type: "" });
              refetch();
            }}
          />
        </Dialog>
      </div>
      <div className="flex flex-col gap-12">
        {customAnamnesisFields && (
          <div>
            {Object.entries(customAnamnesisFields).length > 0 && (
              <div className="flex flex-col gap-6 px-2 pb-10">
                <div>
                  <h2 className="text-md font-semibold">
                    Campos Personalizados
                  </h2>
                </div>
                <SortableFieldsTable
                  anamnesisFields={customAnamnesisFields}
                  type="custom"
                />
              </div>
            )}
            <Separator className="bg-primary" />
          </div>
        )}
        {defaultAnamnesisFields && (
          <div className="flex flex-col gap-6 px-2">
            <div>
              <h2 className="text-md font-semibold">Campos Padrão</h2>
            </div>
            <SortableFieldsTable
              anamnesisFields={defaultAnamnesisFields}
              type="default"
            />
          </div>
        )}
      </div>
      {fieldToEdit.field && (
        <ConfirmDialog
          open={deleteDialogOpen}
          message={`Deseja excluir o campo "${fieldToEdit.field.label}"?`}
          description="Essa ação não pode ser desfeita. Os dados cadastrados com este campo não serão removidos da sua base de dados, porém não poderão mais serem acessados."
          onConfirm={() =>
            fieldToEdit.field &&
            handleDeleteAnamnesisField(fieldToEdit.field.name, fieldToEdit.type)
          }
          onCancel={() => setDeleteDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default AnamnesisSettingsTab;
