import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  redefineCustomClaims,
  reloadDefaultSettingsToUser,
} from "@/infra/firebase";

const PreferencesTab = () => {
  async function handleResetSettings() {
    try {
      await reloadDefaultSettingsToUser();
      toast.success("Configurações redefinidas com sucesso!");
    } catch (err) {
      toast.error("Erro ao redefinir configurações!");
      console.error(err);
    }
  }

  async function handleRedefineCustomClaims() {
    try {
      const admin = await redefineCustomClaims();
      console.log(admin);
      toast.success("As Declarações de Usuário foram definidas");
    } catch (err) {
      toast.error("Erro ao redefinir Declarações de Usuário!");
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col gap-4 space-y-4">
      <h2 className="font-lg font-semibold">Preferências</h2>
      <div>
        <Button onClick={handleResetSettings} variant="ghost">
          Resetar configurações
        </Button>
      </div>
      <div>
        <Button onClick={handleRedefineCustomClaims} variant="ghost">
          Redefinir Declarações de Usuário
        </Button>
      </div>
    </div>
  );
};

export default PreferencesTab;
