import { getDownloadURL, UploadTaskSnapshot } from "firebase/storage";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useStorage } from "@/infra/firebase/hooks/useStorage";

import { useConsultaContext } from "../context/ConsultaContext";

export const useSaveFiles = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { consulta, handleSetAnexos } = useConsultaContext();
  const [progress, setProgress] = useState<number>(0);
  const { storeFn } = useStorage();

  const handleSaveFiles = useCallback(() => {
    files &&
      files.forEach((file) => {
        if (!file) return;
        setProgress(0);
        const uploadTask = storeFn(file, "file");
        uploadTask.on(
          "state_changed",
          (snap: UploadTaskSnapshot) => {
            const uploadProgress = Math.round(
              (snap.bytesTransferred / snap.totalBytes) * 100,
            );
            setProgress(uploadProgress >= 100 ? 0 : uploadProgress);
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
              const file = {
                url,
                path: uploadTask.snapshot.metadata.fullPath,
              };
              const anexos = consulta.anexos;
              if (anexos) handleSetAnexos([...anexos, file]);
            });
            toast.success(`Arquivo enviado com sucesso!`);
          },
        );
      });
  }, [files, storeFn, consulta.anexos, handleSetAnexos]);

  const values = useMemo(
    () => ({
      handleSaveFiles,
      setFiles,
      files,
      anexos: consulta.anexos,
      progress,
    }),
    [handleSaveFiles, files, consulta.anexos, progress],
  );

  return values;
};
