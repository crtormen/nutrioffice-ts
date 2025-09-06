import { getDownloadURL, UploadTaskSnapshot } from "firebase/storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { IImages, ImageOptions } from "@/domain/entities";
import { useStorage } from "@/infra/firebase/hooks/useStorage";

import { useConsultaContext } from "../context/ConsultaContext";

export const useSaveImages = () => {
  const [files, setFiles] = useState<Record<ImageOptions, File[]>>({
    img_frente: [],
    img_costas: [],
    img_lado: [],
  });
  const { consulta, handleSetImages } = useConsultaContext();
  const [progress, setProgress] = useState<Record<string, number> | null>(null);
  const [images, setImages] = useState<IImages>(
    consulta.images || ({} as IImages),
  );
  const { storeFn } = useStorage();

  useEffect(() => {
    handleSetImages(images);
  }, [handleSetImages, images]);

  const handleSaveImages = useCallback(() => {
    files &&
      Object.entries(files).forEach(([key, file]) => {
        if (file.length === 0) {
          setImages((prevImages) => {
            return { ...prevImages, [key]: {} };
          });
          return;
        }
        setProgress({ ...progress, [key]: 0 });
        const uploadTask = storeFn(file[0], "image");
        uploadTask.on(
          "state_changed",
          (snap: UploadTaskSnapshot) => {
            const uploadProgress = Math.round(
              (snap.bytesTransferred / snap.totalBytes) * 100,
            );
            setProgress({
              ...progress,
              [key]: uploadProgress >= 100 ? 0 : uploadProgress,
            });
          },
          (error) => {
            toast.error(`Falha ao enviar arquivo.`);
            console.log(error);
            throw new Error("Error on upload", error);
            // reject(error);
          },
          () => {
            // COMPLETED
            getDownloadURL(uploadTask.snapshot.ref).then((url) => {
              const image = {
                url,
                path: uploadTask.snapshot.metadata.fullPath,
              };
              setImages((prevImages) => {
                return { ...prevImages, [key]: image };
              });
            });
            toast.success(`Arquivo enviado com sucesso!`);
          },
        );
      });
  }, [files, progress, storeFn]);

  const values = useMemo(
    () => ({
      handleSaveImages,
      setFiles,
      images: consulta.images,
      progress,
      files,
    }),
    [handleSaveImages, consulta.images, progress, files],
  );

  return values;
};
