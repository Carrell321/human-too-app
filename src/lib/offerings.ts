/**
 * HUMAN, TOO+, HUMAN, TOO Pro and Corporate Plus.
 *
 * Built as previews at the founder's request (2026-09-26). They follow the
 * Master Business Strategy and the approved guardrails:
 *  - D-27: paid tiers never gate Stories, Circles, reactions, conversation,
 *    profiles, safety controls or crisis resources. Finding a verified
 *    professional is also always free.
 *  - Payment never buys professional credibility or placement.
 *  - Organizations see outcomes, never individuals (Privacy Firewall, D-25).
 *
 * All people, practices, programs and organizations here are fictional.
 */

/** D-33 (2026-09-26): Plus, Pro, Corporate Plus and the professional directory launch after beta. Shown here as previews. */
export const AFTER_BETA_LABEL = "After beta";

/** Everything that stays free for every member, forever (D-27, extended). */
export const ALWAYS_FREE = [
  "Sharing Stories and reading others'",
  "Circles and conversations",
  "I See You and Same Here",
  "Your profile and privacy controls",
  "Crisis and support resources",
  "Finding a verified mental-health professional",
] as const;

/** HUMAN, TOO+ (consumer). Illustrative price from the strategy, to be tested. */
export const PLUS = {
  name: "HUMAN, TOO+",
  priceLabel: "$9.99 a month",
  priceNote: "Price is still being tested. Nothing is charged in this preview.",
  features: [
    { title: "Private reflection journal", body: "Guided prompts for the days you want to write only for yourself. Never shared, never used for ads." },
    { title: "Guided programs", body: "Short, gentle programs built with verified professionals, like 21 days of Starting Over." },
    { title: "Live sessions with professionals", body: "Small, moderated Q&As and workshops with verified mental-health professionals." },
    { title: "Facilitated Circles and events", body: "Early access and member pricing for multi-week Facilitated Circles and HUMAN, TOO gatherings." },
  ],
};

export interface Professional {
  id: string;
  name: string;
  credential: string;          // license type
  licensedIn: string[];        // US states
  verifiedOn: string;
  specialties: string[];
  approach: string;
  formats: ("Telehealth" | "In person")[];
  languages: string[];
  faithIntegrated: boolean;
  acceptingClients: boolean;
  practice: string;            // they are contacted through their own practice, not in-app
}

/** Sample verified professionals. Order here is alphabetical; the directory never ranks by payment. */
export const PROFESSIONALS: Professional[] = [
  { id: "amara-okafor", name: "Dr. Amara Okafor", credential: "Licensed Psychologist (PsyD)", licensedIn: ["TX", "GA"], verifiedOn: "September 2026",
    specialties: ["Grief", "Identity", "Life transitions"], approach: "I help people make sense of big changes without rushing them to be okay.",
    formats: ["Telehealth", "In person"], languages: ["English"], faithIntegrated: true, acceptingClients: true, practice: "Okafor Counseling Collective (sample)" },
  { id: "daniel-reyes", name: "Daniel Reyes", credential: "Licensed Marriage and Family Therapist (LMFT)", licensedIn: ["CA"], verifiedOn: "September 2026",
    specialties: ["Family", "Relationships", "Boundaries"], approach: "Family can be where we hurt most and heal most. We'll work on both.",
    formats: ["Telehealth"], languages: ["English", "Spanish"], faithIntegrated: false, acceptingClients: true, practice: "Reyes Family Therapy (sample)" },
  { id: "hannah-kim", name: "Hannah Kim", credential: "Licensed Clinical Social Worker (LCSW)", licensedIn: ["NY", "NJ"], verifiedOn: "August 2026",
    specialties: ["Burnout", "Anxiety", "Career changes"], approach: "Practical, warm and direct. I like helping high-achievers learn to rest.",
    formats: ["Telehealth"], languages: ["English", "Korean"], faithIntegrated: false, acceptingClients: false, practice: "Kim Therapy Studio (sample)" },
  { id: "marcus-bell", name: "Marcus Bell", credential: "Licensed Professional Counselor (LPC)", licensedIn: ["TX"], verifiedOn: "September 2026",
    specialties: ["Men's emotional wellness", "Self-worth", "Rejection"], approach: "A space for men to say the things they were taught to keep quiet.",
    formats: ["Telehealth", "In person"], languages: ["English"], faithIntegrated: true, acceptingClients: true, practice: "Bell Counseling (sample)" },
  { id: "priya-nair", name: "Priya Nair", credential: "Licensed Mental Health Counselor (LMHC)", licensedIn: ["WA", "OR"], verifiedOn: "September 2026",
    specialties: ["Loneliness", "Belonging", "First-generation experiences"], approach: "Culturally grounded care for people who feel like they live between worlds.",
    formats: ["Telehealth"], languages: ["English", "Hindi"], faithIntegrated: false, acceptingClients: true, practice: "Nair Counseling (sample)" },
];

export interface DirectoryFilter { state?: string; telehealth?: boolean; faith?: boolean; accepting?: boolean; topic?: string }

/** Directory search. Filters only; order is alphabetical by surname so no one can pay to rank higher. */
export function searchProfessionals(list: readonly Professional[], f: DirectoryFilter): Professional[] {
  const surname = (n: string) => n.replace(/^Dr\.\s+/, "").split(" ").slice(-1)[0];
  return list
    .filter(p => !f.state || p.licensedIn.includes(f.state))
    .filter(p => !f.telehealth || p.formats.includes("Telehealth"))
    .filter(p => !f.faith || p.faithIntegrated)
    .filter(p => !f.accepting || p.acceptingClients)
    .filter(p => !f.topic || p.specialties.some(s => s.toLowerCase().includes(f.topic!.toLowerCase())))
    .sort((a, b) => surname(a.name).localeCompare(surname(b.name)));
}

export const PROGRAMS = [
  { id: "starting-over-21", title: "Starting Over", length: "21 days · 10 minutes a day", guide: "Built with Dr. Amara Okafor", blurb: "Small daily prompts for rebuilding after an ending, at your own pace." },
  { id: "boundaries", title: "Boundaries Without Guilt", length: "4 weeks", guide: "Built with Daniel Reyes, LMFT", blurb: "Learn to say what you need without apologizing for needing it." },
  { id: "rejection", title: "Rejection Doesn't Get the Final Word", length: "14 days", guide: "Built with Marcus Bell, LPC", blurb: "For the no's that still echo, and the yes you owe yourself." },
  { id: "coming-home", title: "Coming Home to Yourself", length: "30 days", guide: "Built with Priya Nair, LMHC", blurb: "Reconnect with who you are underneath everyone else's expectations." },
];

export const LIVE_SESSIONS = [
  { id: "seen", title: "Learning to Be Seen", when: "Thursday, October 8 · 7 p.m. Central", host: "Dr. Amara Okafor, PsyD", seats: "25 seats" },
  { id: "rest", title: "Rest Isn't a Reward", when: "Tuesday, October 13 · 6:30 p.m. Central", host: "Hannah Kim, LCSW", seats: "25 seats" },
];

export const JOURNAL_PROMPTS = [
  "What did you carry today that no one else could see?",
  "Where did you feel even a little bit seen this week?",
  "What would you tell someone you love who was going through what you're going through?",
  "What are you learning about yourself right now?",
];

/** HUMAN, TOO Pro, for verified professionals. */
export const PRO = {
  name: "HUMAN, TOO Pro",
  priceLabel: "Pricing to be set before launch",
  features: [
    { title: "A verified profile in the free directory", body: "Members find you by state, specialty and approach. Order is alphabetical; no one can pay to rank higher." },
    { title: "Professional Perspectives", body: "Publish short educational pieces, always labelled as professional education, not personal medical advice." },
    { title: "Host live sessions", body: "Lead moderated Q&As and workshops for HUMAN, TOO+ members." },
    { title: "Professional community", body: "Network, share referrals and learn with other verified professionals." },
  ],
  rules: [
    "Verification comes first. Paying for Pro never buys verification, a badge or placement.",
    "We check identity, license type, license number and status in your state, and public disciplinary records.",
    "Members contact you through your own practice. There is no direct messaging and no therapy inside HUMAN, TOO.",
    "Lived experience leads here. Your expertise supports it and never overrides a member's story.",
  ],
};

export const CREDENTIALS = [
  "Licensed Psychologist (PhD/PsyD)",
  "Licensed Clinical Social Worker (LCSW)",
  "Licensed Professional Counselor (LPC/LMHC)",
  "Licensed Marriage and Family Therapist (LMFT)",
  "Psychiatrist (MD/DO)",
  "Psychiatric Nurse Practitioner (PMHNP)",
] as const;

export const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"] as const;

/** Corporate Plus, for employers, universities and nonprofits. */
export const CORPORATE = {
  name: "Corporate Plus",
  offer: [
    { title: "HUMAN, TOO+ for your people", body: "Sponsored access for employees, students or members. Joining is always their choice." },
    { title: "Facilitated Circles", body: "Weekly small-group connection around real experiences: career change, burnout, belonging, caregiving." },
    { title: "Workshops with verified professionals", body: "Live sessions on boundaries, rest, rejection and building community as an adult." },
    { title: "Impact reporting", body: "Participation and belonging outcomes, reported only in aggregate." },
  ],
  pilot: [
    "Discovery: your people, your goals, your privacy requirements",
    "Kickoff: a 60 to 90 minute HUMAN, TOO experience",
    "Eight weeks of Facilitated Circles and one expert workshop",
    "A private space for your group inside HUMAN, TOO",
    "Closing gathering and an aggregate impact report",
  ],
  sees: ["How many people joined", "Average belonging and connection scores, before and after", "Themes that come up across the group", "Program completion"],
  neverSees: ["Who joined, or who didn't", "Anyone's Stories, check-ins, replies or reactions", "Which Circles or Experiences anyone chose", "Any individual's answers"],
  sampleOrg: { code: "RIVERSIDE", name: "Riverside Health (sample organization)" },
};

/** Privacy Firewall (D-25): no figure is reported for a group smaller than 10 people. */
export const MIN_REPORT_GROUP = 10;
export const reportable = (groupSize: number) => groupSize >= MIN_REPORT_GROUP;

/** Sample aggregate report shown on the Corporate Plus page. */
export const SAMPLE_REPORT = {
  org: "Riverside Health (sample)",
  period: "8-week pilot",
  rows: [
    { label: "People who joined", value: "142 of 600 invited" },
    { label: "Felt less alone after the pilot", value: "68%, up from 31%" },
    { label: "Belonging score (1 to 5)", value: "3.9, up from 2.8" },
    { label: "Completed the program", value: "74%" },
    { label: "Night-shift nurses group", value: "Not reported: fewer than 10 people" },
  ],
};
