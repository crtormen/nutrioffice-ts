import imageCompression from "browser-image-compression";
import { ref, uploadBytesResumable, deleteObject, getDownloadURL, UploadTask } from "firebase/storage";
import { storage } from "../firebaseConfig";
import { nanoid } from "nanoid";
import { useCallback } from "react";

/**
 * Custom hook for handling Firebase Storage operations in public forms
 * without requiring user authentication (anonymous uploads)
 */
export function usePublicFormStorage(token: string) {
  /**
   * Compress image before upload to reduce file size and improve upload speed
   * @param file Original file to compress
   * @returns Compressed file or original if compression fails
   */
  const compressImage = useCallback(async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 2, // Max file size after compression
      maxWidthOrHeight: 1920, // Max dimension
      useWebWorker: true, // Non-blocking compression
      fileType: "image/jpeg" as const,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      console.log(
        `Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(
          compressedFile.size /
          1024 /
          1024
        ).toFixed(2)}MB`
      );
      return compressedFile;
    } catch (error) {
      console.error("Compression error:", error);
      // Return original file if compression fails
      return file;
    }
  }, []);

  /**
   * Upload photo to temporary storage
   * @param file File to upload (should be already compressed)
   * @param position Photo position (front, back, side)
   * @returns UploadTask for progress monitoring
   */
  const uploadPhoto = useCallback((
    file: File,
    position: "front" | "back" | "side"
  ): UploadTask => {
    const fileId = nanoid();
    const fileName = `${fileId}-${position}.jpg`;
    const storageRef = ref(storage, `temp-uploads/${token}/${fileName}`);

    // Return UploadTask for progress monitoring
    return uploadBytesResumable(storageRef, file, {
      contentType: "image/jpeg",
      customMetadata: { formToken: token, position },
    });
  },
  [token]);

  /**
   * Delete photo from temporary storage
   * @param filename Filename to delete (with extension)
   */
  const deletePhoto = async (filename: string) => {
    const storageRef = ref(storage, `temp-uploads/${token}/${filename}`);
    await deleteObject(storageRef);
  };

  /**
   * Get download URL for uploaded file
   * @param filename Filename (with extension)
   * @returns Download URL
   */
  const getPhotoUrl = async (filename: string): Promise<string> => {
    const storageRef = ref(storage, `temp-uploads/${token}/${filename}`);
    return getDownloadURL(storageRef);
  };

  return { uploadPhoto, deletePhoto, getPhotoUrl, compressImage };
}
