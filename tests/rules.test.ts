// Rule tests mapped to MVP Specification acceptance criteria.
// Run: npx tsx --test tests/rules.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { anonymousAllowed, canNarrowTo, canReplyAnonymously, canSee, replyState, roundToTen, sectionVisibleTo, todayFeed, type Viewer } from "../src/lib/visibility";
import { ageOn, checkText, displayNameProblem } from "../src/lib/safety";
import { SAMPLE_STORIES } from "../src/lib/sample-data";
import { EXPERIENCES } from "../src/lib/content";
import type { Story } from "../src/lib/types";

const viewer = (over: Partial<Viewer> = {}): Viewer => ({
  id: "me", joinedCircles: new Set(), connections: new Set(), blocked: new Set(), hiddenStories: new Set(), ...over,
});
const story = (over: Partial<Story>): Story => ({
  id: "x", authorId: "a", anonymous: false, experiences: ["joy"], audience: "open", circleId: null, support: "relate",
  contentNote: null, text: "t", postedLabel: "", postedOrder: 1, replies: [], ...over,
});

test("AC-S7-01 Circle Stories are visible only to Circle members", () => {
  const s = story({ audience: "circle", circleId: "c1" });
  assert.equal(canSee(s, viewer()), false);
  assert.equal(canSee(s, viewer({ joinedCircles: new Set(["c1"]) })), true);
});

test("AC-S7-01 My People Stories are visible only to connections", () => {
  const s = story({ audience: "people" });
  assert.equal(canSee(s, viewer()), false);
  assert.equal(canSee(s, viewer({ connections: new Set(["a"]) })), true);
});

test("AC-S7-12 blocked authors are invisible, deleted Stories are gone, own Stories always visible", () => {
  assert.equal(canSee(story({}), viewer({ blocked: new Set(["a"]) })), false);
  assert.equal(canSee(story({ deleted: true }), viewer()), false);
  assert.equal(canSee(story({ authorId: "me", audience: "people" }), viewer()), true);
});

test("AC-S7-05 Just listen and closed replies accept no replies", () => {
  assert.equal(replyState(story({ support: "listen" }), "me").kind, "listen");
  assert.equal(replyState(story({ repliesOff: true }), "me").kind, "off");
  assert.equal(replyState(story({}), "me").kind, "open");
});

test("AC-S7-08 / AC-S10-03 anonymous rules", () => {
  assert.equal(canReplyAnonymously(story({ audience: "circle", circleId: "c" })), true);
  assert.equal(canReplyAnonymously(story({ audience: "open" })), false);
  assert.equal(anonymousAllowed("people"), false);
  assert.equal(anonymousAllowed("open"), true);
  assert.equal(anonymousAllowed("circle"), true);
});

test("AC-S6-04 / AC-S6-05 / AC-S6-06 Today: capped, max 2 per author, never your own", () => {
  const many = Array.from({ length: 15 }, (_, i) => story({ id: "s" + i, authorId: i < 5 ? "same-author" : "a" + i, postedOrder: i }));
  const out = todayFeed({ stories: [...many, story({ id: "mine", authorId: "me" })], viewer: viewer(), currentExperiences: [], focus: null, reacted: new Set(), heavy: false });
  assert.equal(out.length, 10);
  assert.ok(out.filter(s => s.authorId === "same-author").length <= 2);
  assert.ok(!out.some(s => s.authorId === "me"));
});

test("AC-S6-03 Heavy limits Today to 5 Stories", () => {
  const out = todayFeed({ stories: SAMPLE_STORIES, viewer: viewer(), currentExperiences: [], focus: null, reacted: new Set(), heavy: true });
  assert.ok(out.length <= 5);
});

test("AC-S6-07 / AC-S6-08 focus Experience comes first, ordering uses no engagement", () => {
  const out = todayFeed({ stories: SAMPLE_STORIES, viewer: viewer(), currentExperiences: ["starting-over"], focus: "faith", reacted: new Set(), heavy: false });
  assert.ok(out[0].experiences.includes("faith"));
});

test("AC-S10-05 safety check outcomes", () => {
  assert.equal(checkText("Signed the lease today.").level, "clear");
  assert.equal(checkText("I feel hopeless lately").level, "distress");
  assert.equal(checkText("Some nights I want to die").level, "imminent");
  assert.equal(checkText("you should just hurt yourself").level, "covenant");
  assert.equal(checkText("call her at 555-123-4567").level, "covenant");
});

test("AC-S2-06 age gate", () => {
  const day = new Date(2026, 8, 26);
  assert.equal(ageOn(day, 2008, 9, 26) >= 18, true);
  assert.equal(ageOn(day, 2008, 9, 27) >= 18, false);
});

test("AC-S2-08 display names", () => {
  assert.equal(displayNameProblem("Carrell"), null);
  assert.equal(displayNameProblem("José María"), null);
  assert.notEqual(displayNameProblem("HUMAN, TOO Team"), null);
  assert.notEqual(displayNameProblem("Moderator Sam"), null);
});

test("AC-S11-01 profile section audiences", () => {
  assert.equal(sectionVisibleTo("me", "member"), false);
  assert.equal(sectionVisibleTo("people", "member"), false);
  assert.equal(sectionVisibleTo("people", "connection"), true);
  assert.equal(sectionVisibleTo("all", "member"), true);
});

test("AC-S9-04 / AC-S10-09 / AC-S4-02 small rules", () => {
  assert.equal(roundToTen(84), 80);
  assert.equal(canNarrowTo("open", "circle"), true);
  assert.equal(canNarrowTo("circle", "people"), false);
  assert.equal(EXPERIENCES.length, 17);
  assert.ok(EXPERIENCES.some(e => e.id === "faith"));
});

test("AC-S11-07 / E-24 photo file checks", async () => {
  const { photoProblem, PROFILE_MAX_BYTES } = await import("../src/lib/media");
  assert.equal(photoProblem({ type: "image/jpeg", size: 1000 }, PROFILE_MAX_BYTES), null);
  assert.notEqual(photoProblem({ type: "image/gif", size: 1000 }, PROFILE_MAX_BYTES), null);
  assert.notEqual(photoProblem({ type: "image/png", size: PROFILE_MAX_BYTES + 1 }, PROFILE_MAX_BYTES), null);
});

test("D-28 approved launch Circle names, including Faith", async () => {
  const { CIRCLES } = await import("../src/lib/sample-data");
  assert.deepEqual(CIRCLES.map(c => c.name), ["Starting Over", "Finding Myself", "Rejection & Resilience", "Loneliness", "Career & Purpose", "Faith"]);
  assert.ok(CIRCLES.find(c => c.id === "faith")!.norms.some(n => n.includes("don't press it")));
});

test("D-27 extended: support, crisis resources and finding a professional are always free", async () => {
  const { ALWAYS_FREE } = await import("../src/lib/offerings");
  for (const needle of ["Crisis", "professional", "Circles", "Stories"]) assert.ok(ALWAYS_FREE.some(x => x.includes(needle)), needle);
});

test("Pro: directory order is alphabetical by surname and filters only; no paid ranking", async () => {
  const { PROFESSIONALS, searchProfessionals } = await import("../src/lib/offerings");
  const all = searchProfessionals(PROFESSIONALS, {});
  assert.deepEqual(all.map(p => p.name.split(" ").slice(-1)[0]), ["Bell", "Kim", "Nair", "Okafor", "Reyes"]);
  assert.ok(searchProfessionals(PROFESSIONALS, { state: "TX" }).every(p => p.licensedIn.includes("TX")));
  assert.ok(searchProfessionals(PROFESSIONALS, { faith: true }).every(p => p.faithIntegrated));
  assert.ok(!("featured" in PROFESSIONALS[0]) && !("sponsored" in PROFESSIONALS[0]));
});

test("D-25 Corporate Plus: no figure reported for groups under 10", async () => {
  const { reportable, MIN_REPORT_GROUP } = await import("../src/lib/offerings");
  assert.equal(MIN_REPORT_GROUP, 10);
  assert.equal(reportable(9), false);
  assert.equal(reportable(10), true);
});

test("Circles never fill up (founder decision 2026-09-26)", async () => {
  const { CIRCLES } = await import("../src/lib/sample-data");
  assert.ok(CIRCLES.every(c => !("capacity" in c)));
});

test("D-33 beta: members can't open after-beta pages; founder view can; Corporate Plus and Pro applications are public", async () => {
  const { canOpen, showsAfterBeta, PUBLIC_DURING_BETA } = await import("../src/lib/launch");
  for (const p of ["/resources", "/plus", "/plus/journal", "/professionals", "/professionals/amara-okafor"]) {
    assert.equal(canOpen(p, "member", "beta"), false, p);
    assert.equal(canOpen(p, "founder", "beta"), true, p);
    assert.equal(canOpen(p, "member", "after-beta"), true, p);
  }
  assert.equal(canOpen("/today", "member", "beta"), true);
  assert.equal(showsAfterBeta("member", "beta"), false);
  for (const p of ["/organizations", "/pro", "/pro/apply"]) assert.ok(PUBLIC_DURING_BETA.some(r => r.test(p)), p);
});
