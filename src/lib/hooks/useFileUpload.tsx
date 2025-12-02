import { useEffect, useState, ChangeEvent } from "react";
import { UploadTask, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";

import { useStorage } from "@/infra/firebase/hooks/useStorage";

/**
 * File metadata stored in Firestore
 */
export interface FileMetadata {
  url: string;
  path: string;
}

/**
 * Collection of files indexed by name
 */
export type FilesObject = Record<string, FileMetadata>;

/**
 * Props for useFileUpload hook
 */
interface UseFileUploadProps {
  /**
   * Render prop function that receives upload state and handlers
   */
  children: (
    progress: number,
    files: FilesObject,
    handleUploadFile: (e: ChangeEvent<HTMLInputElement>) => Promise<FilesObject | void>,
    handleDelete: (e: ChangeEvent<HTMLInputElement>) => Promise<void>
  ) => JSX.Element;
  /**
   * Previously uploaded files
   */
  prevFiles?: FilesObject;
  /**
   * Custom storage function (defaults to useStorage().storeFn)
   */
  storeFn?: (file: File, type?: "image" | "file") => UploadTask;
  /**
   * Custom delete function (defaults to useStorage().deleteFn)
   */
  deleteFn?: (name: string, type?: string) => Promise<void>;
  /**
   * Optional ID parameter (not used in current implementation, kept for compatibility)
   */
  id?: string;
}

/**
 * Hook for handling file uploads to Firebase Storage
 *
 * @example
 * ```tsx
 * <FileUpload prevFiles={customer.images}>
 *   {(progress, files, handleUpload, handleDelete) => (
 *     <div>
 *       <input type="file" name="profile" onChange={handleUpload} />
 *       {progress > 0 && <Progress value={progress} />}
 *     </div>
 *   )}
 * </FileUpload>
 * ```
 */
const useFileUpload = ({
  children,
  prevFiles,
  storeFn: customStoreFn,
  deleteFn: customDeleteFn,
}: UseFileUploadProps) => {
  const { storeFn: defaultStoreFn, deleteFn: defaultDeleteFn } = useStorage();
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<FilesObject>(prevFiles || {});

  const storeFn = customStoreFn || defaultStoreFn;
  const deleteFn = customDeleteFn || defaultDeleteFn;

  // Update files when prevFiles changes
  useEffect(() => {
    if (prevFiles) {
      setFiles(prevFiles);
    }
  }, [prevFiles]);

  /**
   * Handle file deletion
   */
  const handleDelete = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const name = e.target.name;

    if (!name) {
      toast.error("Nome do arquivo não especificado");
      return;
    }

    try {
      await deleteFn(name);

      // Remove from local state
      setFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[name];
        return newFiles;
      });

      toast.success(`${name} removido com sucesso`);
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error(`Erro ao remover ${name}`);
    }
  };

  /**
   * Handle file upload
   */
  const handleUploadFile = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<FilesObject | void> => {
    const file = e.target.files?.[0];
    const name = e.target.name;

    if (!file) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    if (!name) {
      toast.error("Nome do arquivo não especificado");
      return;
    }

    // Determine file type based on MIME type
    const fileType = file.type.startsWith("image/") ? "image" : "file";
    const task = storeFn(file, fileType);

    return new Promise<FilesObject>((resolve, reject) => {
      task.on(
        "state_changed",
        (snapshot) => {
          // Update progress
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(() => {
            if (progress >= 100) {
              return 0;
            }
            return progress;
          });
        },
        (error) => {
          // Handle error
          console.error("Upload error:", error);
          toast.error(`Falha ao enviar ${name}`);
          setProgress(0);
          reject(error);
        },
        async () => {
          // Upload completed successfully
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            const fileMetadata: FileMetadata = {
              url,
              path: task.snapshot.metadata.fullPath,
            };

            const newFiles = { ...files, [name]: fileMetadata };
            setFiles(newFiles);
            toast.success(`${name} enviado com sucesso`);
            resolve(newFiles);
          } catch (error) {
            console.error("Error getting download URL:", error);
            toast.error(`Erro ao processar ${name}`);
            reject(error);
          }
        }
      );
    });
  };

  return children(progress, files, handleUploadFile, handleDelete);
};

export default useFileUpload;
