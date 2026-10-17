/**
 * Visibility and ordering rules. In production these run on the server
 * (and again as database row-level security); here they run in the browser
 * so the prototype behaves exactly as specified. Keep them pure so they can
 * move to the server unchanged.
 */
import type { ExperienceId, SectionAudience, Story } from "./types";

export interface Viewer {
  id: string;                       // "me"
  joinedCircles: ReadonlySet<string>;
  connections: ReadonlySet<string>;
  blocked: ReadonlySet<string>;     // either direction
  hiddenStories: ReadonlySet<string>;
}

/** AC-S7-01: who may open a Story. */
export function canSee(story: Story, viewer: Viewer): boolean {
  if (story.deleted) return false;
  if (story.authorId === viewer.id) return true;
  if (viewer.blocked.has(story.authorId)) return false;
  switch (story.audience) {
    case "open": return true;
    case "circle": return !!story.circleId && viewer.joinedCircles.has(story.circleId);
    case "people": return viewer.connections.has(story.authorId);
  }
}

export type ReplyState =
  | { kind: "open" }
  | { kind: "listen" }           // D-5 Just listen
  | { kind: "off" }              // author closed replies
  | { kind: "own" };             // viewer is the author

/** AC-S7-05: whether the viewer can reply. Enforced on the server in production. */
export function replyState(story: Story, viewerId: string): ReplyState {
  if (story.support === "listen") return { kind: "listen" };
  if (story.repliesOff) return { kind: "off" };
  if (story.authorId === viewerId) return { kind: "own" };
  return { kind: "open" };
}

/** AC-S7-08: anonymous replies only on Circle Stories. */
export const canReplyAnonymously = (story: Story) => story.audience === "circle";

/** D-1: anonymous is only allowed with Open or Circle audiences. */
export const anonymousAllowed = (audience: Story["audience"] | null) => audience === "open" || audience === "circle";

export interface TodayInput {
  stories: readonly Story[];
  viewer: Viewer;
  currentExperiences: readonly ExperienceId[];
  focus: ExperienceId | null;
  reacted: ReadonlySet<string>;
  heavy: boolean;
}

/**
 * S6c ordering. No engagement signals are used (AC-S6-07):
 * focus Experience first, then other current Experiences, then the member's
 * Circles, then everything else they may see; newest first within each group;
 * at most 2 Stories per author (AC-S6-05); 10 Stories, or 5 on a Heavy day.
 */
export function todayFeed({ stories, viewer, currentExperiences, focus, reacted, heavy }: TodayInput): Story[] {
  const cap = heavy ? 5 : 10;
  const eligible = stories
    .filter(s => canSee(s, viewer) && s.authorId !== viewer.id && !viewer.hiddenStories.has(s.id) && !reacted.has(s.id))
    .sort((a, b) => b.postedOrder - a.postedOrder);
  const rank = (s: Story) =>
    focus && s.experiences.includes(focus) ? 0
    : s.experiences.some(e => currentExperiences.includes(e)) ? 1
    : s.audience === "circle" && s.circleId && viewer.joinedCircles.has(s.circleId) ? 2
    : 3;
  const ordered = [...eligible].sort((a, b) => rank(a) - rank(b) || b.postedOrder - a.postedOrder);
  const perAuthor = new Map<string, number>();
  const out: Story[] = [];
  for (const s of ordered) {
    const n = (perAuthor.get(s.authorId) ?? 0) + 1;
    perAuthor.set(s.authorId, n);
    if (n <= 2) out.push(s);
    if (out.length === cap) break;
  }
  return out;
}

/** S11: whether a profile section is shown to a given viewer relationship. */
export function sectionVisibleTo(audience: SectionAudience, relationship: "self" | "member" | "connection"): boolean {
  if (relationship === "self") return true;
  if (relationship === "connection") return audience === "all" || audience === "people";
  return audience === "all";
}

/** AC-S9-04 */
export const roundToTen = (n: number) => Math.round(n / 10) * 10;

/** AC-S10-09: an audience change may only narrow who sees a Story. */
export function canNarrowTo(from: Story["audience"], to: Story["audience"]): boolean {
  return from === "open" && (to === "circle" || to === "people");
}
