import { InfoIcon, Mail as MailIcon, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useFetchInvitationsQuery } from "@/app/state/features/invitationsSlice";
import {
  useFetchUserQuery,
  useUpdateUserMutation,
} from "@/app/state/features/userSlice";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ConfirmDialog,
  ConfirmDialogTrigger,
} from "@/components/ui/confirm-dialog";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ABILITIES, IContributor } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

import PermissionsBadges from "../../components/Permissions/PermissionsBadges";
import InviteCollaboratorDialog from "../../components/User/InviteCollaboratorDialog";
import PendingInvitationCard from "../../components/User/PendingInvitationCard";
import SetCollaboratorDialog from "../../components/User/SetCollaboratorDialog";

const MAX_COLLABORATORS = 5;

const CollaboratorsTab = () => {
  const { dbUid, user: authUser } = useAuth();
  const [updateUser] = useUpdateUserMutation();
  const {
    data: user,
    refetch,
    isLoading: userLoading,
  } = useFetchUserQuery(dbUid, { skip: !dbUid });
  const { data: invitations = [] } = useFetchInvitationsQuery(
    { userId: dbUid || "", status: "pending" },
    { skip: !dbUid },
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [collabToEdit, setCollabToEdit] = useState<IContributor | undefined>(
    undefined,
  );

  // Check if user is PROFESSIONAL using persisted profile (fallback to auth user just in case)
  const ability =
    user?.roles?.ability ??
    (
      authUser as unknown as Record<string, unknown> & {
        roles?: { ability?: string };
      }
    )?.roles?.ability ??
    null;
  const isProfessional = ability === "PROFESSIONAL" || ability === "NUTRI";

  if (userLoading) return <LoadingSpinner />;

  if (!isProfessional) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Acesso Restrito</AlertTitle>
        <AlertDescription>
          Apenas profissionais podem gerenciar colaboradores.
        </AlertDescription>
      </Alert>
    );
  }

  const contributorsArray = user?.contributors
    ? Object.entries(user.contributors).map(([id, contributor]) => ({
        id,
        ...contributor,
      }))
    : [];

  const activeCollaboratorsCount = contributorsArray.length;
  const totalCollaboratorsCount = activeCollaboratorsCount + invitations.length;

  function handleRemoveCollaborator(dataId: string) {
    if (!user?.contributors) return;

    const { [dataId]: contributor, ...contributors } = user?.contributors;
    const updatedUser = {
      contributors,
    };

    // Update user's collaborators list
    updateUser({ uid: dbUid, updateData: updatedUser }).then(() => {
      toast.success(`Colaborador ${contributor?.name} removido com sucesso.`);
      refetch();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Colaboradores
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie sua equipe e convites pendentes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Existing Collaborator (manual) */}
          <Dialog
            open={dialogOpen}
            onOpenChange={(isOpen) => {
              setDialogOpen(isOpen);
              setCollabToEdit(undefined);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Manualmente
              </Button>
            </DialogTrigger>
            <SetCollaboratorDialog
              collaborator={collabToEdit}
              setDialogOpen={(isOpen: boolean) => {
                setDialogOpen(isOpen);
                setCollabToEdit(undefined);
              }}
            />
          </Dialog>

          {/* Invite by Email */}
          <InviteCollaboratorDialog
            collaboratorCount={totalCollaboratorsCount}
            maxCollaborators={MAX_COLLABORATORS}
          />
        </div>
      </div>

      <Separator />

      {/* Collaborator Limit Alert */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Limite de Colaboradores</AlertTitle>
        <AlertDescription>
          Você tem {activeCollaboratorsCount} colaborador
          {activeCollaboratorsCount !== 1 ? "es" : ""} ativo
          {activeCollaboratorsCount !== 1 ? "s" : ""} e {invitations.length}{" "}
          convite{invitations.length !== 1 ? "s" : ""} pendente
          {invitations.length !== 1 ? "s" : ""} ({totalCollaboratorsCount}/
          {MAX_COLLABORATORS}).
          {totalCollaboratorsCount >= MAX_COLLABORATORS &&
            " Você atingiu o limite."}
        </AlertDescription>
      </Alert>

      {/* Active Collaborators Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-medium">
            Colaboradores Ativos ({activeCollaboratorsCount})
          </h3>
        </div>

        {activeCollaboratorsCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 py-12 text-center">
            <Users className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum colaborador ativo
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Convide membros para sua equipe usando o botão acima
            </p>
          </div>
        ) : (
          <Table>
            <TableBody>
              {contributorsArray.map(
                ({ id, name, email, phone, roles }) =>
                  name && (
                    <TableRow className="h-20 text-left" key={id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{email}</TableCell>
                      <TableCell>{phone}</TableCell>
                      <TableCell>
                        {ABILITIES[roles as keyof typeof ABILITIES]?.text ||
                          roles}
                      </TableCell>
                      <TableCell>
                        <PermissionsBadges
                          role={
                            roles as
                              | "COLLABORATOR"
                              | "SECRETARY"
                              | "MARKETING"
                              | "FINANCES"
                          }
                          professionalId={dbUid}
                          compact
                        />
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (roles) {
                              setCollabToEdit({
                                name: name || "",
                                email: email || "",
                                phone: phone || "",
                                roles,
                              });
                            }
                            setDialogOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <ConfirmDialog
                          message={`Deseja excluir o colaborador ${name}?`}
                          description="Essa ação não pode ser desfeita. Os dados do colaborador serão removidos da sua base de dados."
                          onConfirm={() => handleRemoveCollaborator(id)}
                        >
                          <ConfirmDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              Excluir
                            </Button>
                          </ConfirmDialogTrigger>
                        </ConfirmDialog>
                      </TableCell>
                    </TableRow>
                  ),
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Separator />

      {/* Pending Invitations Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MailIcon className="h-5 w-5" />
          <h3 className="text-lg font-medium">
            Convites Pendentes ({invitations.length})
          </h3>
        </div>

        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 py-12 text-center">
            <MailIcon className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum convite pendente
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <PendingInvitationCard
                key={invitation.id}
                invitation={invitation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorsTab;
