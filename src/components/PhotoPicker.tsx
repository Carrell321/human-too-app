import { useRef, useState, type ReactNode } from "react";
import { photoProblem, preparePhoto } from "../lib/media";
import { ErrorText } from "./Chrome";

/**
 * A button that opens the device's photo picker, checks the file, and hands
 * back a cleaned-up photo (metadata removed, resized, optionally squared).
 */
export function PhotoPicker({ label, className = "btn btn-secondary btn-sm", square, maxSide, maxBytes, onPick, id }: {
  label: ReactNode; className?: string; square: boolean; maxSide: number; maxBytes: number; id: string;
  onPick: (photo: { src: string; width: number; height: number }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="stack g8">
      <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={async e => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const problem = photoProblem(file, maxBytes);
        if (problem) { setError(problem); return; }
        setBusy(true); setError(null);
        try { onPick(await preparePhoto(file, { square, maxSide })); }
        catch { setError("We couldn't open that photo. Try a different one."); }
        finally { setBusy(false); }
      }} />
      <button type="button" className={className} onClick={() => input.current?.click()} disabled={busy}>{busy ? "Preparing photo…" : label}</button>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
