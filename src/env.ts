import { z } from "zod";

const envSchema = z.object({
  VITE_FIREBASE_TOKEN: z.string(),
  VITE_FIREBASE_API_KEY: z.string(),
  VITE_AUTH_DOMAIN: z.string(),
  VITE_DATABASE_URL: z.string(),
  VITE_PROJECT_ID: z.string(),
  VITE_STORAGE_BUCKET: z.string(),
  VITE_MESSAGING_SENDER_ID: z.string(),
  VITE_APP_ID: z.string(),
  VITE_MEASUREMENT_ID: z.string(),
  VITE_MERCADOPAGO_ACCESS_TOKEN: z.string()
});

export const env = envSchema.parse(import.meta.env);
