import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useFetchUserQuery,
  useUpdateUserMutation,
} from "@/app/state/features/userSlice";
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

import SetCollaboratorDialog from "../../components/User/SetCollaboratorDialog";

const CollaboratorsTab = () => {
  const auth = useAuth();
  const [updateUser] = useUpdateUserMutation();
  const { data: user, refetch } = useFetchUserQuery(auth.user?.uid);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [collabToEdit, setCollabToEdit] = useState<IContributor | undefined>(
    undefined,
  );
  function handleRemoveCollaborator(dataId: string) {
    if (!user?.contributors) return;

    const { [dataId]: contributor, ...contributors } = user?.contributors;
    const updatedUser = {
      contributors,
    };

    // Update user's collaborators list
    updateUser({ uid: auth.user?.uid, updateData: updatedUser }).then(() => {
      toast.success(`Colaborador ${contributor?.name} removido com sucesso.`);
      refetch();
    });
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <h2 className="space-y-4 pb-2 text-xl font-medium">Colaboradores</h2>
        <Dialog
          open={dialogOpen}
          onOpenChange={(isOpen) => {
            setDialogOpen(isOpen);
            setCollabToEdit(undefined);
          }}
        >
          <div className="py-2">
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Plus size="16" /> <span>Novo Colaborador</span>
              </Button>
            </DialogTrigger>
          </div>
          <SetCollaboratorDialog
            collaborator={collabToEdit}
            setDialogOpen={(isOpen: boolean) => {
              setDialogOpen(isOpen);
              setCollabToEdit(undefined);
            }}
          />
        </Dialog>
      </div>
      <Separator className="my-3" />

      <div className="space-y-4">
        {user?.contributors ? (
          <Table>
            <TableBody>
              {Object.entries(user?.contributors).map(
                ([key, value]) =>
                  value && (
                    <TableRow className="h-20 text-left" key={key}>
                      <TableCell>{value.name}</TableCell>
                      <TableCell className="">{value.email}</TableCell>
                      <TableCell className="">{value.phone}</TableCell>
                      <TableCell className="">
                        {ABILITIES[value.roles].text}
                      </TableCell>
                      {/* //  Object.values(value.roles).map((value, i) => {
                      //     console.log(value);
                      //     return (
                      //       <span key={i}>
                      //         {ABILITIES[value.toUpperCase()].text}
                      //       </span>
                      //     );
                      //   }) */}
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setCollabToEdit(value);
                            setDialogOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <ConfirmDialog
                          message={`Deseja excluir o colaborador ${value?.name}?`}
                          description="Essa ação não pode ser desfeita. Os dados do colaborador serão removidos da sua base de dados."
                          onConfirm={() => handleRemoveCollaborator(key)}
                        >
                          <ConfirmDialogTrigger asChild>
                            <Button variant="destructive" size="xs">
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
        ) : (
          <h4 className="text-md space-y-2 font-medium">
            Nenhum colaborador cadastrado.
          </h4>
        )}
      </div>
    </div>
  );
};
export default CollaboratorsTab;
