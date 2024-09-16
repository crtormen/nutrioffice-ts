import { Plus } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
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

import { useSaveImages } from "./hooks/useSaveImages";
import { UploadImage } from "./UploadImage";

export const SetImagesDrawer = () => {
  const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);

  const { handleSaveImages, setFiles, images, progress, files } =
    useSaveImages();

  const imagesExists =
    images &&
    Object.keys(images).length > 0 &&
    (Object.keys(images.img_costas).length > 0 ||
      Object.keys(images.img_frente).length > 0 ||
      Object.keys(images.img_lado).length > 0);

  return (
    <>
      {imagesExists && (
        <div className="flex justify-start gap-2 p-2">
          {Object.entries(images).map(
            ([, image], i) =>
              image.url && (
                <div key={i} className="border border-dotted border-gray-400">
                  <Avatar className="h-20 w-auto rounded-none p-1">
                    <AvatarImage src={image.url} />
                  </Avatar>
                </div>
              ),
          )}
        </div>
      )}
      <Drawer
        direction="right"
        open={isDrawerOpen}
        onOpenChange={(isOpen) => {
          setDrawerOpen(isOpen);
          // setCollabToEdit(undefined);
        }}
      >
        <DrawerTrigger asChild>
          <Button variant="ghost">
            <Plus />
            {imagesExists ? "Editar" : "Adicionar"} Fotos
          </Button>
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/30" />
          <DrawerContent className="fixed bottom-0 right-0 mt-24 flex h-full w-[400px] flex-col overflow-auto rounded-t-[10px] pb-4">
            <DrawerHeader className="h-1/5">
              <DrawerTitle>Adicione as fotos do cliente</DrawerTitle>
              <DrawerDescription>
                Adicione 3 imagens. Atenção para a correta correspondência de
                imagens Frente, Lado e Costas
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-grow flex-col gap-2 divide-y-2 p-4">
              <UploadImage
                image={files.img_frente}
                setImage={(data) => {
                  data &&
                    setFiles((files) => ({
                      ...files,
                      img_frente: data[0] ? new Array(data[0]) : [],
                    }));
                }}
                maxFiles={1}
                text="Frente"
              />
              {progress && progress.img_frente > 0 && (
                <Progress value={progress.img_frente} className="w-[60%]" />
              )}
              <UploadImage
                image={files.img_lado}
                setImage={(data) => {
                  data &&
                    setFiles((files) => {
                      return {
                        ...files,
                        img_lado: data[0] ? new Array(data[0]) : [],
                      };
                    });
                }}
                maxFiles={1}
                text="Lado"
              />
              {progress && progress.img_lado > 0 && (
                <Progress value={progress.img_lado} className="w-[60%]" />
              )}
              <UploadImage
                image={files.img_costas}
                setImage={(data) => {
                  data &&
                    setFiles((files) => ({
                      ...files,
                      img_costas: data[0] ? new Array(data[0]) : [],
                    }));
                }}
                maxFiles={1}
                text="Costas"
              />
              {progress && progress.img_costas > 0 && (
                <Progress value={progress.img_costas} className="w-[60%]" />
              )}
            </div>
            <DrawerFooter className="h-1/5">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveImages();
                  setDrawerOpen(false);
                }}
              >
                Salvar Imagens
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
