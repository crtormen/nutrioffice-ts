import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

import { useAppSelector } from "@/app/state";
import {
  useFetchSettingsQuery,
  useSetSettingsMutation,
} from "@/app/state/features/settingsSlice";
import { SetServiceDialog } from "@/components/Settings/SetServiceDialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Badge } from "@/components/ui/badge";
import { IServiceConfig, SERVICE_CATEGORIES } from "@/domain/entities/settings";
import { useAuth } from "@/infra/firebase/hooks";
import { useToast } from "@/components/ui/use-toast";

const ServicesSettingsTab = () => {
  const { dbUid } = useAuth();
  const { toast } = useToast();
  const { data: settings, refetch } = useFetchSettingsQuery(dbUid);
  const [updateSettings] = useSetSettingsMutation();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{ key: string; name: string } | null>(null);
  const [editingService, setEditingService] = useState<{ service: IServiceConfig; key: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Merge custom and default services
  const allServices = {
    ...settings?.default?.services,
    ...settings?.custom?.services,
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      // Get all custom services except the one to delete
      const { [serviceToDelete.key]: removed, ...remainingServices } = settings?.custom?.services || {};

      await updateSettings({
        uid: dbUid,
        type: "custom",
        setting: {
          services: remainingServices,
        } as any,
        merge: false, // Replace entire custom services
      }).unwrap();

      toast({
        title: "Serviço excluído",
        description: `${serviceToDelete.name} foi removido com sucesso.`,
      });

      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o serviço. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Serviços</h3>
        <p className="text-muted-foreground">
          Gerencie os serviços disponíveis para venda aos seus clientes.
        </p>
      </div>
      <Separator />

      <div className="flex justify-end">
        <SetServiceDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Créditos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(allServices || {}).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum serviço cadastrado
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(allServices || {}).map(([key, service]) => {
                const isDefault = key in (settings?.default?.services || {});

                return (
                  <TableRow key={key}>
                    <TableCell className="font-medium">
                      {service.name}
                      {service.description && (
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {SERVICE_CATEGORIES[service.category]?.text || service.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(service.price)}</TableCell>
                    <TableCell>
                      {service.credits ? (
                        <span>{service.credits} crédito{service.credits > 1 ? "s" : ""}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.active ? (
                        <Badge variant="default" className="bg-green-600">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
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
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingService({ service, key });
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {!isDefault && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setServiceToDelete({ key, name: service.name });
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingService && (
        <SetServiceDialog
          serviceToEdit={editingService.service}
          serviceKey={editingService.key}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setEditingService(null);
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setServiceToDelete(null);
        }}
        onConfirm={handleDeleteService}
        message="Excluir Serviço"
        description={`Tem certeza que deseja excluir "${serviceToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default ServicesSettingsTab;
