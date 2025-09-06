import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ConfirmDialogProps = {
  message: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  children?: JSX.Element;
  open?: boolean;
};

export const ConfirmDialogTrigger = AlertDialogTrigger;

export const ConfirmDialog = ({
  message,
  description,
  onConfirm,
  onCancel,
  children,
  open,
}: ConfirmDialogProps) => {
  return (
    <AlertDialog open={open}>
      {children}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{message}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
