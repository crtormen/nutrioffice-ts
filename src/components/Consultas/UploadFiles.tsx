import { CloudUpload, Paperclip } from "lucide-react";
import { DropzoneOptions } from "react-dropzone";

import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-uploader";

interface UploadFileProps {
  files: File[] | null;
  setFiles: (data: File[] | null) => void;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
}

export const UploadFiles = ({
  files,
  setFiles,
  maxFiles = 5,
  maxSize = 1024 * 1024 * 10,
  multiple = true,
}: UploadFileProps) => {
  const dropZoneConfig = {
    maxFiles,
    maxSize,
    multiple,
  } as DropzoneOptions;

  return (
    <div className="flex-1">
      <FileUploader
        value={files}
        onValueChange={setFiles}
        dropzoneOptions={dropZoneConfig}
        className="relative rounded-lg bg-background p-2"
      >
        {(!files || files.length < maxFiles) && (
          <FileInput className="outline-dashed outline-1 outline-gray-500">
            <div className="flex w-full flex-col items-center justify-center pb-4 pt-3">
              <CloudUpload className="h-4 w-4 text-gray-500 dark:text-gray-400 sm:h-8 sm:w-8" />
              <p className="mb-1 flex flex-col items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Clique para Fazer Upload</span>
                <span> ou arraste e solte aqui os arquivos</span>
              </p>
            </div>
          </FileInput>
        )}
        <FileUploaderContent>
          <div className="flex flex-col gap-1">
            {files &&
              files.length > 0 &&
              files.map((file, i) => (
                <FileUploaderItem key={i} index={i} className="flex">
                  <Paperclip className="h-4 w-4 stroke-current" />
                  <span>{file.name}</span>
                </FileUploaderItem>
              ))}
          </div>
        </FileUploaderContent>
      </FileUploader>
    </div>
  );
};
