import type { ReactNode } from "react";
import { HTile, Icon } from "./Icon";
import { Link, usePathname, useRouter } from "../router/router";
import { useJourney } from "../state/journey";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={"wordmark " + className}>
      <HTile className="tile" />
      <span>HUMAN<span className="comma">,</span> TOO</span>
    </span>
  );
}

/** Always one tap from support (AC-G-01). */
export function SupportButton() {
  const { openSheet } = useJourney();
  return (
    <button className="support-btn" onClick={() => openSheet({ kind: "support" })} aria-label="I need support now">
      <Icon name="support" size={18} /> Support
    </button>
  );
}

export function TopBar({ title, back, divided = true, right }: { title?: ReactNode; back?: boolean; divided?: boolean; right?: ReactNode }) {
  const router = useRouter();
  return (
    <header className={"topbar" + (divided ? " divided" : "") + (back ? " with-back" : "")}>
      {back && <button className="icon-btn" onClick={router.back} aria-label="Back"><Icon name="back" /></button>}
      <div className="title">{title ?? <Wordmark />}</div>
      {right}
      <SupportButton />
    </header>
  );
}

/** Onboarding header: back, 4-step progress (S2 to S5), support. */
export function StepsBar({ step }: { step: 1 | 2 | 3 | 4 }) {
  const router = useRouter();
  return (
    <header className="topbar with-back">
      <button className="icon-btn" onClick={router.back} aria-label="Back"><Icon name="back" /></button>
      <div className="steps-bar" role="progressbar" aria-label={`Step ${step} of 4`} aria-valuemin={1} aria-valuemax={4} aria-valuenow={step}>
        {[1, 2, 3, 4].map(i => <i key={i} className={i <= step ? "on" : ""} />)}
      </div>
      <SupportButton />
    </header>
  );
}

export function BottomNav() {
  const path = usePathname();
  const is = (p: string) => (path === p || path.startsWith(p + "/")) ? { "aria-current": "page" as const } : {};
  return (
    <nav className="bottomnav" aria-label="Main">
      <Link href="/today" {...is("/today")} aria-label="Today"><Icon name="home" size={26} filled={path === "/today"} strokeWidth={path === "/today" ? 0 : 1.7} /></Link>
      <Link href="/circles" {...is("/circles")} aria-label="Circles"><Icon name="circles" size={26} strokeWidth={path.startsWith("/circles") ? 2.3 : 1.7} /></Link>
      <Link href="/share" aria-label="Share your Story"><span className="compose"><Icon name="plus" size={22} strokeWidth={2.2} /></span></Link>
      <Link href="/you" {...is("/you")} aria-label="You"><Icon name="user" size={26} strokeWidth={path === "/you" ? 2.3 : 1.7} /></Link>
    </nav>
  );
}

const TONES = ["#F2D5C4", "#DCE7DE", "#E7DFF0", "#F3E3BC", "#D6E5EE", "#EFD4D8", "#E4E0D6"];
export function Avatar({ name, size = "", anonymous = false, photo }: { name?: string; size?: "" | "sm" | "lg"; anonymous?: boolean; photo?: string | null }) {
  if (anonymous || !name) return <span className={`avatar anon ${size}`} aria-hidden="true"><Icon name="user" size={size === "sm" ? 16 : 20} /></span>;
  if (photo) return <img className={`avatar ${size}`} src={photo} alt="" aria-hidden="true" />;
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const initials = name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return <span className={`avatar ${size}`} style={{ background: TONES[h % TONES.length] }} aria-hidden="true">{initials}</span>;
}

export function PrivacyLine({ children }: { children: ReactNode }) {
  return <p className="privacy-line"><Icon name="lock" size={15} />{children}</p>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="error" role="alert"><Icon name="alert" size={18} /><span>{children}</span></p>;
}
