/**
 * Pre-publish safety check (S10 "Safety check outcomes", AC-S10-05/06/07).
 *
 * PROTOTYPE ONLY. Production uses a phrase list plus a moderation API, and
 * every flag is reviewed by a person (D-13). This keyword version exists so
 * the prototype can show each outcome. It will miss things and must never be
 * described to members as able to detect every emergency.
 */
export type SafetyResult =
  | { level: "clear" }
  | { level: "distress" }
  | { level: "imminent" }
  | { level: "covenant"; category: string };

const COVENANT_RULES: { pattern: RegExp; category: string }[] = [
  { pattern: /\byou should (just )?(hurt|kill) yourself\b/i, category: "encouraging self-harm" },
  { pattern: /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/, category: "sharing someone's private information" },
  { pattern: /\b(his|her|their) (home )?address is\b/i, category: "sharing someone's private information" },
];
const IMMINENT = /\b(kill myself|end my life|want to die|suicide|take my own life|not be here anymore)\b/i;
const DISTRESS = /\b(hopeless|can'?t do this anymore|so alone|falling apart|worthless|breaking down)\b/i;

export function checkText(text: string): SafetyResult {
  for (const rule of COVENANT_RULES) if (rule.pattern.test(text)) return { level: "covenant", category: rule.category };
  if (IMMINENT.test(text)) return { level: "imminent" };
  if (DISTRESS.test(text)) return { level: "distress" };
  return { level: "clear" };
}

/** Display-name rules (S2d, AC-S2-08). */
export function displayNameProblem(name: string): string | null {
  const n = name.trim();
  if (n.length < 2 || n.length > 30) return "Names need 2 to 30 characters.";
  if (!/^[\p{L} .'\-]+$/u.test(n)) return "Names can use letters, spaces, apostrophes, hyphens and periods.";
  if (/human,?\s*too|moderator|admin/i.test(n)) return "Please choose a different name. Names can't look like HUMAN, TOO staff.";
  return null;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

/** S2c: age on a given day. The date of birth is never stored (AC-S2-07). */
export function ageOn(day: Date, year: number, month: number, date: number): number {
  let age = day.getFullYear() - year;
  if (day.getMonth() + 1 < month || (day.getMonth() + 1 === month && day.getDate() < date)) age--;
  return age;
}
