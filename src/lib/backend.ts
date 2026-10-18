/**
 * The app's connection to Supabase, written with plain fetch so it needs no
 * extra packages. Covers email-code sign-in, keeping you signed in, and
 * reading/saving your own profile.
 */
import { SUPABASE_URL, SUPABASE_KEY } from "./config";

export interface Session { access_token: string; refresh_token: string; expires_at: number; user: { id: string; email?: string } }
export interface ProfileRow {
  id: string; display_name: string; short_line: string | null; currently_navigating: string[]; can_speak_from: string[];
  learning: string | null; sections_open: boolean; confirmed_adult: boolean; is_founder: boolean;
}

const SKEY = "human-too-session";
let current: Session | null = null;
try { const raw = localStorage.getItem(SKEY); if (raw) current = JSON.parse(raw); } catch { /* no storage */ }
function store(s: Session | null) {
  current = s;
  try { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); } catch { /* ignore */ }
}

export class BackendError extends Error { constructor(message: string, public status = 0, public code = "") { super(message); } }

export async function call(path: string, init: RequestInit & { auth?: boolean } = {}) {
  const headers: Record<string, string> = { apikey: SUPABASE_KEY, "Content-Type": "application/json", ...(init.headers as Record<string, string> || {}) };
  if (init.auth) { const s = await session(); if (!s) throw new BackendError("Please sign in again.", 401); headers.Authorization = `Bearer ${s.access_token}`; }
  let res: Response;
  try { res = await fetch(SUPABASE_URL + path, { ...init, headers }); }
  catch { throw new BackendError("We couldn't reach HUMAN, TOO. Check your connection and try again."); }
  const text = await res.text(); let body: any = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new BackendError(body?.msg || body?.message || body?.error_description || "Something went wrong. Please try again.", res.status, body?.error_code || body?.code || "");
  return body;
}

function toSession(b: any): Session {
  return { access_token: b.access_token, refresh_token: b.refresh_token, expires_at: b.expires_at ?? Math.floor(Date.now() / 1000) + (b.expires_in ?? 3600), user: { id: b.user.id, email: b.user.email } };
}

/** Email a 6-digit sign-in code. New members are created only when allowed. */
export async function sendCode(email: string, newMember: boolean) {
  await call("/auth/v1/otp", { method: "POST", body: JSON.stringify({ email, create_user: newMember }) });
}

/** Check the code from the email. Returns the signed-in session. */
export async function verifyCode(email: string, token: string): Promise<Session> {
  const b = await call("/auth/v1/verify", { method: "POST", body: JSON.stringify({ type: "email", email, token }) });
  const s = toSession(b); store(s); return s;
}

/** The current session, refreshed if it is about to expire. */
export async function session(): Promise<Session | null> {
  if (!current) return null;
  if (current.expires_at - 60 > Date.now() / 1000) return current;
  try {
    const b = await call("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: current.refresh_token }) });
    const s = toSession(b); store(s); return s;
  } catch { store(null); return null; }
}

export async function signOut() {
  try { if (current) await call("/auth/v1/logout", { method: "POST", auth: true }); } catch { /* signed out locally anyway */ }
  store(null);
}

export async function myProfile(): Promise<ProfileRow | null> {
  const s = await session(); if (!s) return null;
  const rows = await call(`/rest/v1/profiles?id=eq.${s.user.id}&select=*`, { auth: true });
  return rows?.[0] ?? null;
}

export async function saveProfile(patch: Partial<Omit<ProfileRow, "id" | "is_founder">>) {
  const s = await session(); if (!s) throw new BackendError("Please sign in again.", 401);
  await call(`/rest/v1/profiles?id=eq.${s.user.id}`, { method: "PATCH", auth: true, headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
}

export const signedIn = () => current !== null;
