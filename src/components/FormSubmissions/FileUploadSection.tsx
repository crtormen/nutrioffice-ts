import { FileText, Loader2, Paperclip, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { usePublicFormStorage } from "@/infra/firebase/hooks/usePublicFormStorage";

interface UploadedFile {
  filename: string;
  originalName: string;
  url: string;
  size: number;
}

interface FileUploadSectionProps {
  token: string;
  onFilesChange: (files: UploadedFile[]) => void;
}

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadSection({ token, onFilesChange }: FileUploadSectionProps) {
  const { uploadFile, deletePhoto, getPhotoUrl } = usePublicFormStorage(token);
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [dragOver, setDragOver] = useState(false);

  const processFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`Tipo não permitido: ${file.name}. Use PDF, imagem, DOC ou DOCX.`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name} excede ${MAX_FILE_SIZE_MB} MB.`);
          continue;
        }

        const tempKey = `${file.name}-${Date.now()}`;
        setUploading((prev) => ({ ...prev, [tempKey]: 0 }));

        const { task, filename } = uploadFile(file);

        task.on(
          "state_changed",
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploading((prev) => ({ ...prev, [tempKey]: pct }));
          },
          (error) => {
            console.error("Upload error:", error);
            toast.error(`Erro ao enviar ${file.name}`);
            setUploading((prev) => {
              const next = { ...prev };
              delete next[tempKey];
              return next;
            });
          },
          async () => {
            try {
              const url = await getPhotoUrl(`attachments/${filename}`);
              const entry: UploadedFile = {
                filename,
                originalName: file.name,
                url,
                size: file.size,
              };
              setUploadedFiles((prev) => {
                const next = [...prev, entry];
                onFilesChange(next);
                return next;
              });
              toast.success(`${file.name} enviado com sucesso!`);
            } catch (e) {
              toast.error(`Erro ao finalizar envio de ${file.name}`);
            } finally {
              setUploading((prev) => {
                const next = { ...prev };
                delete next[tempKey];
                return next;
              });
            }
          },
        );
      }
    },
    [uploadFile, getPhotoUrl, onFilesChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
  };

  const handleRemove = async (file: UploadedFile) => {
    try {
      await deletePhoto(`attachments/${file.filename}`);
    } catch {
      // Ignore — file may already be gone
    }
    setUploadedFiles((prev) => {
      const next = prev.filter((f) => f.filename !== file.filename);
      onFilesChange(next);
      return next;
    });
    toast.success(`${file.originalName} removido`);
  };

  const isUploading = Object.keys(uploading).length > 0;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-input bg-transparent hover:border-primary hover:bg-primary/5"
        }`}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Clique ou arraste arquivos aqui</p>
        <p className="text-xs text-muted-foreground">
          PDF, imagem, DOC ou DOCX — máx. {MAX_FILE_SIZE_MB} MB por arquivo
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Uploading progress */}
      {Object.entries(uploading).map(([key, pct]) => (
        <div key={key} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{pct}%</p>
          </div>
        </div>
      ))}

      {/* Uploaded files list */}
      {uploadedFiles.map((file) => (
        <div key={file.filename} className="flex items-center gap-3 rounded-lg border bg-background p-3">
          <FileText className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.originalName}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => handleRemove(file)}
            className="text-destructive hover:text-destructive/80 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {uploadedFiles.length === 0 && !isUploading && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip size={12} />
          Nenhum arquivo enviado ainda
        </p>
      )}
    </div>
  );
}
