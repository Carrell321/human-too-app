# HUMAN, TOO: MVP frontend (core journey)

Feel seen. Be known. Find your people.

This is the first build of the HUMAN, TOO app frontend, following the approved MVP Product Requirements Document and MVP Specification. It covers the core onboarding-to-connection journey only:

Welcome → Account creation → What brings you here → Experiences → Privacy → Community Covenant → Today → Discover a Story → I See You / Same Here → Join a Circle → Share Your Story → Profile

It also includes profile photos and one optional photo per Story, the founder note ("Why HUMAN, TOO exists"), the always-available Support sheet, the pre-publish safety check, and Report and Block on Stories.

## What this is not (yet)

- **No real database or sign-in.** Everything runs in the browser with fictional sample content (`src/lib/sample-data.ts`). The journey is kept in the browser tab's session storage so a refresh doesn't lose your place. Nothing is sent anywhere.
- **The safety check is a keyword stand-in** (`src/lib/safety.ts`). Production uses a phrase list plus a moderation API, and every flag goes to a person (PRD decision D-13). It must never be described to members as able to catch every emergency.
- **Not yet in Next.js.** The workspace this was built in could not download Next.js, so it runs as plain React + TypeScript. It is structured to move over with little change (see below).

## Photos

- **Profile photo:** Edit profile → Add photo. Square-cropped, resized to 480 px.
- **Story photo (decision D-31, approved 2026-09-26):** one optional photo per Story; text is still required. The member adds a description (alt text) and must confirm that anyone recognizable agreed to be shared before continuing.
- Every photo is re-drawn on a canvas (`src/lib/media.ts`), which removes location and camera metadata. JPG, PNG or WebP only; 5 MB for profiles, 10 MB for Stories.
- Photos stay hidden under a content-note cover until the reader chooses to open the Story.
- **Before any real launch:** photos must go to private object storage and pass automated checks, including mandatory hash matching against known child-abuse imagery with legally required reporting, plus nudity, violence and self-harm image detection, and human review before anyone else sees them. None of that exists in this prototype.

## Plus, Pro and Corporate Plus (previews, D-33)

Built at the founder's request. No payments, verification or data sharing happen in this preview. Content lives in `src/lib/offerings.ts`; screens in `src/screens/Beyond.tsx`.

- **Find a professional** (`/professionals`): free for everyone, also linked from the Support sheet. Filters only; alphabetical by surname so no one can pay to rank higher. Members contact professionals through their own practice.
- **HUMAN, TOO+** (`/plus`): private reflection journal, guided programs, live sessions, Facilitated Circle access. Never gates anything in `ALWAYS_FREE`; no badge. Organization code `RIVERSIDE` shows covered access.
- **HUMAN, TOO Pro** (`/pro`): verification application (identity, license, state, disciplinary records), pending state, then a verified directory listing. Payment never buys verification or placement.
- **Corporate Plus** (`/organizations`, public): offer, 8-week pilot, the Privacy Firewall (what organizations see and never see), a sample aggregate report, and a pilot request form. `reportable()` enforces the 10-person minimum.
- **Beta rules (`src/lib/launch.ts`):** during beta, members can't open `/resources`, `/plus` or `/professionals`. The founder role sees them (founder view, with a switch on the You screen to preview the member view). `/organizations`, `/pro` and `/pro/apply` are public so organizations can request pilots and professionals can apply early. Switch `CURRENT_PHASE` to `"after-beta"` to open everything to members. In production the founder role comes from the account's role on the server, never from the browser.
- **Before any real launch:** payments, real license verification, a legal review of professional listings and telehealth rules, and organization contracts that include the Privacy Firewall.

## Try it

- Invite code `HUMAN2026`, sign-in code `123456`.
- "I already belong here" signs you in as Carrell with the founder view on. "Find Your People" creates a regular beta member, who can't see Plus, Pro or the directory.
- `RIVERSIDE` on the HUMAN, TOO+ page shows organization-covered access.
- To see the safety check, share a Story containing "so alone" or "I want to die".

## Structure

```
src/
  lib/            Domain rules with no UI: types, product copy, sample data,
                  visibility + Today ordering (visibility.ts), safety check (safety.ts)
  state/          Journey state (React context). Becomes server data + session later.
  router/         Tiny router mirroring next/navigation (useRouter, usePathname, useParams, Link)
  components/     Icon, top bar, bottom nav, Story post, reactions, sheets
  screens/        Onboarding.tsx (S1-S5) and Member.tsx (S6-S11)
  styles/app.css  Design system tokens (light + dark) and components
  App.tsx         Route table + access rules
tests/            Rule tests named after the spec's acceptance criteria
preview/          HTML template for the single-file preview
scripts/          build-preview.mjs (esbuild → dist/human-too.html)
```

## Commands

```
npm install              # react, react-dom, esbuild, tsx, typescript
npm test                 # 13 rule tests (AC-S2, S6, S7, S9, S10, S11)
npm run typecheck:rules  # strict type-check of src/lib
npm run preview:build    # builds dist/human-too.html
```

## Moving to Next.js (App Router)

1. Create the Next.js app with TypeScript and copy `src/` in.
2. Replace imports of `../router/router` with `next/navigation` (`useRouter`, `usePathname`, `useParams`) and `next/link` (`Link`). `router.reset(path)` becomes `router.replace(path)`.
3. Turn each entry in `App.tsx`'s route table into `app/<path>/page.tsx` (for example `/story/:id` → `app/story/[id]/page.tsx`) rendering the matching screen as a client component.
4. Move `useAccessRules` into middleware once real sessions exist.
5. Move `src/lib/visibility.ts` rules to the server and mirror them in database row-level security. The browser must never receive an anonymous author's ID, or reaction counts for Stories the viewer didn't write.
6. Load fonts with `next/font/google` (Geist for everything; Libre Caslon Display for the wordmark only).

## Design direction

Timeless, minimal and modern, in the spirit of everyday social apps: one sans-serif (Geist), generous white space, Stories as an open feed with hairline dividers rather than boxed cards, icon-led navigation, and clay (#B4553A) used sparingly for reactions and the HUMAN, TOO comma. Deep forest (#1E2F27) is the primary button color. Light and dark themes are both defined.
