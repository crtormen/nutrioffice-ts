import { Edit, FileText, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { useGetAnamnesisData } from "@/components/Anamnesis/hooks/useGetAnamnesisData";
import { useShowAnamnesisData } from "@/components/Anamnesis/hooks/useShowAnamnesisData";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CustomerAnamnesisTab: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const anamnesis = useShowAnamnesisData();
  const anamnesisData = useGetAnamnesisData(customerId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    // TODO: Navigate to edit page when implemented
    console.log("Edit anamnesis:", anamnesisData?.id);
  };

  const handleDelete = async () => {
    // TODO: Implement delete functionality
    console.log("Delete anamnesis:", anamnesisData?.id);
    setShowDeleteDialog(false);
  };

  return anamnesis ? (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">Anamnese</h3>
          <p className="text-sm text-muted-foreground">
            Histórico de saúde e alimentação do paciente
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              navigate(ROUTES.CUSTOMERS.CREATEANAMNESIS(customerId!))
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Anamnese
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <Separator />

      {/* Anamnesis Data */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Anamnese</CardTitle>
          {anamnesisData?.createdAt && (
            <CardDescription>
              Criada em {anamnesisData.createdAt}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            {anamnesis.map((field, i) => (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta anamnese? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ) : (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Nenhuma anamnese cadastrada</CardTitle>
        </div>
        <CardDescription>
          Registre a anamnese do paciente para acompanhar seu histórico de saúde
          e alimentação
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
  );
};

export default CustomerAnamnesisTab;
