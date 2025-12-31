import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { usePublicFormStorage } from "@/infra/firebase/hooks/usePublicFormStorage";

import { PhotoUploadField } from "./PhotoUploadField";

interface PhotoUploadSectionProps {
  positions: string[]; // ["front", "back", "side"]
  token: string;
  onPhotosChange: (photos: {
    front?: string;
    back?: string;
    side?: string;
  }) => void;
}

const POSITION_LABELS: Record<string, string> = {
  front: "Frente",
  back: "Costas",
  side: "Lado",
};

export function PhotoUploadSection({
  positions,
  token,
  onPhotosChange,
}: PhotoUploadSectionProps) {
  const { uploadPhoto, deletePhoto, getPhotoUrl, compressImage } =
    usePublicFormStorage(token);

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [filenames, setFilenames] = useState<Record<string, string>>({});
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});
  const [compressing, setCompressing] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});

  // Notify parent whenever uploadedUrls changes
  useEffect(() => {
    onPhotosChange(uploadedUrls);
  }, [uploadedUrls, onPhotosChange]);

  const handleFileSelect = useCallback(
    async (position: string, file: File) => {
      try {
        // Update file state
        setFiles((prev) => ({ ...prev, [position]: file }));
        setCompressing((prev) => ({ ...prev, [position]: true }));

        // Compress image first
        const compressedFile = await compressImage(file);

        setCompressing((prev) => ({ ...prev, [position]: false }));
        setUploading((prev) => ({ ...prev, [position]: true }));
        setProgress((prev) => ({ ...prev, [position]: 0 }));

        // Start upload (synchronous, returns UploadTask directly)
        const uploadTask = uploadPhoto(
          compressedFile,
          position as "front" | "back" | "side",
        );

        // Store filename for later deletion (extract from storage reference)
        const filename = uploadTask.snapshot.ref.name;
        setFilenames((prev) => ({ ...prev, [position]: filename }));

        // Monitor upload progress
        uploadTask.on(
          "state_changed",
          (snapshot: any) => {
            const pct = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            );
            setProgress((prev) => ({ ...prev, [position]: pct }));
          },
          (error: any) => {
            console.error(`Upload error for ${position}:`, error);
            toast.error(`Erro ao enviar foto ${POSITION_LABELS[position]}`);
            setUploading((prev) => ({ ...prev, [position]: false }));
            setFiles((prev) => ({ ...prev, [position]: null }));
          },
          async () => {
            // Upload complete - get download URL
            try {
              const downloadURL = await getPhotoUrl(filename);
              setUploadedUrls((prev) => ({ ...prev, [position]: downloadURL }));
              setUploading((prev) => ({ ...prev, [position]: false }));
              toast.success(
                `Foto ${POSITION_LABELS[position]} enviada com sucesso!`,
              );
            } catch (error) {
              console.error(
                `Error getting download URL for ${position}:`,
                error,
              );
              toast.error(
                `Erro ao finalizar envio da foto ${POSITION_LABELS[position]}`,
              );
              setUploading((prev) => ({ ...prev, [position]: false }));
            }
          },
        );
      } catch (error) {
        console.error(`Error uploading ${position}:`, error);
        toast.error(`Erro ao processar foto ${POSITION_LABELS[position]}`);
        setCompressing((prev) => ({ ...prev, [position]: false }));
        setUploading((prev) => ({ ...prev, [position]: false }));
        setFiles((prev) => ({ ...prev, [position]: null }));
      }
    },
    [compressImage, uploadPhoto, getPhotoUrl, onPhotosChange],
  );

  const handleRemove = useCallback(
    async (position: string) => {
      try {
        const filename = filenames[position];
        if (filename) {
          await deletePhoto(filename);
        }

        // Update state
        setFiles((prev) => ({ ...prev, [position]: null }));
        setFilenames((prev) => ({ ...prev, [position]: "" }));
        setUploadedUrls((prev) => {
          const newUrls = { ...prev };
          delete newUrls[position];
          return newUrls;
        });
        setProgress((prev) => ({ ...prev, [position]: 0 }));

        toast.success(`Foto ${POSITION_LABELS[position]} removida`);
      } catch (error) {
        console.error(`Error removing ${position}:`, error);
        toast.error(`Erro ao remover foto ${POSITION_LABELS[position]}`);
      }
    },
    [filenames, deletePhoto, onPhotosChange],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {positions.map((pos) => (
        <PhotoUploadField
          key={pos}
          position={pos as "front" | "back" | "side"}
          label={POSITION_LABELS[pos]}
          file={files[pos] || null}
          uploadUrl={uploadedUrls[pos] || null}
          compressing={compressing[pos] || false}
          uploading={uploading[pos] || false}
          progress={progress[pos] || 0}
          onFileSelect={(file) => handleFileSelect(pos, file)}
          onRemove={() => handleRemove(pos)}
        />
      ))}
    </div>
  );
}
