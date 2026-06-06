import * as path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001/nutri-office/us-central1/api",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/sync": {
        target: "http://127.0.0.1:5001/nutri-office/us-central1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sync/, ""),
      },
    },
  },
});
