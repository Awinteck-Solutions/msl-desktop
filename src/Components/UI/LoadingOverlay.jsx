import { Loader2 } from "lucide-react";

export default function LoadingOverlay({ message = "Loading…" }) {
  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-msl-bg/85 backdrop-blur-sm">
      <Loader2 className="w-8 h-8 text-brand animate-spin" strokeWidth={1.75} />
      <p className="mt-4 text-sm text-msl-muted">{message}</p>
    </div>
  );
}
