import { useState } from "react";
import { Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initializeUserSettings } from "@/app/services/UserSettingsService";
import { toast } from "sonner";

interface InitializeUserSettingsButtonProps {
  userId?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Componente de botão para inicializar configurações de um usuário
 * Pode ser usado:
 * - Sem prop userId: inicializa configurações do usuário logado atual
 * - Com prop userId: inicializa configurações para usuário especificado (apenas admin)
 */
export function InitializeUserSettingsButton({
  userId,
  variant = "outline",
  size = "sm",
}: InitializeUserSettingsButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const result = await initializeUserSettings(userId);

      toast.success(
        result.created
          ? "Configurações inicializadas com sucesso!"
          : "Configurações atualizadas com sucesso!",
        {
          description: `
            Usuário: ${result.userId}
            Função: ${result.role}
            Tipo de configuração: ${result.settingsType}
            Campos de anamnese: ${result.fieldsCount}
          `,
        }
      );
    } catch (error: any) {
      console.error("Erro ao inicializar configurações:", error);
      toast.error("Falha ao inicializar configurações", {
        description: error.message || "Ocorreu um erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInitialize}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Inicializando...
        </>
      ) : (
        <>
          <Settings className="mr-2 h-4 w-4" />
          Inicializar Configurações
        </>
      )}
    </Button>
  );
}
