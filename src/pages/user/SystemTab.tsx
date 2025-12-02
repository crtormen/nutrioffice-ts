import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InitializeAnalyticsButton } from "@/components/Admin";
import { redefineCustomClaims, useAuth } from "@/infra/firebase";

export const SystemTab = () => {
  const { refreshToken } = useAuth();

  async function handleRedefineCustomClaims() {
    try {
      const admin = await redefineCustomClaims();
      console.log(admin);

      // Refresh the user's token to get new custom claims
      await refreshToken();
      toast.success("As Declarações de Usuário foram definidas e o token foi atualizado!");
    } catch (err) {
      toast.error("Erro ao redefinir Declarações de Usuário!");
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Sistema</h3>
        <p className="text-sm text-muted-foreground">
          Configurações e ferramentas administrativas do sistema.
        </p>
      </div>

      <Separator />

      {/* Analytics Initialization */}
      <InitializeAnalyticsButton />

      <Separator />

      {/* System Maintenance Tools */}
      <div>
        <h4 className="text-base font-medium mb-4">Ferramentas de Manutenção</h4>

        <Card>
          <CardHeader>
            <CardTitle>Declarações de Usuário</CardTitle>
            <CardDescription>
              Redefinir as declarações personalizadas do Firebase Auth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRedefineCustomClaims} variant="outline">
              Redefinir Declarações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
