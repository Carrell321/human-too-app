/**
 * Launch phase rules (D-33, 2026-09-26).
 *
 * During beta, Plus, Pro, Corporate Plus and the professional directory are
 * not open to members. The founder and team see them inside the app
 * ("founder view") for demos and review. Corporate Plus and early Pro
 * applications are public pages so organizations can request pilots and
 * professionals can apply before the directory opens.
 */
export type Role = "member" | "founder";
export type Phase = "beta" | "after-beta";

export const CURRENT_PHASE: Phase = "beta";

/** Routes members can't open during beta. The founder view can. */
const AFTER_BETA_FOR_MEMBERS = [/^\/resources$/, /^\/plus(\/.*)?$/, /^\/professionals(\/.*)?$/];

/** Pages anyone can open during beta, signed in or not. */
export const PUBLIC_DURING_BETA = [/^\/organizations$/, /^\/pro$/, /^\/pro\/apply$/];

export function canOpen(path: string, role: Role, phase: Phase = CURRENT_PHASE): boolean {
  if (phase === "after-beta" || role === "founder") return true;
  return !AFTER_BETA_FOR_MEMBERS.some(r => r.test(path));
}

/** Whether after-beta features appear in menus, links and the Support sheet. */
export const showsAfterBeta = (role: Role, phase: Phase = CURRENT_PHASE) => phase === "after-beta" || role === "founder";
