import { Camera, Loader2, X } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

interface PhotoUploadFieldProps {
  position: "front" | "back" | "side";
  label: string;
  file: File | null;
  uploadUrl: string | null;
  compressing: boolean;
  uploading: boolean;
  progress: number;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  maxSize?: number;
}

const POSITION_LABELS: Record<string, string> = {
  front: "Frente",
  back: "Costas",
  side: "Lado",
};

export function PhotoUploadField({
  position,
  label,
  file,
  uploadUrl,
  compressing,
  uploading,
  progress,
  onFileSelect,
  onRemove,
  maxSize = 5 * 1024 * 1024, // 5MB default
}: PhotoUploadFieldProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];

        // Validate file size
        if (selectedFile.size > maxSize) {
          alert(
            `Arquivo muito grande. Máximo ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
          );
          return;
        }

        // Validate file type
        if (!selectedFile.type.startsWith("image/")) {
          alert("Apenas imagens JPG/PNG são aceitas");
          return;
        }

        onFileSelect(selectedFile);
      }
    },
    [maxSize, onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const hasImage = file || uploadUrl;
  const isProcessing = compressing || uploading;

  // Show preview
  const previewUrl = file ? URL.createObjectURL(file) : uploadUrl;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label || POSITION_LABELS[position]}
        </label>
        {hasImage && !isProcessing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="mr-1 h-3 w-3" />
            Remover
          </Button>
        )}
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors",
          isDragActive && "border-primary bg-primary/5",
          !hasImage && "hover:border-primary/50",
          hasImage && "border-solid",
          isProcessing && "pointer-events-none opacity-70",
        )}
      >
        <input {...getInputProps()} disabled={isProcessing} />

        {isProcessing ? (
          <div className="flex w-full flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {compressing ? "Comprimindo..." : `Enviando... ${progress}%`}
            </p>
            {uploading && <Progress value={progress} className="w-full" />}
          </div>
        ) : hasImage && previewUrl ? (
          <div className="relative aspect-video w-full">
            <img
              src={previewUrl}
              alt={`Foto ${label}`}
              className="h-full w-full rounded object-cover"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <Camera className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? "Solte a foto aqui"
                  : "Clique ou arraste uma foto"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG (máx. 4MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
