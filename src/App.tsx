/**
 * Route table. Each route maps 1:1 to a future Next.js page:
 *   "/today"        -> app/today/page.tsx
 *   "/story/:id"    -> app/story/[id]/page.tsx
 * and so on. Access rules below become middleware once real sessions exist.
 */
import { useEffect } from "react";
import { Routes, usePathname, useRouter, type Route } from "./router/router";
import { effectiveRole, useJourney } from "./state/journey";
import { PUBLIC_DURING_BETA, canOpen } from "./lib/launch";
import { myProfile, session as currentSession, signedIn } from "./lib/backend";
import { SheetHost, Toast } from "./components/Sheets";
import { Covenant, CovenantPage, Experiences, Join, OurStory, Privacy, Reasons, Welcome } from "./screens/Onboarding";
import { Journal, Organizations, Plus, Pro, ProApply, ProfessionalDetail, Professionals, Programs, Resources, Sessions } from "./screens/Beyond";
import { CircleScreen, Circles, Person, Share, Shared, StoryScreen, Today, You } from "./screens/Member";

const PUBLIC = [/^\/$/, /^\/our-story$/, /^\/covenant$/, /^\/join\//, ...PUBLIC_DURING_BETA];
const ONBOARDING = /^\/onboarding\//;

const routes: Route[] = [
  { pattern: "/", render: () => <Welcome /> },
  { pattern: "/our-story", render: () => <OurStory /> },
  { pattern: "/covenant", render: () => <CovenantPage /> },
  { pattern: "/join/:step", render: () => <Join /> },
  { pattern: "/onboarding/reasons", render: () => <Reasons /> },
  { pattern: "/onboarding/experiences", render: () => <Experiences /> },
  { pattern: "/onboarding/privacy", render: () => <Privacy /> },
  { pattern: "/onboarding/covenant", render: () => <Covenant /> },
  { pattern: "/edit/reasons", render: () => <Reasons editing /> },
  { pattern: "/edit/experiences", render: () => <Experiences editing /> },
  { pattern: "/today", render: () => <Today /> },
  { pattern: "/story/:id", render: () => <StoryScreen /> },
  { pattern: "/people/:id", render: () => <Person /> },
  { pattern: "/circles", render: () => <Circles /> },
  { pattern: "/circles/:id", render: () => <CircleScreen /> },
  { pattern: "/share", render: () => <Share /> },
  { pattern: "/shared/:id", render: () => <Shared /> },
  { pattern: "/you", render: () => <You /> },
  { pattern: "/resources", render: () => <Resources /> },
  { pattern: "/professionals", render: () => <Professionals /> },
  { pattern: "/professionals/:id", render: () => <ProfessionalDetail /> },
  { pattern: "/plus", render: () => <Plus /> },
  { pattern: "/plus/journal", render: () => <Journal /> },
  { pattern: "/plus/programs", render: () => <Programs /> },
  { pattern: "/plus/sessions", render: () => <Sessions /> },
  { pattern: "/pro", render: () => <Pro /> },
  { pattern: "/pro/apply", render: () => <ProApply /> },
  { pattern: "/organizations", render: () => <Organizations /> },
];


/** Keeps the app in step with the real sign-in: restores a member who is
 * still signed in, and signs out anyone whose sign-in has ended. */
function useRealSession() {
  const { state, set, reset } = useJourney();
  useEffect(() => {
    if (state.session === "signedOut" && signedIn()) {
      myProfile().then(p => {
        if (p && p.confirmed_adult && p.display_name.trim()) {
          set(s => ({ ...s, session: "member", role: p.is_founder ? "founder" : "member", displayName: p.display_name,
            confirmedAdultAt: s.confirmedAdultAt ?? new Date().toISOString(),
            profile: { ...s.profile, shortLine: p.short_line ?? "", learning: p.learning ?? "", navigating: p.currently_navigating as any, speakFrom: p.can_speak_from as any } }));
        }
      }).catch(() => { /* offline: stay signed out */ });
    } else if (state.session === "member") {
      currentSession().then(s => { if (!s) reset(); }).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

function useAccessRules() {
  const { state } = useJourney();
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    const isPublic = PUBLIC.some(r => r.test(path));
    if (state.session === "signedOut" && !isPublic) router.reset("/");
    else if (state.session === "onboarding" && !isPublic && !ONBOARDING.test(path)) router.reset("/onboarding/reasons");
    else if (state.session === "member" && (path === "/" || path.startsWith("/join/"))) router.reset("/today");
    else if (state.session === "member" && !canOpen(path, effectiveRole(state))) router.reset("/today");
  }, [state.session, path, state.role, state.asMember]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function App() {
  useRealSession();
  useAccessRules();
  return (
    <div className="layout">
      <div className="shell">
        <Routes routes={routes} fallback={() => <Welcome />} />
      </div>
      <aside className="guide" aria-label="Beta guide">
        <h2>HUMAN, TOO beta build</h2>
        <p>Sign-in and profiles are real. Stories, Circles and people are still sample content while we build.</p>
        <p>To see the safety check, write a Story that includes "feeling hopeless" or "I want to die".</p>
      </aside>
      <SheetHost />
      <Toast />
    </div>
  );
}
