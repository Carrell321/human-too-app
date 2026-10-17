/**
 * Sample HUMAN, TOO community for the prototype.
 * Every person and Story here is fictional, written to feel like a real
 * early community. Nothing here is a real member's words.
 */
import type { Circle, MemberProfile, Story } from "./types";

export const CIRCLES: Circle[] = [
  {
    id: "starting-over", name: "Starting Over", experience: "starting-over",
    purpose: "For anyone rebuilding after an ending, planned or not.",
    host: "Nia", approxMembers: 84, conversationsToday: 14,
    norms: ["Every timeline is valid here.", "Share what happened to you, not what should happen to others."],
    tone: ["#E9B48F", "#A34E33"],
  },
  {
    id: "finding-myself", name: "Finding Myself", experience: "finding-myself",
    purpose: "For rediscovering who you are underneath everyone else's expectations.",
    host: "Andre", approxMembers: 61, conversationsToday: 8,
    norms: ["Curiosity over certainty.", "No one here needs fixing."],
    tone: ["#C6D3C8", "#3E5A4B"],
  },
  {
    id: "rejection-resilience", name: "Rejection & Resilience", experience: "rejection",
    purpose: "For the no's that still sting, and what comes after them.",
    host: "Nia", approxMembers: 118, conversationsToday: 12,
    norms: ["Let people feel it before anyone reframes it.", "Ask before offering a silver lining."],
    tone: ["#F0D2BD", "#7F5A48"],
  },
  {
    id: "loneliness", name: "Loneliness", experience: "loneliness",
    purpose: "For anyone who feels alone, even when surrounded by people.",
    host: "Andre", approxMembers: 212, conversationsToday: 21,
    norms: ["Showing up counts.", "Small hellos matter."],
    tone: ["#D5CFDF", "#4B4A63"],
  },
  {
    id: "career-purpose", name: "Career & Purpose", experience: "career",
    purpose: "For career changes, pauses and questions about what work means to you.",
    host: "Sofia", approxMembers: 72, conversationsToday: 6,
    norms: ["Every path is a real path.", "Share experience, not verdicts."],
    tone: ["#E8DDB0", "#8A6D2F"],
  },
  {
    // Added by founder decision, 2026-09-26.
    id: "faith", name: "Faith", experience: "faith",
    purpose: "For growing in faith, returning to it, questioning it, or finding your own way with it.",
    host: "Andre", approxMembers: 46, conversationsToday: 5,
    norms: ["Every tradition, and every question, is welcome here.", "Share your own faith; don't press it on anyone else.", "Doubt and devotion can sit at the same table."],
    tone: ["#F1DDB8", "#9A6B3F"],
  },
];
export const CIRCLE_BY_ID = Object.fromEntries(CIRCLES.map(c => [c.id, c])) as Record<string, Circle>;

export const MEMBERS: Record<string, MemberProfile> = {
  jordan: { id: "jordan", displayName: "Jordan", shortLine: "Still becoming.", currentlyNavigating: ["starting-over", "career"], learning: "My timeline doesn't have to look like anyone else's.", sectionsOpen: true },
  maya: { id: "maya", displayName: "Maya", shortLine: "New city, same heart.", currentlyNavigating: ["loneliness", "belonging"], learning: "Going places alone is its own kind of brave.", sectionsOpen: true },
  dev: { id: "dev", displayName: "Dev", shortLine: "Former analyst, current chemistry teacher.", currentlyNavigating: ["career"], canSpeakFrom: ["burnout"], sectionsOpen: true },
  rosa: { id: "rosa", displayName: "Rosa", shortLine: "Fifty-two and learning to listen to myself.", currentlyNavigating: ["finding-myself"], sectionsOpen: true },
  sam: { id: "sam", displayName: "Sam" },
  lena: { id: "lena", displayName: "Lena", shortLine: "Yellow kitchen, fresh start.", canSpeakFrom: ["starting-over", "relationships"], sectionsOpen: true },
  marcus: { id: "marcus", displayName: "Marcus", shortLine: "Learning to stay in the room.", currentlyNavigating: ["self-worth"], sectionsOpen: true },
  priya: { id: "priya", displayName: "Priya" },
  theo: { id: "theo", displayName: "Theo", shortLine: "Six months into doing the work.", currentlyNavigating: ["healing"], learning: "Being alone and being lonely are different things.", sectionsOpen: true },
  nadia: { id: "nadia", displayName: "Nadia", shortLine: "Finding my way back, on my own terms.", currentlyNavigating: ["faith", "identity"], learning: "Faith can hold questions too.", sectionsOpen: true },
  elena: { id: "elena", displayName: "Elena", shortLine: "Mom of two, student of one: me.", currentlyNavigating: ["family", "growth"], sectionsOpen: true },
  kofi: { id: "kofi", displayName: "Kofi" },
  // Anonymous authors still have accounts (accountable to the platform, hidden from members).
  anon1: { id: "anon1", displayName: "" },
  anon2: { id: "anon2", displayName: "" },
  anon3: { id: "anon3", displayName: "" },
  anon4: { id: "anon4", displayName: "" },
};

let order = 100;
const next = () => order--;

export const SAMPLE_STORIES: Story[] = [
  {
    id: "jordan-35", authorId: "jordan", anonymous: false, experiences: ["starting-over"], audience: "open", circleId: null,
    support: "relate", contentNote: null, postedLabel: "3h ago", postedOrder: next(),
    text: "I'm 35 and I feel like everyone else has figured life out except me. I've been carrying so much shame about starting over, but I'm finally learning that my timeline doesn't have to look like anyone else's.",
    replies: [
      { id: "r-lena-1", authorId: "lena", anonymous: false, postedLabel: "2h ago", text: "I started over at 41. The shame was loudest right before it got quieter. You're not behind.",
        children: [{ id: "r-jordan-1", authorId: "jordan", anonymous: false, postedLabel: "1h ago", text: "\"Loudest right before it got quieter.\" I'm writing that on a sticky note. Thank you.", children: [] }] },
      { id: "r-marcus-1", authorId: "marcus", anonymous: false, postedLabel: "1h ago", text: "Same here. Thirty-eight, new city, new job. Some days I'm proud, some days I'm just tired. Both count.", children: [] },
    ],
  },
  {
    id: "anon-fourth-no", authorId: "anon1", anonymous: true, experiences: ["rejection"], audience: "circle", circleId: "rejection-resilience",
    support: "listen", contentNote: null, postedLabel: "4h ago", postedOrder: next(),
    text: "Got the email today. Fourth final round, fourth no. I'm not asking for advice. I just needed to say it somewhere people understand.",
    replies: [],
  },
  {
    id: "nadia-way-back", authorId: "nadia", anonymous: false, experiences: ["faith", "identity"], audience: "open", circleId: null,
    support: "relate", contentNote: null, postedLabel: "5h ago", postedOrder: next(),
    text: "I grew up in church, stepped away for years, and I'm slowly finding my way back on my own terms. Some days it looks like prayer. Some days it's just sitting still and letting myself ask the questions I used to be afraid of.",
    replies: [
      { id: "r-elena-1", authorId: "elena", anonymous: false, postedLabel: "3h ago", text: "The questions I used to be afraid of are the ones that eventually brought me home. Different path, same feeling. I'm glad you're asking them.", children: [] },
    ],
  },
  {
    id: "maya-pottery", authorId: "maya", anonymous: false, experiences: ["loneliness", "belonging"], audience: "open", circleId: null,
    support: "encourage", contentNote: null, postedLabel: "6h ago", postedOrder: next(),
    text: "Moved to a new city for work six months ago. My weekends are so quiet I can hear the fridge. Tonight I'm going to a pottery class alone. Wish me luck.",
    replies: [
      { id: "r-priya-1", authorId: "priya", anonymous: false, postedLabel: "4h ago", text: "Good luck! Going alone the first time is the hardest part, and you're already doing it.", children: [] },
    ],
  },
  {
    id: "dev-chemistry", authorId: "dev", anonymous: false, experiences: ["career"], audience: "circle", circleId: "career-purpose",
    support: "perspective", contentNote: null, postedLabel: "7h ago", postedOrder: next(),
    text: "Left a stable analyst job to teach high school chemistry. The pay cut is real. Some days I wonder if I romanticized it. For those who made a big change: how did you know it was right?",
    replies: [
      { id: "r-sam-1", authorId: "sam", anonymous: false, postedLabel: "5h ago", text: "I didn't know for about a year. What told me was noticing I'd stopped dreading Sunday nights.", children: [] },
    ],
  },
  {
    id: "anon-sunday-calls", authorId: "anon2", anonymous: true, experiences: ["grief"], audience: "open", circleId: null,
    support: "relate", contentNote: "Loss", postedLabel: "9h ago", postedOrder: next(),
    text: "It's been a year since my mom died. Everyone expects me to be better now. I still pick up the phone to call her on Sunday mornings, and for one second I forget.",
    replies: [],
  },
  {
    id: "rosa-music", authorId: "rosa", anonymous: false, experiences: ["finding-myself"], audience: "circle", circleId: "finding-myself",
    support: "relate", contentNote: null, postedLabel: "10h ago", postedOrder: next(),
    text: "At 52 I'm realizing I spent my whole life being who others needed. I don't actually know what music I like. So I'm starting there. This week: old Nina Simone records and a lot of skipping.",
    replies: [],
  },
  {
    id: "sam-rest", authorId: "sam", anonymous: false, experiences: ["burnout"], audience: "open", circleId: null,
    support: "resources", contentNote: null, postedLabel: "12h ago", postedOrder: next(),
    text: "Three weeks off work for burnout. Sleeping better. Still feel guilty every time I rest. What helped you stop treating rest like something you have to earn?",
    replies: [],
  },
  {
    id: "lena-yellow-kitchen", authorId: "lena", anonymous: false, experiences: ["starting-over", "relationships"], audience: "circle", circleId: "starting-over",
    support: "encourage", contentNote: null, postedLabel: "1d ago", postedOrder: next(),
    text: "Signed the lease on my first apartment after the divorce. It's small and the kitchen is yellow and it's mine.",
    replies: [],
  },
  {
    id: "marcus-mens-group", authorId: "marcus", anonymous: false, experiences: ["self-worth"], audience: "open", circleId: null,
    support: "relate", contentNote: null, postedLabel: "1d ago", postedOrder: next(),
    text: "Tried a men's group for the first time. Didn't say much. But I stayed the whole time, and for me that's something.",
    replies: [],
  },
  {
    id: "anon-phone-call", authorId: "anon3", anonymous: true, experiences: ["anxiety"], audience: "open", circleId: null,
    support: "listen", contentNote: null, postedLabel: "1d ago", postedOrder: next(),
    text: "Made the phone call I'd been avoiding for two weeks. Hands shaking the whole time. It's done.",
    replies: [],
  },
  {
    id: "elena-bedtime", authorId: "elena", anonymous: false, experiences: ["family", "growth"], audience: "open", circleId: null,
    support: "encourage", contentNote: null, postedLabel: "1d ago", postedOrder: next(),
    text: "My daughter asked why I cried at the school play. I told her the truth: I was proud of her, and I was proud of me for showing up after the year we've had. She said, \"Both can be true.\" She's nine.",
    replies: [],
  },
  {
    id: "priya-translating", authorId: "priya", anonymous: false, experiences: ["belonging", "identity"], audience: "open", circleId: null,
    support: "encourage", contentNote: null, postedLabel: "2d ago", postedOrder: next(),
    text: "First-generation grad student. Most days I feel like I'm translating myself in two directions at once: for my family, and for the room.",
    replies: [],
  },
  {
    id: "theo-alone-lonely", authorId: "theo", anonymous: false, experiences: ["healing", "growth"], audience: "open", circleId: null,
    support: "perspective", contentNote: null, postedLabel: "2d ago", postedOrder: next(),
    text: "Six months into therapy. I'm learning the difference between being alone and being lonely. One I'm getting good at. The other I'm still sitting with.",
    replies: [],
  },
  {
    id: "anon-restart-circle", authorId: "anon4", anonymous: true, experiences: ["starting-over"], audience: "circle", circleId: "starting-over",
    support: "relate", contentNote: null, postedLabel: "2d ago", postedOrder: next(),
    text: "Moved back in with my parents at 29. I tell people it's to save money. It's also because I didn't know where else to land.",
    replies: [],
  },
  {
    id: "kofi-promotion", authorId: "kofi", anonymous: false, experiences: ["career", "self-worth"], audience: "circle", circleId: "career-purpose",
    support: "relate", contentNote: null, postedLabel: "3d ago", postedOrder: next(),
    text: "Passed over for the promotion again. Keeping it together at work. Falling apart a little in the car afterwards.",
    replies: [],
  },
  {
    id: "jordan-applied", authorId: "jordan", anonymous: false, experiences: ["starting-over", "career"], audience: "open", circleId: null,
    support: "encourage", contentNote: null, postedLabel: "3d ago", postedOrder: next(),
    text: "Update: I applied for the design course. Didn't get the scholarship yet, but I hit submit, which the old me never would have done.",
    replies: [],
  },
  {
    id: "anon-holidays", authorId: "anon1", anonymous: true, experiences: ["faith", "family"], audience: "circle", circleId: "faith",
    support: "relate", contentNote: null, postedLabel: "8h ago", postedOrder: 93.5,
    text: "I'm the only one in my family who stopped going to church. Holidays feel like a test I keep failing, even though nobody says a word.",
    replies: [],
  },
  {
    id: "elena-prayed", authorId: "elena", anonymous: false, experiences: ["faith", "healing"], audience: "circle", circleId: "faith",
    support: "encourage", contentNote: null, postedLabel: "1d ago", postedOrder: 88.5,
    text: "Prayed for the first time in eight years last night. Didn't have the right words. Said them anyway. Something in me unclenched.",
    replies: [],
  },
];
