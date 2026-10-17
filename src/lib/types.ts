/**
 * Core domain types for HUMAN, TOO.
 * These mirror the data model in the approved PRD (section 7.2) so the
 * frontend can later be wired to the real Postgres/Supabase backend
 * without renaming anything.
 */

export type ExperienceId =
  | "starting-over" | "rejection" | "finding-myself" | "loneliness"
  | "relationships" | "family" | "grief" | "identity" | "faith"
  | "career" | "self-worth" | "anxiety" | "burnout" | "belonging"
  | "healing" | "growth" | "joy";

export interface Experience {
  id: ExperienceId;
  name: string;
  icon: IconName;
}

/** Who can see a Story (D-1, D-3). Anonymous is a separate flag, not an audience. */
export type Audience = "open" | "people" | "circle";

/** What kind of response the author asked for (F9). */
export type SupportPreference = "listen" | "relate" | "encourage" | "perspective" | "resources";

export type ContentNote = "Loss" | "Suicide or self-harm" | "Abuse" | "Eating and body" | "Substances";

/** Only the two MVP reactions (D-7). */
export type ReactionKind = "see" | "same";

/** Per-section profile audience (S11). */
export type SectionAudience = "all" | "people" | "me";

export type ArrivalState =
  | "grounded" | "emotional" | "heavy" | "hopeful"
  | "tired" | "tender" | "restless" | "okay";

export interface Reply {
  id: string;
  authorId: string;
  anonymous: boolean;
  text: string;
  postedLabel: string;
  heldForReview?: boolean;
  children: Reply[];
}

export interface StoryPhoto {
  src: string;                 // prototype: a data URL; production: a private storage URL
  alt: string;                 // description for people who can't see it
  width: number;
  height: number;
}

export interface Story {
  id: string;
  authorId: string;            // "me" for the signed-in member
  anonymous: boolean;
  experiences: ExperienceId[];
  audience: Audience;
  circleId: string | null;
  support: SupportPreference;
  contentNote: ContentNote | null;
  text: string;
  photo?: StoryPhoto | null;   // optional, one per Story; text always required
  postedLabel: string;         // "3h ago" — sample data only
  postedOrder: number;         // higher = newer; stands in for created_at
  edited?: boolean;
  repliesOff?: boolean;
  deleted?: boolean;
  flaggedUrgent?: boolean;     // set by the safety check (S10 imminent risk)
  replies: Reply[];
}

export interface MemberProfile {
  id: string;
  displayName: string;
  shortLine?: string;
  currentlyNavigating?: ExperienceId[];
  canSpeakFrom?: ExperienceId[];
  learning?: string;
  /** Sample members: whether their optional sections are open to all members. */
  sectionsOpen?: boolean;
}

export interface Circle {
  id: string;
  name: string;
  experience: ExperienceId;
  purpose: string;
  host: string;
  approxMembers: number;       // shown rounded to nearest 10 (AC-S9-04)
  conversationsToday: number;
  inviteOnly?: boolean;
  inviteCode?: string;
  norms: string[];
  tone: [string, string];      // gradient stops for the Circle's cover
}

export type IconName =
  | "heart" | "same" | "support" | "back" | "close" | "home" | "circles" | "plus" | "user"
  | "lock" | "globe" | "people" | "ring" | "anon" | "check" | "more" | "chat" | "info"
  | "flag" | "alert" | "copy" | "edit"
  | "sunrise" | "rejection" | "compass" | "person" | "rel" | "house" | "candle" | "identity"
  | "faith" | "case" | "star" | "waves" | "battery" | "belong" | "heal" | "growth" | "sun"
  | "grounded" | "drop" | "cloud" | "chevron";
