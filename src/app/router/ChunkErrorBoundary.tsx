import React from "react";

interface State {
  reloading: boolean;
  error: Error | null;
}

export class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { reloading: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error instanceof TypeError &&
      error.message.includes("Failed to fetch dynamically imported module");

    if (isChunkError && !sessionStorage.getItem("chunk-reload")) {
      sessionStorage.setItem("chunk-reload", "1");
      window.location.reload();
      return { reloading: true, error };
    }

    sessionStorage.removeItem("chunk-reload");
    return { reloading: false, error };
  }

  render() {
    if (this.state.reloading) {
      return <div className="flex h-screen items-center justify-center">Reloading...</div>;
    }
    if (this.state.error) {
      return <div className="flex h-screen items-center justify-center">Something went wrong.</div>;
    }
    return this.props.children;
  }
}
