import { MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAppSelector } from "@/app/state";
import {
  selectCustomAnamnesisSettings,
  selectDefaultAnamnesisSettings,
  useFetchSettingsQuery,
  useSetSettingsMutation,
} from "@/app/state/features/settingsSlice";
import SetAnamnesisFieldDialog from "@/components/Settings/SetAnamnesisFieldDialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FieldSetting, FieldValuesSetting, GENDERS } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";
import { cn } from "@/lib/utils";

type settingType = "custom" | "default";
type fieldEdittingType = {
  field: FieldValuesSetting | undefined;
  type: settingType | "";
};
type tableRowProps = {
  anamnesisFields: FieldSetting;
  gender?: string;
  className?: string;
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

    const updatedSettings = {
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

  const GenderRows = ({ anamnesisFields, gender, className }: tableRowProps) =>
    Object.entries(anamnesisFields)
      .filter(([, value]) => value.gender === gender)
      .map(
        ([key, value]) =>
          value && (
            <Collapsible key={key} asChild>
              <>
                <TableRow className={cn("h-20 text-left", className)}>
                  <TableCell>
                    <CollapsibleTrigger asChild className="cursor-pointer">
                      <div>{value.label}</div>
                    </CollapsibleTrigger>
                  </TableCell>
                  <TableCell className="">
                    <CollapsibleTrigger asChild className="cursor-pointer">
                      <div>{value.type}</div>
                    </CollapsibleTrigger>
                  </TableCell>
                  <TableCell className="">
                    <CollapsibleTrigger asChild className="cursor-pointer">
                      <div>
                        {value.gender ? GENDERS[value.gender].text : "Geral"}
                      </div>
                    </CollapsibleTrigger>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <CollapsibleTrigger asChild>
                            <div>Ver Detalhes</div>
                          </CollapsibleTrigger>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            onClickEdit({ ...value, name: key }, "custom")
                          }
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onClickDelete({ ...value, name: key }, "custom")
                          }
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                <CollapsibleContent asChild>
                  <FieldDetails field={value} id={key} />
                </CollapsibleContent>
              </>
            </Collapsible>
          ),
      );

  const GroupRowsByGender = ({
    anamnesisFields,
  }: {
    anamnesisFields: FieldSetting;
  }) => (
    <TableBody>
      <GenderRows anamnesisFields={anamnesisFields} />
      <GenderRows anamnesisFields={anamnesisFields} gender="B" />
      <GenderRows
        anamnesisFields={anamnesisFields}
        gender="M"
        className="bg-purple-50"
      />
      <GenderRows
        anamnesisFields={anamnesisFields}
        gender="H"
        className="bg-blue-50"
      />
    </TableBody>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Anamnese</h3>
        <p className="text-muted-foreground">
          Gerencie os campos que estarão presentes em sua anamnese.
        </p>
      </div>
      <Separator />
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium">Label</TableHead>
                        <TableHead className="font-medium">Tipo</TableHead>
                        <TableHead className="font-medium">Gênero</TableHead>
                      </TableRow>
                    </TableHeader>
                    <GroupRowsByGender anamnesisFields={customAnamnesisFields} />
                  </Table>
                </div>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Label</TableHead>
                    <TableHead className="font-medium">Tipo</TableHead>
                    <TableHead className="font-medium">Gênero</TableHead>
                  </TableRow>
                </TableHeader>
                <GroupRowsByGender anamnesisFields={defaultAnamnesisFields} />
              </Table>
            </div>
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
