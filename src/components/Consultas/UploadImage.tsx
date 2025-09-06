import { CloudUpload, Paperclip } from "lucide-react";
import { DropzoneOptions } from "react-dropzone";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-uploader";

interface UploadImageProps {
  image: File[] | null;
  setImage: (data: File[] | null) => void;
  text: string;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
}

export const UploadImage = ({
  image,
  setImage,
  text,
  maxFiles = 5,
  maxSize = 1024 * 1024 * 4,
  multiple = true,
}: UploadImageProps) => {
  const dropZoneConfig = {
    maxFiles,
    maxSize,
    multiple,
  } as DropzoneOptions;

  return (
    <div className="flex-1">
      <div className="mt-2 font-semibold">Foto de {text}</div>
      <FileUploader
        value={image}
        onValueChange={setImage}
        dropzoneOptions={dropZoneConfig}
        className="relative rounded-lg bg-background p-2"
      >
        {!image || image.length === 0 ? (
          <FileInput className="outline-dashed outline-1 outline-gray-500">
            <div className="flex w-full flex-col items-center justify-center pb-4 pt-3">
              <CloudUpload className="h-4 w-4 text-gray-500 dark:text-gray-400 sm:h-8 sm:w-8" />
              <p className="mb-1 flex flex-col items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Clique para Fazer Upload</span>
                <span> ou arraste e solte aqui as imagens JPG/JPEG</span>
              </p>
            </div>
          </FileInput>
        ) : (
          <FileUploaderContent>
            <div className="flex gap-1">
              <Avatar className="h-20 w-auto rounded-none">
                <AvatarImage sizes="64" src={URL.createObjectURL(image[0])} />
              </Avatar>
              <FileUploaderItem index={0} className="flex">
                <Paperclip className="h-4 w-4 stroke-current" />
                <span className="max-w-40 overflow-hidden text-ellipsis whitespace-nowrap">
                  {image[0].name}
                </span>
              </FileUploaderItem>
            </div>
          </FileUploaderContent>
        )}
      </FileUploader>
    </div>
  );
};
