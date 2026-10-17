import { useState, type ReactNode } from "react";
import { Icon } from "../components/Icon";
import { BottomNav, ErrorText, PrivacyLine, TopBar } from "../components/Chrome";
import { Link, useParams, useRouter } from "../router/router";
import { useJourney } from "../state/journey";
import {
  ALWAYS_FREE, CORPORATE, CREDENTIALS, JOURNAL_PROMPTS, LIVE_SESSIONS, PLUS, PRO, PROFESSIONALS, PROGRAMS, SAMPLE_REPORT,
  AFTER_BETA_LABEL, US_STATES, searchProfessionals, type DirectoryFilter, type Professional,
} from "../lib/offerings";
import { isEmail } from "../lib/safety";

function Page({ title, children, nav = true }: { title: string; children: ReactNode; nav?: boolean }) {
  const { state } = useJourney();
  nav = nav && state.session === "member";
  return (
    <>
      <TopBar back title={title} />
      <main className="main">{children}</main>
      {nav && <BottomNav />}
    </>
  );
}

function PreviewNote({ children }: { children: ReactNode }) {
  return <p className="preview-note"><Icon name="info" size={16} />{children}</p>;
}

/* ---------------- Hub ---------------- */
export function Resources() {
  const { state } = useJourney();
  const row = (href: string, icon: Parameters<typeof Icon>[0]["name"], title: string, body: string, tag?: string) => (
    <Link href={href} className="hub-row">
      <span className="hub-icon"><Icon name={icon} /></span>
      <span className="grow stack g4"><span className="row g8 wrap"><span className="strong">{title}</span>{tag && <span className="tier-tag">{tag}</span>}<span className="tier-tag later">{AFTER_BETA_LABEL}</span></span><span className="small muted">{body}</span></span>
      <span className="chev"><Icon name="chevron" size={18} /></span>
    </Link>
  );
  return (
    <Page title="Support and growth">
      <div className="gutter stack g8 pt24">
        <h1 className="headline">More ways to be supported</h1>
        <p className="muted">Community comes first here. These add professional support and structure when you want it.</p>
        <PreviewNote>Founder view: these arrive after beta, and beta members can't see this page. Corporate Plus and Pro applications are also public pages during beta.</PreviewNote>
      </div>
      <div className="hub-list">
        {row("/professionals", "heal", "Find a professional", "Verified therapists and counselors, by state and approach.", "Free")}
        {row("/plus", "star", PLUS.name, state.plus.active ? "Your journal, programs and live sessions." : "Private journal, guided programs and live sessions with professionals.", state.plus.active ? "Active" : undefined)}
        {row("/pro", "check", PRO.name, "For licensed mental-health professionals.")}
        {row("/organizations", "case", CORPORATE.name, "Bring HUMAN, TOO to your company, campus or nonprofit.")}
      </div>
      <div className="gutter pb24"><PrivacyLine>In crisis? The Support button at the top is always free and always there.</PrivacyLine></div>
    </Page>
  );
}

/* ---------------- Free professional directory ---------------- */
export function Professionals() {
  const [f, setF] = useState<DirectoryFilter>({ state: "TX", accepting: true });
  const results = searchProfessionals(PROFESSIONALS, f);
  const toggle = (k: "telehealth" | "faith" | "accepting") => setF({ ...f, [k]: !f[k] });
  return (
    <Page title="Find a professional">
      <div className="gutter stack g12 pt24">
        <h1 className="headline">Find a professional</h1>
        <p className="muted">Every professional here is licensed and verified by HUMAN, TOO. Finding one is always free, and no one can pay to appear higher.</p>
        <div className="row g8 wrap">
          <label className="sr-only" htmlFor="pro-state">State</label>
          <select id="pro-state" className="input" style={{ width: "auto", minHeight: 42, borderRadius: 999, padding: "0 14px" }} value={f.state ?? ""} onChange={e => setF({ ...f, state: e.target.value || undefined })}>
            <option value="">Any state</option>{US_STATES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="pill plain" aria-pressed={!!f.accepting} onClick={() => toggle("accepting")}>Accepting clients</button>
          <button className="pill plain" aria-pressed={!!f.telehealth} onClick={() => toggle("telehealth")}>Telehealth</button>
          <button className="pill plain" aria-pressed={!!f.faith} onClick={() => toggle("faith")}>Faith-integrated</button>
        </div>
        <input className="input" aria-label="Search by topic" placeholder="Search a topic, like grief or burnout" value={f.topic ?? ""} onChange={e => setF({ ...f, topic: e.target.value || undefined })} />
        <p className="tiny muted">Listed alphabetically. Sample professionals for this preview.</p>
      </div>
      <div className="feed pt8">
        {results.map(p => <ProfessionalRow key={p.id} p={p} />)}
        {results.length === 0 && <div className="empty"><p className="lede">No one matches all of those filters yet. Try another state or remove a filter.</p></div>}
      </div>
      <div className="gutter pb24 pt24"><PrivacyLine>HUMAN, TOO doesn't provide therapy. You'll reach professionals through their own practice.</PrivacyLine></div>
    </Page>
  );
}

function ProfessionalRow({ p }: { p: Professional }) {
  return (
    <Link href={"/professionals/" + p.id} className="post" style={{ gridTemplateColumns: "48px 1fr" }}>
      <span className="avatar" style={{ width: 48, height: 48, background: "var(--bg-2)" }} aria-hidden="true"><Icon name="heal" /></span>
      <span className="stack g4">
        <span className="row g8 wrap"><span className="strong">{p.name}</span><span className="verified"><Icon name="check" size={13} strokeWidth={2.4} />Verified</span></span>
        <span className="small muted">{p.credential} · {p.licensedIn.join(", ")}</span>
        <span className="small">{p.specialties.join(" · ")}</span>
        <span className="tiny muted">{p.formats.join(" · ")}{p.faithIntegrated ? " · Faith-integrated" : ""} · {p.acceptingClients ? "Accepting new clients" : "Waitlist"}</span>
      </span>
    </Link>
  );
}

export function ProfessionalDetail() {
  const { id } = useParams<{ id: string }>();
  const p = PROFESSIONALS.find(x => x.id === id);
  if (!p) return <Page title="Professional"><div className="empty"><p className="lede">This profile isn't available.</p></div></Page>;
  return (
    <Page title={p.name}>
      <div className="profile-head">
        <span className="avatar lg" style={{ background: "var(--bg-2)" }} aria-hidden="true"><Icon name="heal" size={34} /></span>
        <div className="stack g4">
          <h1 className="headline">{p.name}</h1>
          <p className="muted">{p.credential}</p>
          <span className="verified" style={{ alignSelf: "flex-start" }}><Icon name="check" size={13} strokeWidth={2.4} />Verified {p.verifiedOn} · licensed in {p.licensedIn.join(", ")}</span>
        </div>
        <p className="quote">“{p.approach}”</p>
      </div>
      <section className="profile-section"><span className="section-label">Focus areas</span><div className="pills">{p.specialties.map(s => <span key={s} className="pill plain" style={{ cursor: "default" }}>{s}</span>)}</div></section>
      <section className="profile-section">
        <span className="section-label">Details</span>
        <dl className="details">
          <dt>Sessions</dt><dd>{p.formats.join(", ")}</dd>
          <dt>Languages</dt><dd>{p.languages.join(", ")}</dd>
          <dt>Faith-integrated care</dt><dd>{p.faithIntegrated ? "Available if you'd like it" : "Not offered"}</dd>
          <dt>New clients</dt><dd>{p.acceptingClients ? "Accepting" : "Waitlist only"}</dd>
        </dl>
      </section>
      <section className="profile-section">
        <span className="section-label">How to reach them</span>
        <p>Contact {p.name.replace(/^Dr\. /, "")} through their own practice: <span className="strong">{p.practice}</span>.</p>
        <p className="small muted">HUMAN, TOO doesn't book appointments, handle payment or share anything about you with professionals. What you share on HUMAN, TOO stays here.</p>
        <PreviewNote>In the live app, this links to the practice's own website.</PreviewNote>
      </section>
      <div className="pb24" />
    </Page>
  );
}

/* ---------------- HUMAN, TOO+ ---------------- */
export function Plus() {
  const { state, set, say } = useJourney();
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const active = state.plus.active;

  if (active) {
    return (
      <Page title={PLUS.name}>
        <div className="tier-hero">
          <span className="tier-mark" aria-hidden="true">+</span>
          <h1 className="headline">Your {PLUS.name}</h1>
          <p className="muted">{state.plus.via === "organization" ? `Covered by ${state.plus.organization}. They can't see whether you use it or what you do here.` : "Preview membership. Nothing is being charged."}</p>
        </div>
        <div className="hub-list">
          <Link href="/plus/journal" className="hub-row"><span className="hub-icon"><Icon name="edit" /></span><span className="grow stack g4"><span className="strong">Reflection journal</span><span className="small muted">{state.journal.length ? `${state.journal.length} private ${state.journal.length === 1 ? "entry" : "entries"}` : "Only you will ever see it."}</span></span><span className="chev"><Icon name="chevron" size={18} /></span></Link>
          <Link href="/plus/programs" className="hub-row"><span className="hub-icon"><Icon name="sunrise" /></span><span className="grow stack g4"><span className="strong">Guided programs</span><span className="small muted">{state.programsStarted.length ? `${state.programsStarted.length} in progress` : "Built with verified professionals."}</span></span><span className="chev"><Icon name="chevron" size={18} /></span></Link>
          <Link href="/plus/sessions" className="hub-row"><span className="hub-icon"><Icon name="people" /></span><span className="grow stack g4"><span className="strong">Live sessions</span><span className="small muted">Small Q&As and workshops with professionals.</span></span><span className="chev"><Icon name="chevron" size={18} /></span></Link>
          <Link href="/professionals" className="hub-row"><span className="hub-icon"><Icon name="heal" /></span><span className="grow stack g4"><span className="strong">Find a professional</span><span className="small muted">Free for everyone, always.</span></span><span className="chev"><Icon name="chevron" size={18} /></span></Link>
        </div>
        <div className="gutter stack g12 pt24 pb24">
          <PrivacyLine>Being a member is private. No badge, no status, nothing others can see.</PrivacyLine>
          <button className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => { set(s => ({ ...s, plus: { active: false, via: null, organization: null } })); say("Your preview membership ended. Everything that's always free stays with you."); }}>End membership</button>
        </div>
      </Page>
    );
  }

  return (
    <Page title={PLUS.name}>
      <div className="tier-hero">
        <span className="tier-mark" aria-hidden="true">+</span>
        <h1 className="display" style={{ fontSize: 28 }}>{PLUS.name}</h1>
        <p className="lede">Deeper support for the seasons you're in, with guidance from verified professionals.</p>
      </div>
      <div className="gutter stack g24">
        <div className="choice-list">
          {PLUS.features.map(f => <div key={f.title} className="choice" style={{ alignItems: "flex-start" }}><span className="tick" style={{ background: "var(--primary)", borderColor: "var(--primary)" }}><Icon name="check" size={15} strokeWidth={2.4} /></span><span><span className="strong">{f.title}</span><span className="desc">{f.body}</span></span></div>)}
        </div>
        <div className="banner stack g8">
          <span className="strong">Always free, for everyone</span>
          <ul className="stack g4 small" style={{ margin: 0, paddingLeft: 18 }}>{ALWAYS_FREE.map(x => <li key={x}>{x}</li>)}</ul>
        </div>
        <div className="stack g8">
          <p className="headline" style={{ fontSize: 22 }}>{PLUS.priceLabel}</p>
          <p className="small muted">{PLUS.priceNote}</p>
          <button className="btn btn-primary btn-block" onClick={() => { set(s => ({ ...s, plus: { active: true, via: "self", organization: null } })); say(`Welcome to ${PLUS.name}. This is a preview, so nothing is charged.`); }}>Try the {PLUS.name} preview</button>
        </div>
        <form className="stack g8 pb24" onSubmit={e => {
          e.preventDefault();
          if (code.trim().toUpperCase() !== CORPORATE.sampleOrg.code) { setCodeErr("That code isn't working. Check it with your organization."); return; }
          set(s => ({ ...s, plus: { active: true, via: "organization", organization: CORPORATE.sampleOrg.name } }));
          say(`${PLUS.name} is covered by ${CORPORATE.sampleOrg.name}.`);
        }}>
          <label className="label" htmlFor="org-code">Have a code from your employer, school or organization?</label>
          <div className="row g8"><input id="org-code" className="input" value={code} onChange={e => { setCode(e.target.value); setCodeErr(null); }} autoCapitalize="characters" placeholder={`Try ${CORPORATE.sampleOrg.code}`} /><button className="btn btn-secondary" type="submit">Use code</button></div>
          {codeErr && <ErrorText>{codeErr}</ErrorText>}
          <PrivacyLine>Your organization never sees whether you joined or anything you do here.</PrivacyLine>
        </form>
      </div>
    </Page>
  );
}

function PlusOnly({ children, title }: { children: ReactNode; title: string }) {
  const { state } = useJourney();
  if (state.plus.active) return <>{children}</>;
  return <Page title={title}><div className="empty"><p className="lede">This is part of {PLUS.name}.</p><Link href="/plus" className="btn btn-primary btn-sm">See {PLUS.name}</Link></div></Page>;
}

export function Journal() {
  const { state, set, say } = useJourney();
  const [i, setI] = useState(state.journal.length % JOURNAL_PROMPTS.length);
  const [text, setText] = useState("");
  return (
    <PlusOnly title="Reflection journal">
      <Page title="Reflection journal">
        <div className="gutter stack g16 pt24">
          <PrivacyLine>Only you can see your journal. It's never shared, never used for ads, and never seen by any organization.</PrivacyLine>
          <div className="stack g8">
            <p className="headline" style={{ fontSize: 21 }}>{JOURNAL_PROMPTS[i]}</p>
            <button className="text-btn quiet" style={{ alignSelf: "flex-start", fontSize: 14, padding: 0 }} onClick={() => setI((i + 1) % JOURNAL_PROMPTS.length)}>Try another prompt</button>
          </div>
          <label htmlFor="journal" className="sr-only">Your reflection</label>
          <textarea id="journal" className="input" rows={6} placeholder="Write as much or as little as you want." value={text} onChange={e => setText(e.target.value)} />
          <button className="btn btn-primary" disabled={!text.trim()} onClick={() => {
            set(s => ({ ...s, journal: [{ id: "j" + Date.now(), prompt: JOURNAL_PROMPTS[i], text: text.trim(), dateLabel: "Today" }, ...s.journal] }));
            setText(""); setI((i + 1) % JOURNAL_PROMPTS.length); say("Saved to your journal.");
          }}>Save privately</button>
        </div>
        <div className="section-head"><h2>Earlier</h2></div>
        {state.journal.length === 0 && <p className="gutter muted pb24">Your reflections will live here.</p>}
        <div className="feed pb24">
          {state.journal.map(j => (
            <div key={j.id} className="gutter stack g4" style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)" }}>
              <span className="tiny muted">{j.dateLabel} · {j.prompt}</span>
              <p>{j.text}</p>
              <button className="text-btn quiet" style={{ alignSelf: "flex-start", fontSize: 13.5, padding: 0, minHeight: 32 }} onClick={() => set(s => ({ ...s, journal: s.journal.filter(x => x.id !== j.id) }))}>Delete</button>
            </div>
          ))}
        </div>
      </Page>
    </PlusOnly>
  );
}

export function Programs() {
  const { state, set, say } = useJourney();
  return (
    <PlusOnly title="Guided programs">
      <Page title="Guided programs">
        <div className="gutter stack g8 pt24"><p className="muted">Short, gentle programs built with verified professionals. They support, and never replace, care from a professional.</p></div>
        <div className="feed pt8">
          {PROGRAMS.map(p => {
            const started = state.programsStarted.includes(p.id);
            return (
              <div key={p.id} className="circle-row" style={{ alignItems: "flex-start", borderBottom: "1px solid var(--line)", padding: "18px 20px" }}>
                <span className="stack g4 grow">
                  <span className="strong">{p.title}</span>
                  <span className="small">{p.blurb}</span>
                  <span className="tiny muted">{p.length} · {p.guide}</span>
                  {started && <span className="tiny" style={{ color: "var(--accent)", fontWeight: 600 }}>Day 1 is ready for you</span>}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  set(s => ({ ...s, programsStarted: started ? s.programsStarted.filter(x => x !== p.id) : [...s.programsStarted, p.id] }));
                  say(started ? "Program paused. Pick it up anytime." : `Started ${p.title}. No streaks, no pressure.`);
                }}>{started ? "Pause" : "Start"}</button>
              </div>
            );
          })}
        </div>
      </Page>
    </PlusOnly>
  );
}

export function Sessions() {
  const { state, set, say } = useJourney();
  return (
    <PlusOnly title="Live sessions">
      <Page title="Live sessions">
        <div className="gutter stack g8 pt24"><p className="muted">Small, moderated sessions with verified professionals. Join with your camera off, anonymously if you like. Sessions are educational, not therapy.</p></div>
        <div className="feed pt8">
          {LIVE_SESSIONS.map(x => {
            const saved = state.sessionsReserved.includes(x.id);
            return (
              <div key={x.id} className="circle-row" style={{ alignItems: "flex-start", borderBottom: "1px solid var(--line)", padding: "18px 20px" }}>
                <span className="stack g4 grow"><span className="strong">{x.title}</span><span className="small">{x.when}</span><span className="tiny muted">With {x.host} · {x.seats}</span></span>
                <button className={"btn btn-sm " + (saved ? "btn-secondary" : "btn-primary")} onClick={() => {
                  set(s => ({ ...s, sessionsReserved: saved ? s.sessionsReserved.filter(y => y !== x.id) : [...s.sessionsReserved, x.id] }));
                  say(saved ? "Your seat is released." : "Your seat is saved. We'll remind you the day before.");
                }}>{saved ? "Saved" : "Save a seat"}</button>
              </div>
            );
          })}
        </div>
      </Page>
    </PlusOnly>
  );
}

/* ---------------- HUMAN, TOO Pro ---------------- */
export function Pro() {
  const { state, set, say } = useJourney();
  const a = state.proApplication;
  const router = useRouter();
  return (
    <Page title={PRO.name}>
      <div className="tier-hero">
        <span className="tier-mark" aria-hidden="true"><Icon name="check" size={26} strokeWidth={2.4} /></span>
        <h1 className="display" style={{ fontSize: 28 }}>{PRO.name}</h1>
        <p className="lede">For licensed mental-health professionals who want to support people where they already find each other.</p>
      </div>
      <div className="gutter stack g24 pb24">
        {a.status === "none" && (
          <>
            <div className="choice-list">{PRO.features.map(f => <div key={f.title} className="choice" style={{ alignItems: "flex-start" }}><span className="tick" style={{ background: "var(--primary)", borderColor: "var(--primary)" }}><Icon name="check" size={15} strokeWidth={2.4} /></span><span><span className="strong">{f.title}</span><span className="desc">{f.body}</span></span></div>)}</div>
            <div className="banner stack g8"><span className="strong">How Pro stays trustworthy</span><ul className="stack g4 small" style={{ margin: 0, paddingLeft: 18 }}>{PRO.rules.map(r => <li key={r}>{r}</li>)}</ul></div>
            <div className="gentle small"><span><span className="strong">Early applications are open.</span> The directory opens to members after beta. Apply now and we'll verify you so your listing is ready on day one.</span></div>
            <p className="small muted">{PRO.priceLabel}. You only pay after you're verified.</p>
            <button className="btn btn-primary btn-block" onClick={() => router.push("/pro/apply")}>Apply early for verification</button>
          </>
        )}
        {a.status === "pending" && (
          <>
            <div className="gentle">
              <p className="strong">Your application is in review.</p>
              <p className="small">We're checking your identity, your {a.credential || "license"} in {a.state}, and public disciplinary records. This usually takes a few business days. We'll let you know either way.</p>
            </div>
            <ol className="stack g8" style={{ margin: 0, paddingLeft: 22 }}>
              <li>Identity confirmed</li><li>License verified with the {a.state} licensing board</li><li>Disciplinary records checked</li><li>Profile goes live in the free directory</li>
            </ol>
            <PreviewNote>This preview can't verify anyone. Tap below to see what a verified profile looks like.</PreviewNote>
            <button className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => { set(s => ({ ...s, proApplication: { ...s.proApplication, status: "verified" } })); say("Preview: verification approved."); }}>Show a verified profile</button>
          </>
        )}
        {a.status === "verified" && (
          <>
            <div className="stack g8">
              <span className="section-label">Your directory listing (preview)</span>
              <div className="post" style={{ gridTemplateColumns: "48px 1fr", padding: "16px 0", borderTop: "1px solid var(--line)" }}>
                <span className="avatar" style={{ width: 48, height: 48, background: "var(--bg-2)" }} aria-hidden="true"><Icon name="heal" /></span>
                <span className="stack g4">
                  <span className="row g8 wrap"><span className="strong">{a.fullName}</span><span className="verified"><Icon name="check" size={13} strokeWidth={2.4} />Verified</span></span>
                  <span className="small muted">{a.credential} · {a.state}</span>
                </span>
              </div>
            </div>
            <div className="hub-list" style={{ marginInline: -20 }}>
              <div className="hub-row"><span className="hub-icon"><Icon name="edit" /></span><span className="grow stack g4"><span className="strong">Write a Professional Perspective</span><span className="small muted">Labelled as professional education, not personal medical advice.</span></span></div>
              <div className="hub-row"><span className="hub-icon"><Icon name="people" /></span><span className="grow stack g4"><span className="strong">Offer a live session</span><span className="small muted">Moderated, small, educational.</span></span></div>
            </div>
            <PreviewNote>Perspectives and sessions are shown as placeholders in this preview.</PreviewNote>
            <button className="text-btn quiet" style={{ alignSelf: "flex-start" }} onClick={() => set(s => ({ ...s, proApplication: { status: "none", fullName: "", credential: "", state: "", licenseNumber: "" } }))}>Reset Pro preview</button>
          </>
        )}
      </div>
    </Page>
  );
}

export function ProApply() {
  const { state, set, say } = useJourney();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", credential: "", state: "", licenseNumber: "", attest: false });
  const ready = form.fullName.trim().length > 3 && form.credential && form.state && form.licenseNumber.trim().length >= 4 && form.attest;
  return (
    <Page title="Apply for verification" nav={false}>
      <form className="gutter stack g16 pt24 pb24" onSubmit={e => {
        e.preventDefault(); if (!ready) return;
        set(s => ({ ...s, proApplication: { status: "pending", fullName: form.fullName.trim(), credential: form.credential, state: form.state, licenseNumber: form.licenseNumber.trim() } }));
        say("Application received."); router.replace("/pro");
      }}>
        <p className="muted">We verify every professional before they appear anywhere on HUMAN, TOO. {state.displayName ? "Your member account stays separate from your professional listing." : ""}</p>
        <div className="field"><label htmlFor="pf-name">Full legal name</label><input id="pf-name" className="input" autoComplete="name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /><p className="help">As it appears on your license.</p></div>
        <div className="field"><label htmlFor="pf-cred">License type</label><select id="pf-cred" className="input" value={form.credential} onChange={e => setForm({ ...form, credential: e.target.value })}><option value="">Choose one</option>{CREDENTIALS.map(c => <option key={c}>{c}</option>)}</select></div>
        <div className="row g8">
          <div className="field" style={{ width: 120 }}><label htmlFor="pf-state">State</label><select id="pf-state" className="input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}><option value="">—</option>{US_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="field grow"><label htmlFor="pf-lic">License number</label><input id="pf-lic" className="input" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} /></div>
        </div>
        <p className="help">In the live app you'll also verify your identity with a photo ID. We never show your license number publicly.</p>
        <label className="checkbox"><input type="checkbox" checked={form.attest} onChange={e => setForm({ ...form, attest: e.target.checked })} /><span>My license is active and in good standing, and I'll follow the Community Covenant and the Pro guidelines, including never offering diagnosis or treatment inside HUMAN, TOO.</span></label>
        <button className="btn btn-primary btn-block" type="submit" disabled={!ready}>Submit for verification</button>
        <PreviewNote>Nothing is sent in this preview.</PreviewNote>
      </form>
    </Page>
  );
}

/* ---------------- Corporate Plus ---------------- */
export function Organizations() {
  const { state, set, say } = useJourney();
  const [form, setForm] = useState({ org: "", type: "", people: "", email: "" });
  const [err, setErr] = useState<string | null>(null);
  const signedIn = state.session === "member";
  return (
    <>
      <TopBar back title={CORPORATE.name} />
      <main className="main">
        <div className="tier-hero">
          <span className="tier-mark" aria-hidden="true"><Icon name="case" size={26} /></span>
          <h1 className="display" style={{ fontSize: 28 }}>{CORPORATE.name}</h1>
          <p className="lede">Help your people feel less alone at work, on campus or in your community, with outcomes you can measure and privacy they can trust.</p>
        </div>
        <div className="gutter stack g32 pb24">
          <section className="stack g12">
            <h2 className="headline" style={{ fontSize: 20 }}>What's included</h2>
            <div className="choice-list">{CORPORATE.offer.map(o => <div key={o.title} className="choice" style={{ alignItems: "flex-start" }}><span className="tick" style={{ background: "var(--primary)", borderColor: "var(--primary)" }}><Icon name="check" size={15} strokeWidth={2.4} /></span><span><span className="strong">{o.title}</span><span className="desc">{o.body}</span></span></div>)}</div>
          </section>

          <section className="stack g12">
            <h2 className="headline" style={{ fontSize: 20 }}>Start with an 8-week pilot</h2>
            <ol className="stack g8" style={{ margin: 0, paddingLeft: 22 }}>{CORPORATE.pilot.map(p => <li key={p}>{p}</li>)}</ol>
          </section>

          <section className="stack g12">
            <h2 className="headline" style={{ fontSize: 20 }}>We sell outcomes, not surveillance</h2>
            <div className="firewall">
              <div className="stack g8"><span className="strong small">You'll see</span><ul className="stack g4 small" style={{ margin: 0, paddingLeft: 18 }}>{CORPORATE.sees.map(x => <li key={x}>{x}</li>)}</ul></div>
              <div className="stack g8"><span className="strong small">You'll never see</span><ul className="stack g4 small" style={{ margin: 0, paddingLeft: 18 }}>{CORPORATE.neverSees.map(x => <li key={x}>{x}</li>)}</ul></div>
            </div>
            <p className="small muted">No figure is ever reported for a group smaller than 10 people, so no one can be identified by elimination.</p>
          </section>

          <section className="stack g12">
            <h2 className="headline" style={{ fontSize: 20 }}>A sample impact report</h2>
            <div className="report" role="table" aria-label="Sample impact report">
              <div className="report-head" role="row"><span role="columnheader">{SAMPLE_REPORT.org}</span><span role="columnheader">{SAMPLE_REPORT.period}</span></div>
              {SAMPLE_REPORT.rows.map(r => <div key={r.label} className="report-row" role="row"><span role="cell">{r.label}</span><span role="cell" className="strong">{r.value}</span></div>)}
            </div>
            <p className="tiny muted">Sample figures for illustration only.</p>
          </section>

          <section className="stack g12">
            <h2 className="headline" style={{ fontSize: 20 }}>Talk with us about a pilot</h2>
            {state.pilotRequested ? (
              <div className="gentle"><p className="strong">Thank you.</p><p className="small">In the live app, our partnerships team would reach out within two business days. This preview didn't send anything.</p></div>
            ) : (
              <form className="stack g12" onSubmit={e => {
                e.preventDefault();
                if (!form.org.trim() || !form.type || !isEmail(form.email)) { setErr("Please add your organization, its type and a work email."); return; }
                set(s => ({ ...s, pilotRequested: true })); say("Request received (preview only).");
              }}>
                <div className="field"><label htmlFor="org-name">Organization</label><input id="org-name" className="input" value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} /></div>
                <div className="field"><label htmlFor="org-type">Type</label><select id="org-type" className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="">Choose one</option><option>Employer</option><option>University or college</option><option>Nonprofit or community organization</option><option>Health or mental-health organization</option></select></div>
                <div className="field"><label htmlFor="org-people">About how many people?</label><input id="org-people" className="input" inputMode="numeric" value={form.people} onChange={e => setForm({ ...form, people: e.target.value.replace(/\D/g, "") })} /></div>
                <div className="field"><label htmlFor="org-email">Work email</label><input id="org-email" className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                {err && <ErrorText>{err}</ErrorText>}
                <button className="btn btn-primary btn-block" type="submit">Request a conversation</button>
                <p className="tiny muted">Pricing is shared during discovery. Nothing is sent in this preview.</p>
              </form>
            )}
          </section>
        </div>
      </main>
      {signedIn && <BottomNav />}
    </>
  );
}
