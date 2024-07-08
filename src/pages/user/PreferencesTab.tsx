import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { reloadDefaultSettingsToUser } from "@/infra/firebase";

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

  return (
    <div>
      <h2>Preferências</h2>

      <Button onClick={handleResetSettings} variant="ghost">
        Resetar configurações
      </Button>
    </div>
  );
};

export default PreferencesTab;
