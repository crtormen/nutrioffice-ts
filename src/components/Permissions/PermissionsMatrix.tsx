import { Info, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useFetchPermissionsQuery,
  useResetPermissionsMutation,
  useUpdatePermissionsMutation,
} from "@/app/state/features/permissionsSlice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ABILITIES,
  Abilities,
  ACCESS_LEVELS,
  AccessLevel,
  DEFAULT_PERMISSIONS,
  Resource,
  RESOURCES,
  resources,
  RolePermissions,
} from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

interface PermissionsMatrixProps {
  professionalId?: string;
}

const PermissionsMatrix = ({ professionalId }: PermissionsMatrixProps) => {
  const { dbUid } = useAuth();
  const uid = professionalId || dbUid || "";

  const { data: permissionsConfig, isLoading } = useFetchPermissionsQuery(uid, {
    skip: !uid,
  });

  const [updatePermissions, { isLoading: isUpdating }] =
    useUpdatePermissionsMutation();
  const [resetPermissions, { isLoading: isResetting }] =
    useResetPermissionsMutation();

  // Local state for editing
  const [localPermissions, setLocalPermissions] = useState<
    Partial<Record<Abilities, RolePermissions>>
  >({});

  // Use local state if available, otherwise use fetched data
  const currentPermissions =
    Object.keys(localPermissions).length > 0
      ? localPermissions
      : permissionsConfig?.rolePermissions || {};

  const handlePermissionChange = (
    role: Abilities,
    resource: Resource,
    level: AccessLevel,
  ) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] || DEFAULT_PERMISSIONS[role]),
        [resource]: level,
      },
    }));
  };

  const handleSave = async () => {
    try {
      await updatePermissions({
        uid,
        rolePermissions: localPermissions,
      }).unwrap();

      toast.success("Permissões atualizadas com sucesso!");
      setLocalPermissions({});
    } catch (error: any) {
      toast.error("Erro ao atualizar permissões", {
        description: error.message || "Tente novamente mais tarde.",
      });
    }
  };

  const handleReset = async () => {
    try {
      await resetPermissions(uid).unwrap();
      setLocalPermissions({});
      toast.success("Permissões restauradas para o padrão!");
    } catch (error: any) {
      toast.error("Erro ao restaurar permissões", {
        description: error.message || "Tente novamente mais tarde.",
      });
    }
  };

  const hasChanges = Object.keys(localPermissions).length > 0;

  // Roles to show (exclude PROFESSIONAL as they have full access)
  const editableRoles: Abilities[] = [
    "COLLABORATOR",
    "SECRETARY",
    "MARKETING",
    "FINANCES",
    "ADMIN",
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando permissões...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Permissões por Função</CardTitle>
              <CardDescription>
                Defina o nível de acesso que cada função terá no sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isResetting || isUpdating}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar Padrão
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isUpdating}
              >
                <Save className="mr-2 h-4 w-4" />
                {isUpdating ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Níveis de acesso:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  <Badge variant="secondary">Sem acesso</Badge> - Não pode
                  visualizar ou editar
                </li>
                <li>
                  <Badge variant="secondary">Somente leitura</Badge> - Pode
                  visualizar, mas não editar
                </li>
                <li>
                  <Badge variant="secondary">Leitura e escrita</Badge> - Pode
                  visualizar, criar e editar
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Recurso</TableHead>
                  {editableRoles.map((role) => (
                    <TableHead key={role} className="min-w-[180px] text-center">
                      {ABILITIES[role].text}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{RESOURCES[resource].text}</div>
                        <div className="text-xs text-muted-foreground">
                          {RESOURCES[resource].description}
                        </div>
                      </div>
                    </TableCell>
                    {editableRoles.map((role) => {
                      const currentLevel =
                        currentPermissions[role]?.[resource] ||
                        DEFAULT_PERMISSIONS[role][resource];

                      return (
                        <TableCell
                          key={`${role}-${resource}`}
                          className="text-center"
                        >
                          <Select
                            value={currentLevel}
                            onValueChange={(value: AccessLevel) =>
                              handlePermissionChange(role, resource, value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(["none", "read", "write"] as AccessLevel[]).map(
                                (level) => (
                                  <SelectItem key={level} value={level}>
                                    <span
                                      className={ACCESS_LEVELS[level].color}
                                    >
                                      {ACCESS_LEVELS[level].text}
                                    </span>
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {hasChanges && (
            <Alert className="mt-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Você tem alterações não salvas. Clique em "Salvar Alterações"
                para aplicar.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsMatrix;
