import { useEffect, useState } from "react";
import { COMMA_PATH, H_PATH, Icon } from "../components/Icon";
import { ErrorText, PrivacyLine, StepsBar, SupportButton, TopBar, Wordmark } from "../components/Chrome";
import { Link, useParams, useRouter } from "../router/router";
import { useJourney } from "../state/journey";
import { COVENANT, COVENANT_VERSION, EXPERIENCES, FOUNDER_NOTE, MAX_EXPERIENCES, PROFESSIONAL_REASON_INDEX, PROTOTYPE, REASONS } from "../lib/content";
import { ageOn, displayNameProblem, isEmail } from "../lib/safety";
import { BackendError, myProfile, saveProfile, sendCode, verifyCode } from "../lib/backend";
import { BETA_INVITE_CODES } from "../lib/config";

/* ---------------- S1 Welcome ---------------- */
export function Welcome() {
  const { set } = useJourney();
  const router = useRouter();
  const begin = (mode: "signup" | "signin") => { set(s => ({ ...s, mode })); router.push("/join/email"); };
  return (
    <div className="welcome">
      <div className="welcome-art" aria-hidden="true">
        <svg viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="w1" cx="30%" cy="35%" r="60%"><stop offset="0" stopColor="#F4C9AE" /><stop offset="1" stopColor="#F4C9AE" stopOpacity="0" /></radialGradient>
            <radialGradient id="w2" cx="75%" cy="60%" r="55%"><stop offset="0" stopColor="#C9D8CC" /><stop offset="1" stopColor="#C9D8CC" stopOpacity="0" /></radialGradient>
            <radialGradient id="w3" cx="55%" cy="15%" r="45%"><stop offset="0" stopColor="#F7E3C8" /><stop offset="1" stopColor="#F7E3C8" stopOpacity="0" /></radialGradient>
            <linearGradient id="fadeW" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" style={{ stopColor: "var(--bg)", stopOpacity: 0 }} /><stop offset="1" style={{ stopColor: "var(--bg)" }} /></linearGradient>
          </defs>
          <rect width="400" height="420" style={{ fill: "var(--bg)" }} />
          <rect width="400" height="420" fill="url(#w3)" />
          <rect width="400" height="420" fill="url(#w1)" />
          <rect width="400" height="420" fill="url(#w2)" />
          <rect width="400" height="420" fill="url(#fadeW)" />
          <g transform="translate(136 146) scale(.125)"><rect x="4" y="4" width="1016" height="1016" rx="228" fill="#FAF7F4" stroke="#E6E0DA" strokeWidth="8" /><g transform="translate(226.8 206.2) scale(4.4)"><path fill="#1E2F27" d={H_PATH} /></g><g transform="translate(645.8 584.7) scale(1.27)"><path fill="#B4553A" d={COMMA_PATH} /></g></g>
        </svg>
      </div>
      <div className="welcome-body">
        <div className="stack g8">
          <Wordmark />
          <p className="muted">Feel seen. Be known. Find your people.</p>
        </div>
        <h1 className="display">Being visible isn't the same as being seen.</h1>
        <p className="lede">Find connection through the experiences that make us human.</p>
        <div className="stack g8">
          <button className="btn btn-primary btn-block" onClick={() => begin("signup")}>Find Your People</button>
          <button className="btn btn-secondary btn-block" onClick={() => begin("signin")}>I already belong here</button>
        </div>
        <div className="welcome-foot">
          <Link href="/our-story">Our story</Link>
          <Link href="/covenant">Community Covenant</Link>
          <Link href="/organizations">For organizations</Link>
          <Link href="/pro">For professionals</Link>
          <span>For adults 18+</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Founder note ---------------- */
export function OurStory() {
  return (
    <>
      <TopBar back title="" divided={false} />
      <div className="letter">
        <p className="small muted">Why HUMAN, TOO exists</p>
        <p style={{ fontSize: 22, lineHeight: 1.4, fontWeight: 600, letterSpacing: "-0.01em" }}>{FOUNDER_NOTE.opening}</p>
        <p>{FOUNDER_NOTE.turn}</p>
        <blockquote>{FOUNDER_NOTE.quote}</blockquote>
        {FOUNDER_NOTE.why.map(p => <p key={p.slice(0, 20)}>{p}</p>)}
        <ul className="stack g8" style={{ margin: 0, paddingLeft: 20 }}>{FOUNDER_NOTE.promises.map(p => <li key={p}>{p}</li>)}</ul>
        <p>{FOUNDER_NOTE.closing}</p>
        <div className="stack g4 pt8">
          <span className="signature">{FOUNDER_NOTE.name}</span>
          <span className="small muted">{FOUNDER_NOTE.title}, HUMAN, TOO</span>
        </div>
      </div>
    </>
  );
}

export function CovenantPage() {
  return (
    <>
      <TopBar back title="Community Covenant" />
      <ol className="letter" style={{ paddingLeft: 44 }}>
        {COVENANT.map(c => <li key={c}>{c}</li>)}
      </ol>
    </>
  );
}

/* ---------------- S2 Account creation ---------------- */
export function Join() {
  const { step } = useParams<{ step: string }>();
  const { state, set, say } = useJourney();
  const router = useRouter();
  const signin = state.mode === "signin";

  const [email, setEmail] = useState(state.email);
  const [invite, setInvite] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [code, setCode] = useState("");
  const [tries, setTries] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [resendAt, setResendAt] = useState(Date.now() + 60_000);
  const [now, setNow] = useState(Date.now());
  const [dob, setDob] = useState({ m: "", d: "", y: "" });
  const [name, setName] = useState(state.displayName);
  const [busy, setBusy] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const header = signin
    ? <header className="topbar with-back"><button className="icon-btn" onClick={router.back} aria-label="Back"><Icon name="back" /></button><div className="grow" /><SupportButton /></header>
    : <StepsBar step={1} />;

  if (step === "email") {
    const ready = isEmail(email) && (signin || (invite.trim() && agree));
    const submit = () => {
      const e: Record<string, string> = {};
      if (!isEmail(email)) e.email = "That email doesn't look quite right. Check it and try again.";
      if (!signin) {
        const c = invite.trim().toUpperCase();
        if (!BETA_INVITE_CODES.includes(c)) e.invite = "We don't recognize that invite code. Check for typos, or ask the person who invited you.";
      }
      setErrors(e);
      if (Object.keys(e).length) return;
      const clean = email.trim().toLowerCase();
      setBusy(true);
      sendCode(clean, !signin)
        .then(() => { set(s => ({ ...s, email: clean })); router.push("/join/code"); })
        .catch((err: BackendError) => {
          if (signin && (err.status === 400 || err.status === 422 || err.code === "otp_disabled" || err.code === "user_not_found"))
            setErrors({ email: "We couldn't find a member with that email. New here? Join with an invite." });
          else if (err.status === 429) setErrors({ email: "Too many codes were sent just now. Please wait a minute and try again." });
          else setErrors({ email: err.message });
        })
        .finally(() => setBusy(false));
    };
    return (
      <>
        {header}
        <form className="gutter stack g24 pt24 grow" onSubmit={e => { e.preventDefault(); if (ready) submit(); }} noValidate>
          <h1 className="headline">{signin ? "Welcome back." : "Let's make you a place here."}</h1>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!errors.email} />
            {errors.email && <ErrorText>{errors.email}</ErrorText>}
          </div>
          {!signin && (
            <>
              <div className="field">
                <label htmlFor="invite">Invite code</label>
                <input id="invite" className="input" autoCapitalize="characters" value={invite} onChange={e => setInvite(e.target.value)} aria-invalid={!!errors.invite} />
                <p className="help">HUMAN, TOO is invite-only while we grow carefully.</p>
                {errors.invite && <ErrorText>{errors.invite}</ErrorText>}
              </div>
              <label className="checkbox"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /><span>I agree to the Terms and Privacy Policy. <span className="muted">(Written with legal counsel before beta.)</span></span></label>
            </>
          )}
          <div className="footer-actions" style={{ marginInline: -20, marginTop: "auto" }}>
            <button className="btn btn-primary btn-block" type="submit" disabled={!ready || busy}>{busy ? "Sending…" : "Send my code"}</button>
            <button type="button" className="text-btn quiet" onClick={() => { setErrors({}); set(s => ({ ...s, mode: signin ? "signup" : "signin" })); }}>
              {signin ? "New here? Join with an invite" : "Already a member? Sign in"}
            </button>
          </div>
        </form>
      </>
    );
  }

  if (step === "code") {
    const locked = lockedUntil > now;
    const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));
    const onCode = (raw: string) => {
      const v = raw.replace(/\D/g, "").slice(0, 6);
      setCode(v);
      if (v.length < 6) return;
      setBusy(true); setErrors({});
      verifyCode(state.email, v)
        .then(() => myProfile())
        .then(p => {
          const done = !!p && p.confirmed_adult && p.display_name.trim().length > 0;
          if (done && p) {
            set(s => ({
              ...s, session: "member", role: p.is_founder ? "founder" : "member", asMember: false, displayName: p.display_name,
              confirmedAdultAt: s.confirmedAdultAt ?? new Date().toISOString(),
              covenant: s.covenant ?? { version: COVENANT_VERSION, agreedAt: new Date().toISOString() },
              profile: { ...s.profile, shortLine: p.short_line ?? "", learning: p.learning ?? "", navigating: p.currently_navigating as any, speakFrom: p.can_speak_from as any },
              todayIds: null,
            }));
            say(`Welcome back, ${p.display_name}.`);
            router.reset("/today");
          } else {
            set(s => ({ ...s, role: p?.is_founder ? "founder" : "member" }));
            router.push("/join/age");
          }
        })
        .catch((err: BackendError) => {
          const n = tries + 1;
          setTries(n); setCode("");
          if (n >= 5) { setLockedUntil(Date.now() + 15 * 60_000); setErrors({}); }
          else if (err.status === 400 || err.status === 401 || err.status === 403) setErrors({ code: "That code didn't match or has expired. Check your email and try again." });
          else setErrors({ code: err.message });
        })
        .finally(() => setBusy(false));
    };
    return (
      <>
        {header}
        <div className="gutter stack g24 pt24">
          <div className="stack g8">
            <h1 className="headline">Check your email.</h1>
            <p className="muted">We sent a 6-digit code to <span className="strong" style={{ color: "var(--ink)" }}>{state.email}</span>. It works for 10 minutes.</p>
          </div>
          <div className="field">
            <label htmlFor="code">6-digit code</label>
            <input id="code" className="input code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} disabled={locked || busy} onChange={e => onCode(e.target.value)} aria-invalid={!!errors.code} autoFocus />
            {errors.code && <ErrorText>{errors.code}</ErrorText>}
            {locked && <p className="banner">For your security, let's pause for 15 minutes before trying again.</p>}
            {busy && <p className="help">Checking your code…</p>}
          </div>
          <div className="row g16 wrap">
            <button className="text-btn" disabled={wait > 0} onClick={() => { setResendAt(Date.now() + 60_000); sendCode(state.email, !signin).then(() => say("We sent a new code.")).catch((err: BackendError) => setErrors({ code: err.message })); }}>
              {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
            </button>
            <button className="text-btn quiet" onClick={router.back}>Use a different email</button>
          </div>
        </div>
      </>
    );
  }

  if (step === "age") {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = Array.from({ length: 101 }, (_, i) => 2026 - i);
    const ready = dob.m && dob.d && dob.y;
    return (
      <>
        {header}
        <div className="gutter stack g24 pt24 grow">
          <h1 className="headline">HUMAN, TOO is a space for adults.</h1>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label" style={{ marginBottom: 8 }}>Your date of birth</legend>
            <div className="row g8">
              <select className="input" aria-label="Month" value={dob.m} onChange={e => setDob({ ...dob, m: e.target.value })}><option value="">Month</option>{months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
              <select className="input" aria-label="Day" style={{ maxWidth: 92 }} value={dob.d} onChange={e => setDob({ ...dob, d: e.target.value })}><option value="">Day</option>{Array.from({ length: 31 }, (_, i) => <option key={i}>{i + 1}</option>)}</select>
              <select className="input" aria-label="Year" style={{ maxWidth: 110 }} value={dob.y} onChange={e => setDob({ ...dob, y: e.target.value })}><option value="">Year</option>{years.map(y => <option key={y}>{y}</option>)}</select>
            </div>
          </fieldset>
          <PrivacyLine>We only use this to confirm you're 18 or older. We don't store it.</PrivacyLine>
          <div className="footer-actions" style={{ marginInline: -20, marginTop: "auto" }}>
            <button className="btn btn-primary btn-block" disabled={!ready} onClick={() => {
              const age = ageOn(new Date(), Number(dob.y), Number(dob.m), Number(dob.d));
              setDob({ m: "", d: "", y: "" });            // never kept (AC-S2-07)
              if (age < 18) { router.reset("/join/not-yet"); return; }
              set(s => ({ ...s, confirmedAdultAt: new Date().toISOString() }));
              router.push("/join/name");
            }}>Continue</button>
          </div>
        </div>
      </>
    );
  }

  if (step === "not-yet") {
    return (
      <>
        <header className="topbar"><div className="grow" /></header>
        <div className="gutter stack g24 pt24">
          <h1 className="headline">Thank you for being honest.</h1>
          <p className="lede">HUMAN, TOO is only for adults right now. You deserve support that's made for you, too.</p>
          <div className="resource"><span className="strong">988 Suicide &amp; Crisis Lifeline</span><span className="small muted">Free and confidential, for any age. Call or text:</span><span className="number">988</span></div>
          <div className="resource"><span className="strong">Crisis Text Line</span><span className="small muted">Text HOME to:</span><span className="number">741741</span></div>
          <p className="help">Youth resources will be reviewed by a clinician before beta.</p>
          <button className="btn btn-secondary btn-block" onClick={() => router.reset("/")}>Close</button>
        </div>
      </>
    );
  }

  // step === "name"
  const problem = displayNameProblem(name);
  return (
    <>
      {header}
      <form className="gutter stack g24 pt24 grow" onSubmit={e => {
        e.preventDefault();
        if (problem) { setErrors({ name: problem }); return; }
        set(s => ({ ...s, displayName: name.trim(), session: "onboarding" }));
        router.push("/onboarding/reasons");
      }}>
        <h1 className="headline">What should people call you?</h1>
        <div className="field">
          <label htmlFor="dname">Display name</label>
          <input id="dname" className="input" maxLength={30} autoComplete="nickname" value={name} onChange={e => { setName(e.target.value); setErrors({}); }} aria-invalid={!!errors.name} />
          <p className="help">It doesn't need to be your legal name. You can change it later.</p>
          {errors.name && <ErrorText>{errors.name}</ErrorText>}
        </div>
        <div className="footer-actions" style={{ marginInline: -20, marginTop: "auto" }}>
          <button className="btn btn-primary btn-block" type="submit" disabled={name.trim().length < 2}>Continue</button>
        </div>
      </form>
    </>
  );
}

/* ---------------- S3 What brings you here ---------------- */
export function Reasons({ editing = false }: { editing?: boolean }) {
  const { state, set, say } = useJourney();
  const router = useRouter();
  const next = () => editing ? (say("Saved."), router.back()) : router.push("/onboarding/experiences");
  return (
    <>
      {editing ? <TopBar back title="What brings you here" /> : <StepsBar step={2} />}
      <div className="gutter stack g16 pt24 pb24">
        <div className="stack g8">
          <h1 className="headline">What brings you here?</h1>
          <p className="muted">There's space for whatever brought you here. Choose any that fit.</p>
          <PrivacyLine>Only you can see this.</PrivacyLine>
        </div>
        <div className="choice-list">
          {REASONS.map((r, i) => (
            <button key={r} className="choice" aria-pressed={state.reasons.includes(i)} onClick={() => set(s => ({ ...s, reasons: s.reasons.includes(i) ? s.reasons.filter(x => x !== i) : [...s.reasons, i] }))}>
              <span className="grow">{r}</span><span className="tick">{state.reasons.includes(i) && <Icon name="check" size={15} strokeWidth={2.4} />}</span>
            </button>
          ))}
        </div>
        {state.reasons.includes(PROFESSIONAL_REASON_INDEX) && (
          <p className="banner small">Welcome. For now, everyone here takes part as a member. A verified professional program is coming later.</p>
        )}
      </div>
      <div className="footer-actions">
        <button className="btn btn-primary btn-block" onClick={next}>{editing ? "Save" : "Next"}</button>
        {!editing && <button className="text-btn quiet" onClick={next}>Skip for now</button>}
      </div>
    </>
  );
}

/* ---------------- S4 Experiences ---------------- */
export function Experiences({ editing = false }: { editing?: boolean }) {
  const { state, set, say } = useJourney();
  const router = useRouter();
  const [limitMsg, setLimitMsg] = useState(false);
  const [otherOpen, setOtherOpen] = useState(!!state.somethingElse);
  const count = state.experiences.length + (state.somethingElse ? 1 : 0);
  const next = () => {
    if (editing) {
      set(s => ({ ...s, todayIds: null, checkin: { ...s.checkin, focus: s.checkin.focus && s.experiences.includes(s.checkin.focus) ? s.checkin.focus : null } }));
      say("Saved."); router.back();
    } else router.push("/onboarding/privacy");
  };
  return (
    <>
      {editing ? <TopBar back title="What you're navigating" /> : <StepsBar step={3} />}
      <div className="gutter stack g16 pt24 pb24">
        <div className="stack g8">
          <h1 className="headline">What are you navigating right now?</h1>
          <p className="muted">Choose up to five. You can change these anytime.</p>
          <PrivacyLine>Private unless you choose to show them on your profile.</PrivacyLine>
        </div>
        <div className="pills">
          {EXPERIENCES.map(e => {
            const on = state.experiences.includes(e.id);
            return (
              <button key={e.id} className="pill" aria-pressed={on} onClick={() => {
                if (!on && count >= MAX_EXPERIENCES) { setLimitMsg(true); return; }
                setLimitMsg(false);
                set(s => ({ ...s, experiences: on ? s.experiences.filter(x => x !== e.id) : [...s.experiences, e.id] }));
              }}><Icon name={e.icon} size={18} />{e.name}</button>
            );
          })}
          <button className="pill plain" aria-pressed={otherOpen} onClick={() => {
            if (otherOpen) { setOtherOpen(false); set(s => ({ ...s, somethingElse: "" })); }
            else if (count >= MAX_EXPERIENCES) setLimitMsg(true);
            else setOtherOpen(true);
          }}>Something else</button>
        </div>
        {otherOpen && (
          <div className="field">
            <label htmlFor="other">In your words</label>
            <input id="other" className="input" maxLength={60} value={state.somethingElse} onChange={e => set(s => ({ ...s, somethingElse: e.target.value }))} />
            <p className="help">Private. Up to 60 characters.</p>
          </div>
        )}
        <p className="small" aria-live="polite" style={{ color: limitMsg ? "var(--danger)" : "var(--ink-2)" }}>
          {limitMsg ? "You can choose up to five. Remove one to add another." : `${count} of ${MAX_EXPERIENCES} chosen`}
        </p>
      </div>
      <div className="footer-actions">
        <button className="btn btn-primary btn-block" onClick={next}>{editing ? "Save" : "Next"}</button>
        {!editing && <button className="text-btn quiet" onClick={next}>I'm not sure yet</button>}
      </div>
    </>
  );
}

/* ---------------- S5a Privacy ---------------- */
export function Privacy() {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const options: { id: string; icon: "globe" | "people" | "ring" | "anon"; title: string; body: string; more: string }[] = [
    { id: "open", icon: "globe", title: "Open", body: "Members across HUMAN, TOO can see it. It's never public on the internet.", more: "Anyone signed in could find it in Today or on your profile." },
    { id: "people", icon: "people", title: "My People", body: "Only people you've connected with.", more: "Connections are mutual. You both have to say yes." },
    { id: "circle", icon: "ring", title: "Circle", body: "Only members of a Circle you choose.", more: "If you leave that Circle, your Story stays with it unless you delete it." },
    { id: "anon", icon: "anon", title: "Anonymous", body: "Your name and profile aren't shown to other members.", more: "Our safety team can still see who shared, so anonymity is never a shield for harm. You can share anonymously in Open or in a Circle." },
  ];
  return (
    <>
      <StepsBar step={4} />
      <div className="gutter stack g16 pt24 pb24">
        <div className="stack g8">
          <h1 className="headline">You decide how you're seen.</h1>
          <p className="muted">Each time you share, you choose who can see it. You can make it more private later, or delete it anytime.</p>
        </div>
        <div className="choice-list">
          {options.map(o => (
            <button key={o.id} className="choice" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)} style={{ alignItems: "flex-start" }}>
              <span className="lead-icon" style={{ marginTop: 2 }}><Icon name={o.icon} /></span>
              <span className="grow"><span className="strong">{o.title}</span><span className="desc">{o.body}</span>{open === o.id && <span className="desc" style={{ color: "var(--ink)", marginTop: 8 }}>{o.more}</span>}</span>
            </button>
          ))}
        </div>
        <p className="banner small">One honest note: we can't stop someone from taking a screenshot. Our Covenant forbids sharing anyone's Story outside HUMAN, TOO, and we act on reports.</p>
      </div>
      <div className="footer-actions"><button className="btn btn-primary btn-block" onClick={() => router.push("/onboarding/covenant")}>I understand</button></div>
    </>
  );
}

/* ---------------- S5b Covenant ---------------- */
export function Covenant() {
  const { state, set, say } = useJourney();
  const router = useRouter();
  return (
    <>
      <StepsBar step={4} />
      <div className="gutter stack g16 pt24 pb24">
        <h1 className="headline">How we care for each other here.</h1>
        <ol className="stack g12" style={{ margin: 0, paddingLeft: 22, fontSize: 17 }}>
          {COVENANT.map(c => <li key={c}>{c}</li>)}
        </ol>
        <p className="gentle small">HUMAN, TOO is peer support, not therapy or emergency care. If you're ever in danger, the Support button is always at the top of your screen.</p>
      </div>
      <div className="footer-actions">
        <button className="btn btn-primary btn-block" onClick={() => {
          saveProfile({
            display_name: state.displayName, confirmed_adult: !!state.confirmedAdultAt,
            short_line: state.profile.shortLine || null, learning: state.profile.learning || null,
            currently_navigating: state.experiences, can_speak_from: state.profile.speakFrom,
          }).then(() => {
            set(s => ({ ...s, session: "member", covenant: { version: COVENANT_VERSION, agreedAt: new Date().toISOString() }, todayIds: null }));
            say(`Welcome to HUMAN, TOO, ${state.displayName}.`);
            router.reset("/today");
          }).catch((err: BackendError) => say(err.status === 401 ? "Your sign-in expired. Please sign in again." : `We couldn't save your profile: ${err.message}`));
        }}>I'm in</button>
        <button className="text-btn quiet" onClick={() => { say("Come back whenever you're ready."); router.reset("/"); }}>I need a moment</button>
      </div>
    </>
  );
}
