import { Loader2 } from "lucide-react";

export const LoadingSpinner = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-2">
    <Loader2 className="size-12 animate-spin text-zinc-500" />
    <div className="font-semibold">Carregando...</div>
  </div>
);