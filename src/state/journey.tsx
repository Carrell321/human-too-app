/**
 * Journey state for the prototype. In production this is split between the
 * server (stories, reactions, circles, connections) and the session; here it
 * lives in React state and, for convenience, the browser tab's
 * sessionStorage so a refresh doesn't lose your place. Nothing leaves the
 * device.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ArrivalState, Audience, ContentNote, ExperienceId, SectionAudience, Story, StoryPhoto, SupportPreference } from "../lib/types";
import { SAMPLE_STORIES } from "../lib/sample-data";
import type { Viewer } from "../lib/visibility";
import type { Role } from "../lib/launch";
import { signedIn } from "../lib/backend";

export interface ShareDraft {
  step: number;
  text: string;
  experiences: ExperienceId[];
  audience: Audience | null;
  circleId: string | null;
  anonymous: boolean;
  support: SupportPreference | null;
  contentNote: ContentNote | null;
  photo: StoryPhoto | null;
  photoConsent: boolean;
}
export const emptyDraft = (): ShareDraft => ({ step: 0, text: "", experiences: [], audience: null, circleId: null, anonymous: false, support: null, contentNote: null, photo: null, photoConsent: false });

export interface JourneyState {
  session: "signedOut" | "onboarding" | "member";
  mode: "signup" | "signin";
  email: string;
  displayName: string;
  confirmedAdultAt: string | null;       // the only age data kept (AC-S2-07)
  reasons: number[];
  experiences: ExperienceId[];
  somethingElse: string;
  covenant: { version: string; agreedAt: string } | null;
  profile: {
    photo: string | null;                // profile picture (data URL in the prototype)
    shortLine: string;
    learning: string;
    navigating: ExperienceId[];
    speakFrom: ExperienceId[];
    circlesShown: string[];
    audience: { navigating: SectionAudience; speakFrom: SectionAudience; learning: SectionAudience; circles: SectionAudience };
  };
  checkin: { arrival: ArrivalState | null; heavyDismissed: boolean; focus: ExperienceId | null };
  todayIds: string[] | null;
  joined: string[];
  circleInterest: string[];
  reactions: Record<string, { see?: boolean; same?: boolean }>;
  connections: string[];
  requested: string[];
  connectDismissed: string[];
  blocked: string[];
  hidden: string[];
  uncovered: string[];
  explainerSeen: boolean;
  stories: Story[];
  draft: ShareDraft;
  // HUMAN, TOO+, Pro and Corporate Plus previews. Nothing is charged.
  plus: { active: boolean; via: "self" | "organization" | null; organization: string | null };
  journal: { id: string; prompt: string; text: string; dateLabel: string }[];
  programsStarted: string[];
  sessionsReserved: string[];
  proApplication: { status: "none" | "pending" | "verified"; fullName: string; credential: string; state: string; licenseNumber: string };
  pilotRequested: boolean;
  role: Role;                          // "founder" sees after-beta features (D-33)
  asMember: boolean;                   // founder previewing the member view
}

export const initialState = (): JourneyState => ({
  session: "signedOut", mode: "signup", email: "", displayName: "", confirmedAdultAt: null,
  reasons: [], experiences: [], somethingElse: "", covenant: null,
  profile: {
    photo: null, shortLine: "", learning: "", navigating: [], speakFrom: [], circlesShown: [],
    audience: { navigating: "me", speakFrom: "me", learning: "me", circles: "me" },
  },
  checkin: { arrival: null, heavyDismissed: false, focus: null },
  todayIds: null, joined: [], circleInterest: [], reactions: {},
  connections: [], requested: [], connectDismissed: [], blocked: [], hidden: [], uncovered: [],
  explainerSeen: false,
  // Signed-in members only ever see real Stories; the samples are for the signed-out preview.
  stories: signedIn() ? [] : structuredClone(SAMPLE_STORIES),
  draft: emptyDraft(),
  plus: { active: false, via: null, organization: null },
  journal: [], programsStarted: [], sessionsReserved: [],
  proApplication: { status: "none", fullName: "", credential: "", state: "", licenseNumber: "" },
  pilotRequested: false,
  role: "member", asMember: false,
});

const KEY = "human-too-journey-v4";
function load(): JourneyState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const saved = { ...initialState(), ...JSON.parse(raw) } as JourneyState;
      if (signedIn()) saved.stories = saved.stories.filter(s => /^[0-9a-f-]{36}$/i.test(s.id));
      return saved;
    }
  } catch { /* storage unavailable: start fresh */ }
  return initialState();
}

type Updater = (s: JourneyState) => JourneyState;
interface Ctx {
  state: JourneyState;
  set: (fn: Updater) => void;
  reset: () => void;
  toast: string | null;
  say: (message: string) => void;
  sheet: SheetRequest | null;
  openSheet: (s: SheetRequest) => void;
  closeSheet: () => void;
}
export type SheetRequest =
  | { kind: "support"; lead?: string }
  | { kind: "explainer" }
  | { kind: "storyMenu"; storyId: string }
  | { kind: "report"; storyId: string }
  | { kind: "confirm"; title: string; body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; cancelLabel?: string }
  | { kind: "join"; circleId: string }
  | { kind: "reactors"; storyId: string }
  | { kind: "focus" }
  | { kind: "safety"; level: "distress" | "imminent" | "covenant"; category?: string; onShare?: () => void };

const JourneyContext = createContext<Ctx | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JourneyState>(load);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetRequest | null>(null);

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }, [state]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(t);
  }, [toast]);

  const set = useCallback((fn: Updater) => setState(fn), []);
  const reset = useCallback(() => { setState(initialState()); setSheet(null); }, []);
  const value = useMemo<Ctx>(() => ({
    state, set, reset, toast, say: setToast,
    sheet, openSheet: setSheet, closeSheet: () => setSheet(null),
  }), [state, set, reset, toast, sheet]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney(): Ctx {
  const c = useContext(JourneyContext);
  if (!c) throw new Error("useJourney must be used inside JourneyProvider");
  return c;
}

export function viewerOf(s: JourneyState): Viewer {
  return {
    id: "me",
    joinedCircles: new Set(s.joined),
    connections: new Set(s.connections),
    blocked: new Set(s.blocked),
    hiddenStories: new Set(s.hidden),
  };
}

/** The role the app should behave as right now. */
export const effectiveRole = (s: JourneyState): Role => (s.role === "founder" && !s.asMember ? "founder" : "member");

export const toggle = <T,>(list: T[], item: T): T[] => list.includes(item) ? list.filter(x => x !== item) : [...list, item];
export const storyById = (s: JourneyState, id: string) => s.stories.find(x => x.id === id);
