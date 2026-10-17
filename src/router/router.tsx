/**
 * A tiny client router whose API mirrors Next.js App Router
 * (`useRouter`, `usePathname`, `useParams`, `Link`), so moving the screens
 * into Next.js means changing these imports to `next/navigation` and
 * `next/link` and turning each route below into an `app/.../page.tsx`.
 *
 * It uses the URL hash (#/today) because the preview runs as a single file.
 */
import { createContext, useContext, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

function readPath(): string {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");
  return h.startsWith("/") ? h : "/";
}
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("hashchange", cb);
  return () => { listeners.delete(cb); window.removeEventListener("hashchange", cb); };
}
function emit() { listeners.forEach(l => l()); }

// History is tracked in memory: the artifact viewer's frame may not expose
// browser history reliably.
const stack: string[] = [];

function setPath(path: string, mode: "push" | "replace") {
  const current = readPath();
  if (path === current) return;
  if (mode === "push") stack.push(current);
  try { history.replaceState(null, "", "#" + path); } catch { window.location.hash = path; }
  emit();
  window.scrollTo({ top: 0 });
  document.querySelector("main")?.scrollTo?.({ top: 0 });
}

export function useRouter() {
  return {
    push: (path: string) => setPath(path, "push"),
    replace: (path: string) => setPath(path, "replace"),
    back: () => setPath(stack.pop() ?? "/", "replace"),
    /** Start a fresh history, used after sign-in and onboarding. */
    reset: (path: string) => { stack.length = 0; setPath(path, "replace"); },
  };
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, readPath, () => "/");
}

const ParamsContext = createContext<Record<string, string>>({});
export const useParams = <T extends Record<string, string>>() => useContext(ParamsContext) as T;

export interface Route { pattern: string; render: () => ReactNode }

function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split("/").filter(Boolean), a = path.split("/").filter(Boolean);
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

export function Routes({ routes, fallback }: { routes: Route[]; fallback: () => ReactNode }) {
  const path = usePathname();
  for (const r of routes) {
    const params = match(r.pattern, path);
    if (params) return <ParamsContext.Provider value={params}>{r.render()}</ParamsContext.Provider>;
  }
  return <>{fallback()}</>;
}

export function Link({ href, children, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const router = useRouter();
  return (
    <a
      href={"#" + href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => { onClick?.(e); if (!e.defaultPrevented) { e.preventDefault(); router.push(href); } }}
      {...rest}
    >
      {children}
    </a>
  );
}
