/**
 * Real community data: Stories, I See You / Same Here, replies, Circles,
 * blocks and reports, stored in Supabase. The privacy rules live in the
 * database (supabase/migrations/002_stories.sql); this file only moves data
 * between the database and the app's state.
 *
 * In the app, the signed-in member is always "me". Other members are their
 * account id, and anonymous authors are "anon:<story or reply id>" so they
 * can never be linked to an account.
 */
import { call, signedIn } from "./backend";
import { MEMBERS } from "./sample-data";
import type { Audience, ContentNote, ExperienceId, Reply, Story, SupportPreference } from "./types";

/** True once the member is signed in for real: everything they do is saved. */
export const live = () => signedIn();

/** Who reacted to the signed-in member's own Stories. Only the author ever sees this. */
export const SIMULATED_REACTIONS: Record<string, [string, "see" | "same"][]> = {};

export function newId(): string {
  try { return crypto.randomUUID(); } catch { /* older browsers */ }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ (Math.random() * 16) >> (+c / 4)).toString(16));
}

export function timeLabel(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface StoryRow {
  id: string; author_id: string | null; author_name: string | null; is_mine: boolean; anonymous: boolean;
  experiences: string[]; audience: Audience; circle_id: string | null; support: SupportPreference;
  content_note: ContentNote | null; body: string; replies_off: boolean; flagged_urgent: boolean; created_at: string;
}
interface ReplyRow {
  id: string; parent_id: string | null; author_id: string | null; author_name: string | null; is_mine: boolean;
  anonymous: boolean; body: string; held_for_review: boolean; created_at: string;
}
interface ProfileLite {
  id: string; display_name: string; short_line: string | null; currently_navigating: string[];
  can_speak_from: string[]; learning: string | null; sections_open: boolean;
}

function remember(id: string, name: string | null) {
  if (!name) return;
  MEMBERS[id] = { ...(MEMBERS[id] ?? { id }), id, displayName: name };
}

function toStory(r: StoryRow, keepReplies?: Reply[]): Story {
  const authorId = r.is_mine ? "me" : r.anonymous || !r.author_id ? "anon:" + r.id : r.author_id;
  if (!r.is_mine && !r.anonymous && r.author_id) remember(r.author_id, r.author_name);
  const t = new Date(r.created_at).getTime();
  return {
    id: r.id, authorId, anonymous: r.anonymous, experiences: r.experiences as ExperienceId[],
    audience: r.audience, circleId: r.circle_id, support: r.support, contentNote: r.content_note,
    text: r.body, photo: null, postedLabel: timeLabel(r.created_at), postedOrder: t / 1e10,
    repliesOff: r.replies_off, flaggedUrgent: r.flagged_urgent, replies: keepReplies ?? [],
  };
}

const rpc = (name: string, body: object = {}) => call(`/rest/v1/rpc/${name}`, { method: "POST", auth: true, body: JSON.stringify(body) });
const get = (path: string) => call(`/rest/v1/${path}`, { auth: true });
const send = (path: string, method: string, body?: object, prefer = "return=minimal") =>
  call(`/rest/v1/${path}`, { method, auth: true, headers: { Prefer: prefer }, body: body ? JSON.stringify(body) : undefined });

/** Everything the signed-in member needs, loaded fresh from the database. */
export async function loadCommunity(prev: { stories: Story[] }) {
  const [stories, mine, circles, blocks, received] = await Promise.all([
    rpc("visible_stories", { max_rows: 300 }) as Promise<StoryRow[]>,
    get("reactions?select=story_id,kind") as Promise<{ story_id: string; kind: "see" | "same" }[]>,
    get("circle_members?select=circle_id") as Promise<{ circle_id: string }[]>,
    get("blocks?select=blocked_id") as Promise<{ blocked_id: string }[]>,
    rpc("my_story_reactions") as Promise<{ story_id: string; member_id: string; member_name: string; kind: "see" | "same" }[]>,
  ]);

  const authors = [...new Set(stories.filter(s => !s.is_mine && !s.anonymous && s.author_id).map(s => s.author_id!))];
  if (authors.length) {
    try {
      const rows = await get(`profiles?select=id,display_name,short_line,currently_navigating,can_speak_from,learning,sections_open&id=in.(${authors.join(",")})`) as ProfileLite[];
      for (const p of rows) {
        MEMBERS[p.id] = {
          id: p.id, displayName: p.display_name, sectionsOpen: p.sections_open,
          shortLine: p.short_line ?? undefined, learning: p.learning ?? undefined,
          currentlyNavigating: p.currently_navigating as ExperienceId[], canSpeakFrom: p.can_speak_from as ExperienceId[],
        };
      }
    } catch { /* names already known from the Stories */ }
  }

  for (const k of Object.keys(SIMULATED_REACTIONS)) delete SIMULATED_REACTIONS[k];
  for (const r of received) {
    remember(r.member_id, r.member_name);
    (SIMULATED_REACTIONS[r.story_id] ??= []).push([r.member_id, r.kind]);
  }

  const reactions: Record<string, { see?: boolean; same?: boolean }> = {};
  for (const r of mine) reactions[r.story_id] = { ...reactions[r.story_id], [r.kind]: true };

  const oldReplies = new Map(prev.stories.map(s => [s.id, s.replies]));
  return {
    stories: stories.map(r => toStory(r, oldReplies.get(r.id))),
    reactions,
    joined: circles.map(c => c.circle_id),
    blocked: blocks.map(b => b.blocked_id),
  };
}

/** Load a Story's replies, nested one level as in the design. */
export async function loadReplies(storyId: string): Promise<Reply[]> {
  const rows = await rpc("story_replies", { sid: storyId }) as ReplyRow[];
  const byId = new Map<string, Reply>();
  const top: Reply[] = [];
  for (const r of rows) {
    const authorId = r.is_mine ? "me" : r.anonymous || !r.author_id ? "anon:" + r.id : r.author_id;
    if (!r.is_mine && !r.anonymous && r.author_id) remember(r.author_id, r.author_name);
    const reply: Reply = { id: r.id, authorId, anonymous: r.anonymous, text: r.body, postedLabel: timeLabel(r.created_at), heldForReview: r.held_for_review, children: [] };
    byId.set(r.id, reply);
    const parent = r.parent_id ? byId.get(r.parent_id) : null;
    (parent ? parent.children : top).push(reply);
  }
  return top;
}

export const saveStory = (s: Story) => send("stories", "POST", {
  id: s.id, anonymous: s.anonymous, experiences: s.experiences, audience: s.audience, circle_id: s.circleId,
  support: s.support, content_note: s.contentNote, body: s.text, flagged_urgent: !!s.flaggedUrgent,
});

export const updateStory = (id: string, patch: { replies_off?: boolean; anonymous?: boolean; deleted?: boolean }) => {
  const { deleted, ...rest } = patch;
  return send(`stories?id=eq.${id}`, "PATCH", { ...rest, ...(deleted ? { deleted_at: new Date().toISOString() } : {}) });
};

export const setReaction = (storyId: string, kind: "see" | "same", on: boolean) => on
  ? send("reactions", "POST", { story_id: storyId, kind }, "return=minimal,resolution=ignore-duplicates")
  : send(`reactions?story_id=eq.${storyId}&kind=eq.${kind}`, "DELETE");

export const saveReply = (storyId: string, r: Reply, parentId: string | null) => send("replies", "POST", {
  id: r.id, story_id: storyId, parent_id: parentId, anonymous: r.anonymous, body: r.text, held_for_review: !!r.heldForReview,
});

export const joinCircle = (circleId: string) => send("circle_members", "POST", { circle_id: circleId }, "return=minimal,resolution=ignore-duplicates");
export const leaveCircle = (circleId: string) => send(`circle_members?circle_id=eq.${encodeURIComponent(circleId)}`, "DELETE");

/** Only real accounts can be blocked; anonymous authors are hidden instead. */
export const isAccountId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);
export const blockMember = (memberId: string) => isAccountId(memberId)
  ? send("blocks", "POST", { blocked_id: memberId }, "return=minimal,resolution=ignore-duplicates") : Promise.resolve();

export const sendReport = (storyId: string, reason: string, note: string) =>
  send("reports", "POST", { story_id: storyId, reason, note: note.trim() || null });

/** Run a save in the background; if it fails, tell the member plainly. */
export function persist(p: Promise<unknown>, say: (m: string) => void, what = "That didn't save") {
  p.catch(e => say(`${what}. ${e?.message ?? "Please try again."}`));
}
