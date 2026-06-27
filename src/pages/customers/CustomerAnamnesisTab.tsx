import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { useAppSelector } from "@/app/state";
import {
  selectAllAnamnesis,
  useDeleteAnamnesisMutation,
  useFetchAnamnesisQuery,
} from "@/app/state/features/anamnesisSlice";
import { selectAnamnesisSettings } from "@/app/state/features/settingsSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/app/router/routes";
import { useAuth } from "@/infra/firebase";
import { IAnamnesis } from "@/domain/entities";

const AnamnesisRecord: React.FC<{
  anamnesis: IAnamnesis;
  anamnesisFieldArray: [string, { label: string; options?: Record<string, string> }][];
  onEdit: () => void;
  onDelete: () => void;
}> = ({ anamnesis, anamnesisFieldArray, onEdit, onDelete }) => {
  const createdAtRaw = anamnesis.createdAt;
  const createdAtDate = createdAtRaw
    ? typeof createdAtRaw === "object" && "toDate" in (createdAtRaw as any)
      ? (createdAtRaw as any).toDate()
      : new Date(createdAtRaw as string)
    : null;
  const createdAt = createdAtDate && !isNaN(createdAtDate.getTime())
    ? format(createdAtDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  const fields = anamnesisFieldArray
    .map(([key, field]) => {
      const values = anamnesis[key];
      if (!values) return undefined;
      const hasOptions = field.options && Object.keys(field.options).length > 0;
      return {
        field: key,
        label: field.label,
        value: hasOptions
          ? typeof values === "string"
            ? (field.options![values] ?? values)
            : (values as string[]).map((v) => field.options?.[v] ?? v)
          : values,
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== undefined);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Anamnese</CardTitle>
            {createdAt && (
              <CardDescription>Criada em {createdAt}</CardDescription>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          {fields.map((field, i) => (
            <div key={i} className="space-y-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                {field.label}
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {Array.isArray(field.value)
                  ? field.value.join(", ")
                  : field.value || "-"}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
};

const CustomerAnamnesisTab: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const { dbUid } = useAuth();
  const [deleteAnamnesis] = useDeleteAnamnesisMutation();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useFetchAnamnesisQuery({ uid: dbUid, customerId });

  const selectAll = useMemo(() => selectAllAnamnesis(dbUid, customerId), [dbUid, customerId]);
  const allAnamnesis = useAppSelector(selectAll);
  const selectSettings = useMemo(() => selectAnamnesisSettings(dbUid), [dbUid]);
  const anamnesisFields = useAppSelector(selectSettings);
  const anamnesisFieldArray = Object.entries(anamnesisFields) as [
    string,
    { label: string; options?: Record<string, string> },
  ][];

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteAnamnesis({ uid: dbUid, customerId, anamnesisId: pendingDeleteId }).unwrap();
      toast.success("Anamnese excluída.");
    } catch {
      toast.error("Falha ao excluir anamnese.");
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">Anamnese</h3>
          <p className="text-sm text-muted-foreground">
            Histórico de saúde e alimentação do paciente
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(ROUTES.CUSTOMERS.CREATEANAMNESIS(customerId!))}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Anamnese
        </Button>
      </div>

      <Separator />

      {allAnamnesis.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Nenhuma anamnese cadastrada</CardTitle>
            </div>
            <CardDescription>
              Registre a anamnese do paciente para acompanhar seu histórico de
              saúde e alimentação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() =>
                navigate(ROUTES.CUSTOMERS.CREATEANAMNESIS(customerId!))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Anamnese
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {allAnamnesis.map((anamnesis, i) => (
            <AnamnesisRecord
              key={anamnesis.id as string ?? i}
              anamnesis={anamnesis}
              anamnesisFieldArray={anamnesisFieldArray}
              onEdit={() => navigate(ROUTES.CUSTOMERS.EDITANAMNESIS(customerId!, anamnesis.id as string))}
              onDelete={() => setPendingDeleteId(anamnesis.id as string)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anamnese?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A anamnese será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerAnamnesisTab;
