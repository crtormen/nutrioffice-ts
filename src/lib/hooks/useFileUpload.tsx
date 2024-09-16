import { useEffect, useState } from "react";

import { useStorage } from "@/infra/firebase/hooks/useStorage";

const useFileUpload = ({ children, prevFiles, storeFn, deleteFn, id }) => {
  const { storeImage, storeFile } = useStorage();
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState(prevFiles || {});

  useEffect(() => setFiles(prevFiles), [prevFiles]);

  const handleDelete = (e) => {
    const name = e.target.name;
    return deleteFn(firebase, id, name);
  };

  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    const name = e.target.name;
    const task = storeFn(firebase, id, file);

    if (!file) return;

    return new Promise(function (resolve, reject) {
      task.on(
        "state_changed",
        (snap) => {
          // PROGRESS
          const progress = Math.round(
            (snap.bytesTransferred / snap.totalBytes) * 100,
          );
          setProgress(() => {
            if (progress >= 100) {
              return 0;
            } else return progress;
          });
        },
        (error) => {
          message.error(`${name} falha ao enviar arquivo.`);
          reject(error);
        },
        () => {
          // COMPLETED
          task.snapshot.ref.getDownloadURL().then((url) => {
            const image = {
              url,
              path: task.snapshot.metadata.fullPath,
            };
            const newFiles = { ...files, [name]: image };
            setFiles(newFiles);
            resolve(newFiles);
          });
          message.success(`${name} arquivo enviado com sucesso!`);
        },
      );
    });
  };

  return children(progress, files, handleUploadFile, handleDelete);
};

export default FileUploader;
