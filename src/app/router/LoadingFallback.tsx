import React from "react";

export const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">Loading...</div>
);

// Wraps React.lazy imports to handle stale deployment chunk 404s by reloading once.
export const lazyWithReload = (
  factory: () => Promise<{ default: React.ComponentType }>,
) => {
  return React.lazy(() =>
    factory().catch((error) => {
      if (error instanceof TypeError && !sessionStorage.getItem("chunk-reload")) {
        sessionStorage.setItem("chunk-reload", "1");
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem("chunk-reload");
      throw error;
    }),
  );
};
