import { Paperclip, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";

import { useSaveFiles } from "./hooks/useSaveFiles";
import { UploadFiles } from "./UploadFiles";

export const SetFilesDrawer = () => {
  const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);
  const { handleSaveFiles, setFiles, files, progress } = useSaveFiles();

  return (
    <>
      {files && files.length > 0 && (
        <div className="flex justify-start gap-2 p-2 text-sm text-muted-foreground">
          <Paperclip className="h-4 w-4 stroke-current" />
          <span>{`${files.length} arquivo${files.length > 1 ? "s" : ""} enviado${files.length > 1 ? "s" : ""}.`}</span>
        </div>
      )}
      <Drawer
        direction="right"
        open={isDrawerOpen}
        onOpenChange={(isOpen) => setDrawerOpen(isOpen)}
      >
        <DrawerTrigger asChild>
          <Button variant="ghost">
            <Plus />
            {files && files.length > 0 ? "Editar" : "Adicionar"} Arquivos
          </Button>
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/30" />
          <DrawerContent className="fixed bottom-0 right-0 mt-24 flex h-full w-[400px] flex-col overflow-auto rounded-t-[10px] pb-4">
            <DrawerHeader className="h-1/5">
              <DrawerTitle>Adicione os arquivos do cliente</DrawerTitle>
              <DrawerDescription>Adicione até 6 arquivos</DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-grow flex-col gap-2 divide-y-2 p-4">
              <UploadFiles
                files={files}
                setFiles={(data) => data && setFiles(data)}
                maxFiles={6}
              />
              {progress > 0 && (
                <Progress value={progress} className="w-[60%]" />
              )}
            </div>
            <DrawerFooter className="h-1/5">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveFiles();
                  setDrawerOpen(false);
                }}
              >
                Salvar Arquivos
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  );
};
