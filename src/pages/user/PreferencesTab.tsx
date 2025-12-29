import { toast } from "sonner";

import PermissionsMatrix from "@/components/Permissions/PermissionsMatrix";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { reloadDefaultSettingsToUser, useAuth } from "@/infra/firebase";
import { InitializeUserSettingsButton } from "@/components/Admin/InitializeUserSettingsButton";

const PreferencesTab = () => {
  const { dbUid } = useAuth();

  async function handleResetSettings() {
    try {
      await reloadDefaultSettingsToUser();
      toast.success("Configurações redefinidas com sucesso!");
    } catch (err) {
      toast.error("Erro ao redefinir configurações!");
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col gap-6 space-y-6">
      {/* Permissions Management Section */}
      <div>
        <h2 className="mb-2 text-2xl font-bold">Permissões</h2>
        <p className="mb-6 text-muted-foreground">
          Configure os níveis de acesso para cada função no sistema
        </p>
        <PermissionsMatrix />
      </div>

      <Separator />

      {/* User Settings Section */}
      <div>
        <h2 className="mb-2 text-2xl font-bold">Configurações de Usuário</h2>
        <p className="mb-6 text-muted-foreground">
          Gerenciar suas preferências e configurações pessoais
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Resetar Configurações</CardTitle>
            <CardDescription>
              Restaurar todas as configurações para os valores padrão
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <Button onClick={handleResetSettings} variant="outline">
              Resetar Configurações
            </Button> */}
            <InitializeUserSettingsButton userId={dbUid} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreferencesTab;
