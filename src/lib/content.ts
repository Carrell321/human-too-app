/**
 * Product copy and fixed lists that come straight from the Founder & Product
 * Brief and the approved MVP Specification. Keep wording changes here so
 * they can be reviewed in one place.
 */
import type { ArrivalState, ContentNote, Experience, SupportPreference } from "./types";

/** S4: the brief's 16 Experiences plus Faith (founder decision, 2026-09-26). */
export const EXPERIENCES: Experience[] = [
  { id: "starting-over", name: "Starting Over", icon: "sunrise" },
  { id: "rejection", name: "Rejection", icon: "rejection" },
  { id: "finding-myself", name: "Finding Myself", icon: "compass" },
  { id: "loneliness", name: "Loneliness", icon: "person" },
  { id: "relationships", name: "Relationships", icon: "rel" },
  { id: "family", name: "Family", icon: "house" },
  { id: "grief", name: "Grief", icon: "candle" },
  { id: "identity", name: "Identity", icon: "identity" },
  { id: "faith", name: "Faith", icon: "faith" },
  { id: "career", name: "Career & Purpose", icon: "case" },
  { id: "self-worth", name: "Self-Worth", icon: "star" },
  { id: "anxiety", name: "Anxiety", icon: "waves" },
  { id: "burnout", name: "Burnout", icon: "battery" },
  { id: "belonging", name: "Belonging", icon: "belong" },
  { id: "healing", name: "Healing", icon: "heal" },
  { id: "growth", name: "Growth", icon: "growth" },
  { id: "joy", name: "Joy", icon: "sun" },
];
export const EXPERIENCE_BY_ID = Object.fromEntries(EXPERIENCES.map(e => [e.id, e])) as Record<Experience["id"], Experience>;
export const MAX_EXPERIENCES = 5;

/** S3 */
export const REASONS = [
  "I want to feel less alone.",
  "I want people who understand me.",
  "I'm navigating something.",
  "I want to share my story.",
  "I'm here to listen.",
  "I'm working on myself.",
  "I'm looking for community.",
  "I'm a mental-health professional.",
] as const;
export const PROFESSIONAL_REASON_INDEX = 7;

/** S10d */
export const SUPPORT: Record<SupportPreference, { name: string; description: string }> = {
  listen: { name: "Just listen", description: "No replies. Just be seen." },
  relate: { name: "Relate with me", description: "Share if you've lived something like this." },
  encourage: { name: "Encouragement welcome", description: "Kind words are welcome." },
  perspective: { name: "Perspective welcome", description: "Other ways of seeing it." },
  resources: { name: "Resources welcome", description: "Things that have helped others." },
};

export const CONTENT_NOTES: ContentNote[] = ["Loss", "Suicide or self-harm", "Abuse", "Eating and body", "Substances"];

/** S6a */
export const ARRIVALS: { id: ArrivalState; label: string; icon: "grounded" | "drop" | "cloud" | "sunrise" }[] = [
  { id: "grounded", label: "Grounded", icon: "grounded" },
  { id: "emotional", label: "Emotional", icon: "drop" },
  { id: "heavy", label: "Heavy", icon: "cloud" },
  { id: "hopeful", label: "Hopeful", icon: "sunrise" },
];
export const MORE_ARRIVALS: { id: ArrivalState; label: string }[] = [
  { id: "tired", label: "Tired" }, { id: "tender", label: "Tender" },
  { id: "restless", label: "Restless" }, { id: "okay", label: "Okay" },
];

/** S5b — from the brief's Community Covenant. */
export const COVENANT = [
  "Your story belongs here. So does theirs.",
  "Share your experience without invalidating someone else's.",
  "Support without diagnosing.",
  "Listen without exploiting vulnerability.",
  "Disagree without dehumanizing.",
  "Protect people's privacy.",
  "Ask before giving advice.",
  "Remember that behind every Story is a human being.",
];
export const COVENANT_VERSION = "2026-09";

/** Report reasons (Cross-cutting: Report). */
export const REPORT_REASONS = [
  "Someone may be in danger",
  "Harassment or bullying",
  "Threats or violence",
  "Sexual content or exploitation",
  "Grooming or predatory behavior",
  "Sharing private information",
  "Encouraging self-harm",
  "Harmful medical advice",
  "Spam or scam",
  "May be under 18",
  "Something else",
] as const;

/** Founder note (About HUMAN, TOO). Based on Carrell's own words; final approval before beta (AC-A-03). */
export const FOUNDER_NOTE = {
  name: "Carrell Andrews",
  title: "Founder",
  opening: "There were many seasons in my life when I felt misunderstood. I faced rejection. I questioned my identity, and at times I questioned my faith. In some of those moments I was surrounded by people and still felt unseen.",
  turn: "What carried me through was a quiet knowing: I was not alone, even when it felt that way.",
  quote: "I was created for a purpose that is still unfolding.",
  why: [
    "That is my why. HUMAN, TOO exists because no one should have to walk through the hardest parts of their story feeling like the only one. Social media made us more visible than ever, but being visible isn't the same as being seen.",
    "This is a space for the moments when you're carrying something and aren't sure anyone would understand: starting over, a rejection that still stings, a question about who you are or what you believe, a version of yourself you're still discovering. You don't have to perform to belong here, and you don't have to have it all figured out. You can name what you're navigating, share as much or as little as you want, and find people who can say, \"Same here.\"",
    "I made a few promises when I started building this, and I intend to keep them.",
  ],
  promises: ["Your vulnerability is never the product.", "No ads, no selling your data.", "Belonging here stays free."],
  closing: "Your story isn't finished. Mine isn't either. I'm glad you're here.",
};

/** Test values for the prototype only. Real invites and codes come from the backend. */
export const PROTOTYPE = {
  inviteCode: "HUMAN2026",
  usedInviteCode: "USED2025",
  signInCode: "123456",
  sampleMemberName: "Carrell",
  today: new Date(2026, 8, 26),
};
