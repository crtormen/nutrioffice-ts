/**
 * Legacy cloud functions from the previous version of NutriOffice
 * Migrated to Firebase Functions v2 for better performance and features
 */

import * as logger from "firebase-functions/logger";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { Storage } from "@google-cloud/storage";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { db } from "./firebase-admin.js";

// Runtime options for v2 functions
const v2RuntimeOpts = {
  timeoutSeconds: 300,
  memory: "2GiB" as const,
};

interface CustomerData {
  name?: string;
  cpf?: string;
  email?: string;
  address?: any;
  createdAt?: Timestamp | string;
  birthday?: Timestamp | string;
}

interface ConsultaData {
  date: Timestamp;
  customer_id: string;
}

interface FinanceData {
  date: Timestamp;
  customer_id: string;
}

interface PdfData {
  name?: string;
  cpf?: string;
  address?: any;
  email?: string;
  date: string;
}

interface Schema {
  [key: string]: Schema;
}

const schema: Schema = {
  customers: {
    consultas: {},
    finances: {},
    goals: {},
    anamnesis: {},
  },
  finances: {},
  consultas: {},
};

/**
 * Get customers who had consultations in a specific month
 */
export const getMonthCustomers = onCall(v2RuntimeOpts, async (request) => {
  const { month, year } = request.data as { month: number; year: number };
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const consultasRef = db
    .collection("users")
    .doc(uid)
    .collection("consultas");
  const customersRef = db
    .collection("users")
    .doc(uid)
    .collection("customers");

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  logger.info(`OBTENDO CONSULTAS DO PERÍODO: ${Number(month) + 1}/${year}`);

  const snapshot = await consultasRef
    .where("date", ">", start)
    .where("date", "<", end)
    .get();

  const customersIds: Array<{ date: string; customer_id: string }> = [];

  snapshot.forEach((doc) => {
    const consulta = doc.data() as ConsultaData;
    const { date, customer_id } = consulta;
    const milliseconds = date.seconds * 1000;
    const jsDate = new Date(milliseconds);

    // Format date as DD/MM/YYYY
    const formattedDate = `${jsDate.getDate().toString().padStart(2, '0')}/${(jsDate.getMonth() + 1).toString().padStart(2, '0')}/${jsDate.getFullYear()}`;

    customersIds.push({
      date: formattedDate,
      customer_id,
    });
  });

  const customers = await Promise.all(
    customersIds.map(async ({ date, customer_id }) => {
      const childSnap = await customersRef.doc(customer_id).get();

      if (!childSnap.exists) return null;

      const customer = childSnap.data() as CustomerData;
      const { name, cpf, address, email } = customer;

      const pdfData: PdfData = {
        name,
        cpf,
        address,
        email,
        date,
      };

      return pdfData;
    })
  );

  return { customers: customers.filter(c => c !== null) };
});

/**
 * Get finances (payments) from a specific month
 */
export const getMonthFinances = onCall(v2RuntimeOpts, async (request) => {
  const { month, year } = request.data as { month: number; year: number };
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const financesRef = db
    .collection("users")
    .doc(uid)
    .collection("finances");
  const customersRef = db
    .collection("users")
    .doc(uid)
    .collection("customers");

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  logger.info(`OBTENDO PAGAMENTOS DO PERÍODO: ${Number(month) + 1}/${year}`);

  const snapshot = await financesRef
    .where("date", ">", start)
    .where("date", "<", end)
    .get();

  const customersIds: Array<{ date: string; customer_id: string }> = [];

  snapshot.forEach((doc) => {
    const finance = doc.data() as FinanceData;
    const { date, customer_id } = finance;
    const milliseconds = date.seconds * 1000;
    const jsDate = new Date(milliseconds);

    // Format date as DD/MM/YYYY
    const formattedDate = `${jsDate.getDate().toString().padStart(2, '0')}/${(jsDate.getMonth() + 1).toString().padStart(2, '0')}/${jsDate.getFullYear()}`;

    customersIds.push({
      date: formattedDate,
      customer_id,
    });
  });

  const customers = await Promise.all(
    customersIds.map(async ({ date, customer_id }) => {
      const childSnap = await customersRef.doc(customer_id).get();

      if (!childSnap.exists) return null;

      const customer = childSnap.data() as CustomerData;
      const { name, cpf, address, email } = customer;

      const pdfData: PdfData = {
        name,
        cpf,
        address,
        email,
        date,
      };

      return pdfData;
    })
  );

  return { customers: customers.filter(c => c !== null) };
});

/**
 * Function to fix dates from string to JavaScript Date object
 * DEPRECATED: This was a one-time migration function
 */
export const fixDates = onCall(v2RuntimeOpts, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const customersRef = db
    .collection("users")
    .doc(uid)
    .collection("customers");

  const snapshot = await customersRef.orderBy("createdAt", "desc").get();

  const updates: Promise<void>[] = [];

  snapshot.forEach((doc) => {
    const id = doc.id;
    const customer = doc.data() as CustomerData;

    if (typeof customer.createdAt !== "string") {
      logger.info("ITS A TIMESTAMP ALREADY");
      return;
    }

    // Parse DD/MM/YYYY format to Date
    const parseDate = (dateStr: string): Date => {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    };

    const createdAt = customer.createdAt ? parseDate(customer.createdAt as string) : null;
    const birthday = customer.birthday ? parseDate(customer.birthday as string) : null;

    const updatePromise = doc.ref
      .set({ createdAt, birthday }, { merge: true })
      .then(() =>
        logger.info(
          "Updated customer ",
          id,
          ":",
          customer.createdAt,
          "→",
          createdAt,
          customer.birthday,
          "→",
          birthday
        )
      );

    updates.push(updatePromise);
  });

  await Promise.all(updates);

  logger.info("FINALIZADO");
  return { result: "TUDO OK" };
});

/**
 * Image processing function - Resize, rotate and rename consultation images
 *
 * Automatically processes images when a consulta document is created or updated.
 * Uses Sharp for high-performance image processing:
 * - Resizes images to max 1080px width (maintains aspect ratio)
 * - Auto-rotates based on EXIF orientation data
 * - Converts to JPEG format with 80% quality
 * - Generates optimized thumbnails for storage efficiency
 *
 * Sharp is a production-grade image processing library that's 4-5x faster than alternatives.
 */
export const onCreateConsulta = onDocumentWritten(
  {
    document: "users/{userId}/customers/{customerId}/consultas/{consultaId}",
    ...v2RuntimeOpts,
  },
  async (event) => {
    const JPEG_EXTENSION = ".jpg";

    if (!event.data?.after.exists) {
      logger.info("Consulta removed");
      return null;
    }

    const consulta = event.data.after.data();
    const images = consulta?.images as Record<string, { path: string; url?: string }> || {};
    let oldImages: Record<string, { path: string; url?: string }> | null = null;
    let newImages: Record<string, { path: string; url?: string }> = {};

    if (Object.keys(images).length === 0) {
      logger.info("No images defined");
      return null;
    }

    if (event.data.before.exists) {
      oldImages = event.data.before.data()?.images as Record<string, { path: string; url?: string }> || null;
      if (JSON.stringify(oldImages) === JSON.stringify(images)) {
        logger.info("Images didn't change");
        return null;
      }
    }

    const gcs = new Storage();
    const bucket = gcs.bucket("nutri-office.appspot.com");

    const results = await Promise.all(
      Object.entries(images).map(async ([key, value]) => {
        // If image didn't change, return the same image data with no treatment
        if (
          oldImages &&
          JSON.stringify(oldImages[key]) === JSON.stringify(images[key])
        ) {
          return null;
        }

        const filePath = value.path;
        const baseFileName = path.basename(filePath, path.extname(filePath));
        const fileDir = path.dirname(filePath);
        const JPEGFilePath = path.normalize(
          path.format({
            dir: fileDir,
            name: "resized" + baseFileName,
            ext: JPEG_EXTENSION,
          })
        );
        const tmpFilePath = path.join(os.tmpdir(), baseFileName);

        if (baseFileName.startsWith("resized")) return null;

        logger.info(
          "Changing image file. Function execution started. File: ",
          key
        );

        const file = bucket.file(filePath);
        const uuid = uuidv4();

        await file.download({
          destination: tmpFilePath,
        });

        logger.info("Start image treatment...");

        try {
          // Use Sharp for high-performance image processing
          await sharp(tmpFilePath)
            .resize(1080, null, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .rotate() // Auto-rotate based on EXIF orientation
            .jpeg({ quality: 80 })
            .toFile(tmpFilePath + '.processed');

          // Replace original with processed
          fs.unlinkSync(tmpFilePath);
          fs.renameSync(tmpFilePath + '.processed', tmpFilePath);

          logger.info("Transformed image: ", filePath);
        } catch (err) {
          logger.error("Aborting image transformation for: ", key, err);
          return null;
        }

        logger.info("Upload image to ", JPEGFilePath);

        const [fileUploaded] = await bucket.upload(tmpFilePath, {
          destination: JPEGFilePath,
          metadata: {
            contentType: "image/jpeg",
            metadata: {
              firebaseStorageDownloadTokens: uuid,
            },
          },
        });

        const url =
          "https://firebasestorage.googleapis.com/v0/b/" +
          bucket.name +
          "/o/" +
          encodeURIComponent(fileUploaded.name) +
          "?alt=media&token=" +
          uuid;

        newImages = {
          ...newImages,
          [key]: {
            path: JPEGFilePath,
            url,
          },
        };

        fs.unlinkSync(tmpFilePath);
        await bucket.file(filePath).delete();

        return {
          url,
          path: JPEGFilePath,
        };
      })
    );

    const checkUpdates = results.filter((value) => value !== null);
    if (checkUpdates.length === 0) return null;

    const resultImages = { ...images, ...newImages };

    await event.data!.after.ref.set({ images: resultImages }, { merge: true });
    logger.info("Images were set in database");

    return null;
  }
);

/**
 * Recursive function to copy Firestore data between users
 * Used for database migration/backup
 */
const copy = async (
  srcPath: string,
  destPath: string,
  schm: Schema
): Promise<void> => {
  await Promise.all(
    Object.keys(schm).map(async (collection) => {
      logger.info(collection);

      const srcCollectionRef = db.collection(`${srcPath}/${collection}`);
      const srcData = await srcCollectionRef.get();

      const promises: Promise<void>[] = [];

      srcData.forEach((doc) => {
        const childData = doc.data();
        logger.info(doc.id);

        const promise = db
          .collection(`${destPath}/${collection}`)
          .doc(doc.id)
          .set(childData)
          .then(async () => {
            await copy(
              `${srcPath}/${collection}/${doc.id}`,
              `${destPath}/${collection}/${doc.id}`,
              schm[collection]
            );
          });

        promises.push(promise);
      });

      await Promise.all(promises);
    })
  );
};

/**
 * Copy entire database from one user to another
 * DEPRECATED: Hardcoded UIDs, use with caution
 */
export const copyDB = onCall(v2RuntimeOpts, async (_request) => {
  const source = "60NeiZhw68cGEsbDASQEQDR6PoN2";
  const dest = "1CI50RF9pmZrHsId1uNuJiTknQZ2";

  await copy(`users/${source}`, `users/${dest}`, schema);

  logger.info("FINALIZADO");
  return { result: "OK" };
});

/**
 * Get all customer emails
 */
export const getCustomersEmail = onCall(v2RuntimeOpts, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const customersRef = db
    .collection("users")
    .doc(uid)
    .collection("customers");

  logger.info(`OBTENDO EMAILS DOS PACIENTES`);

  const snapshot = await customersRef.get();

  const customers = snapshot.docs.map((doc) => {
    const customer = doc.data() as CustomerData;
    const { name, email } = customer;

    return {
      name,
      email,
    };
  });

  return { customers };
});
