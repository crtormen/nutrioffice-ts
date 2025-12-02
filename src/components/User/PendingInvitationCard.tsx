import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, X, Clock } from "lucide-react";
import { toast } from "sonner";

import {
  useRevokeInvitationMutation,
  useResendInvitationMutation,
} from "@/app/state/features/invitationsSlice";
import type { Invitation } from "@/app/services/InvitationService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ConfirmDialog,
  ConfirmDialogTrigger,
} from "@/components/ui/confirm-dialog";
import { ABILITIES } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

interface PendingInvitationCardProps {
  invitation: Invitation;
}

const PendingInvitationCard = ({ invitation }: PendingInvitationCardProps) => {
  const { dbUid } = useAuth();
  const [revokeInvitation, { isLoading: isRevoking }] =
    useRevokeInvitationMutation();
  const [resendInvitation, { isLoading: isResending }] =
    useResendInvitationMutation();

  const handleRevoke = async () => {
    if (!dbUid) return;

    try {
      await revokeInvitation({
        userId: dbUid,
        invitationId: invitation.id,
      }).unwrap();

      toast.success("Convite revogado", {
        description: `O convite para ${invitation.email} foi cancelado.`,
      });
    } catch (error: any) {
      toast.error("Erro ao revogar convite", {
        description: error.message || "Tente novamente mais tarde.",
      });
    }
  };

  const handleResend = async () => {
    if (!dbUid) return;

    try {
      await resendInvitation({
        userId: dbUid,
        invitationId: invitation.id,
      }).unwrap();

      toast.success("Convite reenviado", {
        description: `Um novo email foi enviado para ${invitation.email}`,
      });
    } catch (error: any) {
      toast.error("Erro ao reenviar convite", {
        description: error.message || "Tente novamente mais tarde.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      });
    } catch {
      return "Data inválida";
    }
  };

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const statusVariant = isExpired ? "destructive" : "secondary";
  const statusText = isExpired ? "Expirado" : "Pendente";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{invitation.email}</CardTitle>
              <Badge variant={statusVariant}>{statusText}</Badge>
            </div>
            <CardDescription className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Função:</span>
                <span>
                  {ABILITIES[invitation.role as keyof typeof ABILITIES]?.text ||
                    invitation.role}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3" />
                <span>Enviado em {formatDate(invitation.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>
                  {isExpired ? "Expirou" : "Expira"} em{" "}
                  {formatDate(invitation.expiresAt)}
                </span>
              </div>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {!isExpired && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResend}
                disabled={isResending}
              >
                <Mail className="mr-2 h-4 w-4" />
                {isResending ? "Enviando..." : "Reenviar"}
              </Button>
            )}

            <ConfirmDialog
              message={`Revogar convite para ${invitation.email}?`}
              description="Esta ação não pode ser desfeita. O link do convite será invalidado."
              onConfirm={handleRevoke}
            >
              <ConfirmDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isRevoking}
                >
                  <X className="mr-2 h-4 w-4" />
                  {isRevoking ? "Revogando..." : "Revogar"}
                </Button>
              </ConfirmDialogTrigger>
            </ConfirmDialog>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default PendingInvitationCard;
