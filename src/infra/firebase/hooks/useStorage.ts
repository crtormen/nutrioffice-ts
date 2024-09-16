import { deleteObject, ref, uploadBytesResumable } from "firebase/storage";
import { nanoid } from "nanoid";
import { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";

import { storage } from "../firebaseConfig";
import { useAuth } from "./useAuth";

const imageMetadata = {
  contentType: "image/jpeg",
};

export const useStorage = () => {
  const { user } = useAuth();
  const { customerId } = useParams();

  const rootImagesRef = ref(storage, `images/${user?.uid}/`);
  const rootFilesRef = ref(storage, `files/${user?.uid}/`);

  const storeFn = useCallback(
    (file: File, type?: "image" | "file") => {
      const id = nanoid();
      let uploadTask;

      if (type === "image") {
        const fileRef = ref(rootImagesRef, `${customerId}/${id}`);
        uploadTask = uploadBytesResumable(fileRef, file, imageMetadata);
      } else {
        const fileRef = ref(rootFilesRef, `${customerId}/${id}`);
        uploadTask = uploadBytesResumable(fileRef, file);
      }
      return uploadTask;
    },
    [customerId, rootFilesRef, rootImagesRef],
  );

  const deleteFn = useCallback(
    (name: string, type?: string) => {
      let fileRef;
      if (type === "image") {
        fileRef = ref(rootImagesRef, `${customerId}/${name}`);
      } else {
        fileRef = ref(rootFilesRef, `${customerId}/${name}`);
      }
      const deleteTask = deleteObject(fileRef);

      return deleteTask;
    },
    [customerId, rootFilesRef, rootImagesRef],
  );

  const values = useMemo(
    () => ({
      storeFn,
      deleteFn,
    }),
    [storeFn, deleteFn],
  );

  return values;
};
