import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { signOut } from "../lib/backend";
import { Icon } from "../components/Icon";
import { Avatar, BottomNav, ErrorText, PrivacyLine, TopBar } from "../components/Chrome";
import { ConnectOffer, ReactionActions, StoryPost, StoryPhotoView, authorName, SIMULATED_REACTIONS } from "../components/StoryPost";
import { PhotoPicker } from "../components/PhotoPicker";
import { PROFILE_MAX_BYTES, STORY_MAX_BYTES } from "../lib/media";
import { Link, useParams, useRouter } from "../router/router";
import { effectiveRole, emptyDraft, storyById, useJourney, viewerOf, type JourneyState } from "../state/journey";
import { showsAfterBeta } from "../lib/launch";
import { ARRIVALS, CONTENT_NOTES, EXPERIENCES, EXPERIENCE_BY_ID, MORE_ARRIVALS, SUPPORT } from "../lib/content";
import { CIRCLES, CIRCLE_BY_ID, MEMBERS } from "../lib/sample-data";
import { anonymousAllowed, canReplyAnonymously, canSee, replyState, roundToTen, sectionVisibleTo, todayFeed } from "../lib/visibility";
import { checkText } from "../lib/safety";
import type { Circle, Reply, SectionAudience, Story, SupportPreference } from "../lib/types";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ---------------- S6 Today ---------------- */
export function Today() {
  const { state, set, openSheet } = useJourney();
  const [moreOpen, setMoreOpen] = useState(false);

  // Build Today once per visit (or when the member changes what shapes it),
  // so a Story doesn't vanish the moment you react to it.
  useEffect(() => {
    if (state.todayIds) return;
    const ids = todayFeed({
      stories: state.stories, viewer: viewerOf(state), currentExperiences: state.experiences,
      focus: state.checkin.focus, reacted: new Set(Object.keys(state.reactions).filter(k => state.reactions[k].see || state.reactions[k].same)),
      heavy: state.checkin.arrival === "heavy",
    }).map(s => s.id);
    set(s => ({ ...s, todayIds: ids }));
  }, [state.todayIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const stories = (state.todayIds ?? []).map(id => storyById(state, id)).filter((s): s is Story => !!s && canSee(s, viewerOf(state)) && !state.hidden.includes(s.id));
  const suggestions = CIRCLES.filter(c => !c.inviteOnly && !state.joined.includes(c.id))
    .sort((a, b) => Number(state.experiences.includes(b.experience)) - Number(state.experiences.includes(a.experience))).slice(0, 2);
  const arrival = state.checkin.arrival;
  const allArrivals = [...ARRIVALS, ...MORE_ARRIVALS];
  const setArrival = (id: typeof arrival) => set(s => ({ ...s, checkin: { ...s.checkin, arrival: s.checkin.arrival === id ? null : id, heavyDismissed: false }, todayIds: null }));
  const focus = state.checkin.focus;

  return (
    <>
      <TopBar divided={false} />
      <main className="main">
        <section className="gutter stack g16 pt8">
          <div className="stack g4">
            <h1 className="headline">{greeting()}, {state.displayName}.</h1>
            <p className="muted">How are you arriving today?</p>
          </div>
          <div className="moods" role="group" aria-label="How are you arriving today?">
            {ARRIVALS.map(a => (
              <button key={a.id} className="mood" aria-pressed={arrival === a.id} onClick={() => setArrival(a.id)}><Icon name={a.icon} size={18} />{a.label}</button>
            ))}
            {moreOpen
              ? MORE_ARRIVALS.map(a => <button key={a.id} className="mood" aria-pressed={arrival === a.id} onClick={() => setArrival(a.id)}>{a.label}</button>)
              : <button className="mood" onClick={() => setMoreOpen(true)} aria-expanded={false}><Icon name="more" size={18} />More</button>}
          </div>
          <div className="row g12 wrap">
            <PrivacyLine>{arrival ? `Arriving ${allArrivals.find(a => a.id === arrival)?.label.toLowerCase()}. Only you see this.` : "Only you see this."}</PrivacyLine>
          </div>
          {arrival === "heavy" && !state.checkin.heavyDismissed && (
            <div className="gentle">
              <p><span className="strong">Heavy days are real.</span> You don't have to carry this alone.</p>
              <div className="row g8 wrap">
                <button className="btn btn-accent btn-sm" onClick={() => openSheet({ kind: "support" })}>See support options</button>
                <button className="text-btn quiet" onClick={() => set(s => ({ ...s, checkin: { ...s.checkin, heavyDismissed: true } }))}>Not now</button>
              </div>
            </div>
          )}
          <button className="row g8" style={{ alignSelf: "flex-start", minHeight: 44 }} onClick={() => state.experiences.length ? openSheet({ kind: "focus" }) : undefined}>
            <span className="small muted">What feels present today?</span>
            {state.experiences.length
              ? <span className="small strong">{focus ? EXPERIENCE_BY_ID[focus].name : "Choose one"}</span>
              : <Link href="/edit/experiences" className="small strong">Tell us what you're navigating</Link>}
          </button>
        </section>

        <div className="section-head"><h2>Today for you</h2></div>
        <div className="divider" />
        <div className="feed">
          {stories.length === 0 && (
            <div className="empty">
              <p className="lede">It's quiet in {focus ? EXPERIENCE_BY_ID[focus].name : "your Experiences"} right now. That can change, and you could be part of it.</p>
              <div className="row g8 wrap"><Link href="/share" className="btn btn-primary btn-sm">Share Your Story</Link><Link href="/circles" className="btn btn-secondary btn-sm">Explore Circles</Link></div>
            </div>
          )}
          {stories.map((s, i) => (
            <div key={s.id}>
              <StoryPost story={s} />
              {i === 2 && suggestions[0] && <CircleSuggestion circle={suggestions[0]} />}
              {i === 6 && suggestions[1] && <CircleSuggestion circle={suggestions[1]} />}
            </div>
          ))}
        </div>
        <div className="caught-up">
          <span className="mark" aria-hidden="true">,</span>
          <h2 className="headline" style={{ fontSize: 20 }}>You're caught up.</h2>
          <p className="muted">Come back whenever you need.</p>
          <div className="row g8 wrap" style={{ justifyContent: "center", marginTop: 6 }}>
            <Link href="/share" className="btn btn-secondary btn-sm">Share Your Story</Link>
            <Link href="/circles" className="btn btn-secondary btn-sm">Your Circles</Link>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}

function CircleSuggestion({ circle }: { circle: Circle }) {
  return (
    <div className="circle-suggest">
      <span className="small muted">A Circle you might like</span>
      <CircleRow circle={circle} flush />
    </div>
  );
}

function CircleRow({ circle, flush = false }: { circle: Circle; flush?: boolean }) {
  const { state, openSheet } = useJourney();
  const joined = state.joined.includes(circle.id);
  return (
    <div className="circle-row" style={flush ? { padding: 0 } : undefined}>
      <Link href={"/circles/" + circle.id} className="row g12 grow" aria-label={circle.name}>
        <span className="circle-cover" style={{ background: `linear-gradient(140deg, ${circle.tone[0]}, ${circle.tone[1]})` }} aria-hidden="true" />
        <span className="stack grow">
          <span className="strong">{circle.name}</span>
          <span className="small muted" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{circle.purpose}</span>
          <span className="tiny muted">{circle.conversationsToday} conversations today</span>
        </span>
      </Link>
      {joined ? <span className="small muted">Joined</span>
        : <button className="btn btn-secondary btn-sm" onClick={() => openSheet({ kind: "join", circleId: circle.id })}>Join</button>}
    </div>
  );
}

/* ---------------- S7 Story and conversation ---------------- */
export function StoryScreen() {
  const { id } = useParams<{ id: string }>();
  const { state, set, say, openSheet } = useJourney();
  const router = useRouter();
  const story = storyById(state, id);
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  if (!story || !canSee(story, viewerOf(state))) {
    return (
      <>
        <TopBar back title="Story" />
        <main className="main"><div className="empty"><p className="lede">This isn't available anymore.</p><button className="btn btn-secondary btn-sm" onClick={router.back}>Back</button></div></main>
        <BottomNav />
      </>
    );
  }
  const name = authorName(state, story) ?? "A member";
  const rs = replyState(story, "me");
  const target = replyTo ? story.replies.find(r => r.id === replyTo) : null;

  const send = () => {
    const v = text.trim();
    if (!v) return;
    const latest = storyById(state, story.id)!;
    if (replyState(latest, "me").kind === "off" || replyState(latest, "me").kind === "listen") { setErr("Replies were closed while you were writing. You can copy what you wrote."); return; }
    const check = checkText(v);
    const reply: Reply = { id: "r" + Date.now(), authorId: "me", anonymous: anon && canReplyAnonymously(story), text: v, postedLabel: "Just now", heldForReview: check.level === "covenant", children: [] };
    set(s => ({
      ...s, stories: s.stories.map(x => x.id !== story.id ? x : {
        ...x, replies: replyTo ? x.replies.map(r => r.id === replyTo ? { ...r, children: [...r.children, reply] } : r) : [...x.replies, reply],
      }),
    }));
    setText(""); setReplyTo(null); setErr(null);
    if (check.level === "covenant") say("Thank you for replying. A person on our team will look at it before it appears.");
    else if (check.level === "imminent" || check.level === "distress") openSheet({ kind: "support", lead: "Thank you for sharing that. You deserve support too." });
    else say("Reply sent.");
  };

  const replyView = (r: Reply, child = false) => {
    if (state.blocked.includes(r.authorId)) return null;
    const rname = r.anonymous ? null : r.authorId === "me" ? state.displayName : MEMBERS[r.authorId]?.displayName;
    return (
      <div key={r.id}>
        <div className={"reply" + (child ? " child" : "")}>
          <Avatar name={rname ?? undefined} anonymous={!rname} size="sm" photo={r.authorId === "me" ? state.profile.photo : null} />
          <div className="stack g4">
            <div className="row g8 wrap">
              <span className="strong small">{rname ? (r.authorId === "me" ? `${rname} (you)` : rname) : "A member"}</span>
              <span className="meta" style={{ fontSize: 13 }}>{r.postedLabel}</span>
              {r.heldForReview && <span className="hold-tag">Waiting for review</span>}
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.5 }}>{r.text}</p>
            {!child && rs.kind !== "listen" && rs.kind !== "off" && (
              <button className="text-btn quiet" style={{ alignSelf: "flex-start", minHeight: 32, fontSize: 13.5, padding: 0 }} onClick={() => { setReplyTo(r.id); inputRef.current?.focus(); }}>Reply</button>
            )}
          </div>
        </div>
        {r.children.map(c => replyView(c, true))}
      </div>
    );
  };

  return (
    <>
      <TopBar back title="Story" />
      <main className="main">
        <StoryPost story={story} full />
        <div className="gutter stack g12 pt24 pb24">
          <p className="banner">{story.authorId === "me" ? "You" : name} asked for: <span className="strong">{SUPPORT[story.support].name}</span></p>
          {story.replies.length > 0
            ? <div className="stack">{story.replies.map(r => replyView(r))}</div>
            : rs.kind === "open" && <p className="muted small">No one has replied yet. If this Story speaks to you, you could be the first.</p>}
        </div>
      </main>
      {rs.kind === "listen" ? (
        <div className="composer"><p className="small muted">{story.authorId === "me" ? "You asked to be listened to. Replies are off." : `${name} asked to be listened to. Replies are off, and you can still let them know you see them.`}</p></div>
      ) : rs.kind === "off" ? (
        <div className="composer"><p className="small muted">{story.authorId === "me" ? "You closed replies on this Story." : `${name} has closed replies on this Story.`}</p></div>
      ) : (
        <form className="composer" onSubmit={e => { e.preventDefault(); send(); }}>
          {rs.kind === "open" && <p className="tiny muted">{name} asked for <span className="strong" style={{ color: "var(--ink)" }}>{SUPPORT[story.support].name}</span>. Keep your reply in that spirit.{(story.support === "perspective" || story.support === "resources") && " Offer what's worked for you, not a diagnosis."}</p>}
          {target && <p className="tiny muted">Replying to {target.anonymous ? "a member" : MEMBERS[target.authorId]?.displayName ?? "yourself"} · <button type="button" className="strong" onClick={() => setReplyTo(null)}>Cancel</button></p>}
          {err && <ErrorText>{err}</ErrorText>}
          <div className="composer-row">
            <label htmlFor="reply" className="sr-only">Your reply</label>
            <textarea id="reply" ref={inputRef} className="input grow" rows={1} maxLength={1000} placeholder="Share from your own experience" value={text} onChange={e => setText(e.target.value)} />
            <button className="btn btn-primary btn-sm" type="submit" disabled={!text.trim()} style={{ minHeight: 46 }}>Send</button>
          </div>
          <div className="row g8">
            {canReplyAnonymously(story) && story.authorId !== "me" && (
              <label className="checkbox small grow" style={{ fontSize: 14 }}><input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} /> Reply anonymously</label>
            )}
            {text.length >= 800 && <span className="counter" style={{ marginLeft: "auto" }}>{text.length} / 1,000</span>}
          </div>
        </form>
      )}
    </>
  );
}

/* ---------------- S9 Circles ---------------- */
export function Circles() {
  const { state } = useJourney();
  const mine = CIRCLES.filter(c => state.joined.includes(c.id));
  const rest = CIRCLES.filter(c => !state.joined.includes(c.id) && !c.inviteOnly)
    .sort((a, b) => Number(state.experiences.includes(b.experience)) - Number(state.experiences.includes(a.experience)));
  return (
    <>
      <TopBar title="Circles" />
      <main className="main">
        <p className="gutter muted pt24 small">Small spaces around one shared experience. No one sees a list of who's in a Circle.</p>
        {mine.length > 0 && <><div className="section-head"><h2>Your Circles</h2></div>{mine.map(c => <CircleRow key={c.id} circle={c} />)}</>}
        <div className="section-head"><h2>{mine.length ? "More Circles" : "Circles for you"}</h2></div>
        {rest.map(c => <CircleRow key={c.id} circle={c} />)}
        {rest.length === 0 && <p className="gutter muted">You're part of every Circle open right now.</p>}
        <div className="pb24" />
      </main>
      <BottomNav />
    </>
  );
}

export function CircleScreen() {
  const { id } = useParams<{ id: string }>();
  const { state, openSheet, set, say } = useJourney();
  const router = useRouter();
  const circle = CIRCLE_BY_ID[id];
  if (!circle) return <><TopBar back title="Circle" /><main className="main"><div className="empty"><p className="lede">This Circle isn't available.</p></div></main><BottomNav /></>;
  const member = state.joined.includes(circle.id);
  const stories = state.stories
    .filter(s => s.audience === "circle" && s.circleId === circle.id && canSee(s, viewerOf(state)) && !state.hidden.includes(s.id))
    .sort((a, b) => b.postedOrder - a.postedOrder);
  const leave = () => openSheet({
    kind: "confirm", title: `Leave ${circle.name}?`, body: "Your Stories here stay visible to this Circle unless you delete them.", confirmLabel: "Leave Circle", cancelLabel: "Stay",
    onConfirm: () => { set(s => ({ ...s, joined: s.joined.filter(c => c !== circle.id), todayIds: null })); say(`You left ${circle.name}.`); },
  });
  return (
    <>
      <TopBar back title={circle.name} />
      <main className="main">
        <div className="circle-hero" style={{ background: `linear-gradient(160deg, ${circle.tone[0]}, ${circle.tone[1]})` }} aria-hidden="true" />
        <div className="gutter stack g12 circle-hero-inner pb24">
          <span className="circle-cover" style={{ background: `linear-gradient(140deg, ${circle.tone[0]}, ${circle.tone[1]})` }} aria-hidden="true" />
          <h1 className="headline">{circle.name}</h1>
          <p className="lede" style={{ color: "var(--ink)" }}>{circle.purpose}</p>
          <p className="small muted">About {roundToTen(circle.approxMembers)} members · Hosted by {circle.host} from the HUMAN, TOO team</p>
          <details className="banner small"><summary className="strong" style={{ cursor: "pointer" }}>How we show up here</summary>
            <ul className="stack g4" style={{ margin: "8px 0 0", paddingLeft: 18 }}>{circle.norms.map(n => <li key={n}>{n}</li>)}<li>Our Community Covenant applies here too.</li></ul>
          </details>
          <div className="row g8 wrap pt8">
            {member ? (
              <>
                <button className="btn btn-primary btn-sm" onClick={() => { set(s => ({ ...s, draft: { ...emptyDraft(), audience: "circle", circleId: circle.id } })); router.push("/share"); }}>Share in this Circle</button>
                <button className="btn btn-secondary btn-sm" onClick={leave}>Joined <Icon name="check" size={16} /></button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => openSheet({ kind: "join", circleId: circle.id })}>Join Circle</button>
            )}
          </div>
        </div>
        <div className="divider" />
        {!member ? (
          <div className="empty"><PrivacyLine>Stories in this Circle are shared only with its members.</PrivacyLine></div>
        ) : stories.length ? (
          <div className="feed">{stories.map(s => <StoryPost key={s.id} story={s} />)}</div>
        ) : (
          <div className="empty"><p className="lede">This Circle is just beginning. Your Story could be the first one here.</p></div>
        )}
      </main>
      <BottomNav />
    </>
  );
}

/* ---------------- S10 Share Your Story ---------------- */
const STEP_NAMES = ["Write", "Tag", "Audience", "Support", "Review"];

export function Share() {
  const { state, set, openSheet, say } = useJourney();
  const router = useRouter();
  const d = state.draft;
  const joined = CIRCLES.filter(c => state.joined.includes(c.id));
  const hasPeople = state.connections.length > 0;

  // D-2 default audience: the Circle you came from, else your first Circle, else My People. Open is never preset.
  useEffect(() => {
    if (d.audience) return;
    if (joined[0]) set(s => ({ ...s, draft: { ...s.draft, audience: "circle", circleId: joined[0].id } }));
    else if (hasPeople) set(s => ({ ...s, draft: { ...s.draft, audience: "people" } }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (p: Partial<typeof d>) => set(s => ({ ...s, draft: { ...s.draft, ...p } }));
  const close = () => {
    if (d.text.trim()) openSheet({
      kind: "confirm", title: "Keep this as a draft?", body: "Your words stay on this device so you can come back to them.", confirmLabel: "Keep draft", cancelLabel: "Discard",
      onConfirm: () => { say("Draft kept."); router.back(); },
    });
    else router.back();
  };

  const publish = (flagged = false) => {
    const id = "mine-" + Date.now();
    const story: Story = {
      id, authorId: "me", anonymous: d.anonymous && anonymousAllowed(d.audience), experiences: d.experiences,
      audience: d.audience!, circleId: d.audience === "circle" ? d.circleId : null, support: d.support!,
      contentNote: d.contentNote ?? (flagged ? "Suicide or self-harm" : null), text: d.text.trim(), photo: d.photo,
      postedLabel: "Just now", postedOrder: 1000 + Date.now() / 1e10, flaggedUrgent: flagged, replies: [],
    };
    set(s => ({ ...s, stories: [story, ...s.stories], draft: emptyDraft() }));
    if (!story.anonymous) {
      // Prototype: simulate the author's private view of reactions a moment later.
      setTimeout(() => { SIMULATED_REACTIONS[id] = [["maya", "see"], ["theo", "see"], ["jordan", "same"]]; set(s => ({ ...s })); }, 5000);
    }
    router.replace("/shared/" + id);
  };
  const tryPublish = () => {
    const result = checkText(d.text);
    if (result.level === "clear") publish();
    else if (result.level === "covenant") openSheet({ kind: "safety", level: "covenant", category: result.category });
    else openSheet({ kind: "safety", level: result.level, onShare: () => publish(result.level === "imminent") });
  };

  let body: ReactElement, action: ReactElement;
  if (d.step === 0) {
    const len = d.text.length;
    body = (
      <>
        <h1 className="headline">What's part of your story today?</h1>
        <label htmlFor="story" className="sr-only">Your Story</label>
        <textarea id="story" className="input" rows={10} style={{ background: "transparent", padding: 0, fontSize: 18, border: 0, minHeight: 240 }} placeholder="Write it in your own words. There's no right way." value={d.text} onChange={e => patch({ text: e.target.value })} autoFocus />
        <div className="row g8"><PrivacyLine>Saved as a draft on this device.</PrivacyLine><span className="grow" />{len >= 2500 && <span className={"counter" + (len > 3000 ? " over" : "")}>{len.toLocaleString()} / 3,000</span>}</div>
        {len > 3000 && <ErrorText>Stories can be up to 3,000 characters. You're {len - 3000} over.</ErrorText>}
        {d.photo ? (
          <div className="stack g12">
            <div className="photo-preview">
              <img className="story-photo" src={d.photo.src} alt={d.photo.alt || "Your photo"} />
              <button className="photo-remove" onClick={() => patch({ photo: null, photoConsent: false })} aria-label="Remove photo"><Icon name="close" size={18} /></button>
            </div>
            <div className="field">
              <label htmlFor="alt">Describe the photo <span className="muted" style={{ fontWeight: 400 }}>(helps people who can't see it)</span></label>
              <input id="alt" className="input" maxLength={200} placeholder="For example: a small yellow kitchen in morning light" value={d.photo.alt} onChange={e => patch({ photo: { ...d.photo!, alt: e.target.value } })} />
            </div>
            <label className="checkbox"><input type="checkbox" checked={d.photoConsent} onChange={e => patch({ photoConsent: e.target.checked })} /><span>Anyone recognizable in this photo agreed to it being shared here, and it doesn't show anyone's private information.</span></label>
            <p className="help">Location and camera details are removed. Photos are checked for safety before others can see them.</p>
          </div>
        ) : (
          <PhotoPicker id="story-photo" label={<><Icon name="plus" size={18} /> Add a photo</>} square={false} maxSide={1600} maxBytes={STORY_MAX_BYTES}
            onPick={ph => patch({ photo: { ...ph, alt: "" }, photoConsent: false })} />
        )}
      </>
    );
    action = <button className="btn btn-primary btn-block" disabled={len < 10 || len > 3000 || (!!d.photo && !d.photoConsent)} onClick={() => patch({ step: 1 })}>Next</button>;
  } else if (d.step === 1) {
    const ordered = [...EXPERIENCES].sort((a, b) => Number(state.experiences.includes(b.id)) - Number(state.experiences.includes(a.id)));
    body = (
      <>
        <div className="stack g4"><h1 className="headline">What is this Story part of?</h1><p className="muted">Choose one to three.</p></div>
        <div className="pills">
          {ordered.map(e => {
            const on = d.experiences.includes(e.id);
            return <button key={e.id} className="pill" aria-pressed={on} onClick={() => {
              if (!on && d.experiences.length >= 3) { say("Choose up to three."); return; }
              patch({ experiences: on ? d.experiences.filter(x => x !== e.id) : [...d.experiences, e.id] });
            }}><Icon name={e.icon} size={18} />{e.name}</button>;
          })}
        </div>
      </>
    );
    action = <button className="btn btn-primary btn-block" disabled={!d.experiences.length} onClick={() => patch({ step: 2 })}>Next</button>;
  } else if (d.step === 2) {
    const opt = (key: "circle" | "people" | "open", icon: "ring" | "people" | "globe", title: string, desc: string, disabled?: string) => (
      <button className="choice" role="radio" aria-checked={d.audience === key} aria-disabled={!!disabled} onClick={() => {
        if (disabled) return;
        patch({ audience: key, anonymous: key === "people" ? false : d.anonymous, circleId: key === "circle" ? (d.circleId ?? joined[0]?.id ?? null) : d.circleId });
      }} style={{ alignItems: "flex-start" }}>
        <span className="lead-icon" style={{ marginTop: 2 }}><Icon name={icon} /></span>
        <span className="grow"><span className="strong">{title}</span><span className="desc">{disabled ?? desc}</span></span>
        <span className="radio-dot" />
      </button>
    );
    body = (
      <>
        <h1 className="headline">Who can see this Story?</h1>
        <div className="choice-list" role="radiogroup" aria-label="Audience">
          {opt("circle", "ring", "Circle", d.circleId && d.audience === "circle" ? `Only members of ${CIRCLE_BY_ID[d.circleId].name}.` : "Only members of a Circle you choose.", joined.length ? undefined : "Join a Circle to share there.")}
          {d.audience === "circle" && joined.length > 1 && (
            <div className="pills" style={{ padding: "4px 0 14px 38px" }}>
              {joined.map(c => <button key={c.id} className="pill plain" aria-pressed={d.circleId === c.id} onClick={() => patch({ circleId: c.id })}>{c.name}</button>)}
            </div>
          )}
          {opt("people", "people", "My People", "Only people you've connected with.", hasPeople ? undefined : "You haven't connected with anyone yet.")}
          {opt("open", "globe", "Open", "Members across HUMAN, TOO. Never public on the internet.")}
        </div>
        <div className="row g16" style={{ padding: "8px 0" }}>
          <div className="grow">
            <p className="strong">Share anonymously</p>
            <p className="small muted">{d.audience === "people" ? "Your people would know it's you, so anonymous isn't available here." : "Your name won't be shown. Our safety team can still see who shared."}</p>
          </div>
          <button className="switch" role="switch" aria-label="Share anonymously" aria-checked={d.anonymous && anonymousAllowed(d.audience)} disabled={!anonymousAllowed(d.audience)} onClick={() => patch({ anonymous: !d.anonymous })} />
        </div>
      </>
    );
    action = <button className="btn btn-primary btn-block" disabled={!d.audience || (d.audience === "circle" && !d.circleId)} onClick={() => patch({ step: 3 })}>Next</button>;
  } else if (d.step === 3) {
    body = (
      <>
        <h1 className="headline">What would feel supportive right now?</h1>
        <div className="choice-list" role="radiogroup" aria-label="Support preference">
          {(Object.keys(SUPPORT) as SupportPreference[]).map(k => (
            <button key={k} className="choice" role="radio" aria-checked={d.support === k} onClick={() => patch({ support: k })}>
              <span className="grow"><span className="strong">{SUPPORT[k].name}</span><span className="desc">{SUPPORT[k].description}</span></span>
              <span className="radio-dot" />
            </button>
          ))}
        </div>
        <div className="stack g8 pt8">
          <p className="strong small">Add a content note <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></p>
          <p className="small muted">People see the note first and choose whether to read.</p>
          <div className="pills">{CONTENT_NOTES.map(n => <button key={n} className="pill plain" aria-pressed={d.contentNote === n} onClick={() => patch({ contentNote: d.contentNote === n ? null : n })}>{n}</button>)}</div>
        </div>
      </>
    );
    action = <button className="btn btn-primary btn-block" disabled={!d.support} onClick={() => patch({ step: 4 })}>Review</button>;
  } else {
    const audienceLabel = d.audience === "open" ? "Open" : d.audience === "people" ? "My People" : `${CIRCLE_BY_ID[d.circleId!].name} Circle`;
    const anonymous = d.anonymous && anonymousAllowed(d.audience);
    body = (
      <>
        <h1 className="headline">This is how it will look.</h1>
        <div className="post" style={{ padding: "16px 0", borderTop: "1px solid var(--line)" }}>
          <Avatar name={anonymous ? undefined : state.displayName} anonymous={anonymous} photo={state.profile.photo} />
          <div className="stack g8">
            <div className="post-head"><span className="post-name">{anonymous ? "A member" : state.displayName}</span><span className="meta">Just now</span></div>
            {d.contentNote && <div className="note-cover"><span className="small">This Story mentions {d.contentNote.toLowerCase()}. People tap to read.</span></div>}
            <p className="post-text">{d.text}</p>
            {d.photo && <StoryPhotoView photo={d.photo} />}
            <p className="asked">Asked for <b>{SUPPORT[d.support!].name}</b></p>
          </div>
        </div>
        <div className="choice-list">
          {([["Part of", d.experiences.map(e => EXPERIENCE_BY_ID[e].name).join(", "), 1], ["Photo", d.photo ? "1 photo" : "None", 0], ["Who can see it", audienceLabel, 2], ["Anonymous", anonymous ? "Yes" : "No", 2], ["Support", SUPPORT[d.support!].name, 3], ["Content note", d.contentNote ?? "None", 3]] as const).map(([k, v, step]) => (
            <div key={k} className="choice" style={{ padding: "12px 0" }}>
              <span className="small muted" style={{ width: 120 }}>{k}</span><span className="grow small strong">{v}</span>
              <button className="text-btn quiet" style={{ fontSize: 14 }} onClick={() => patch({ step })}>Edit</button>
            </div>
          ))}
        </div>
        <PrivacyLine>You can make it more private or delete it anytime.</PrivacyLine>
      </>
    );
    action = <button className="btn btn-primary btn-block" onClick={tryPublish}>Share My Story</button>;
  }

  return (
    <>
      <header className="topbar with-back divided">
        <button className="icon-btn" onClick={close} aria-label="Close"><Icon name="close" /></button>
        <div className="title stack">
          <span>Share Your Story</span>
          <span className="tiny muted" style={{ fontWeight: 400 }}>Step {d.step + 1} of 5 · {STEP_NAMES[d.step]}</span>
        </div>
      </header>
      <main className="main gutter stack g16 pt24 pb24">{body}</main>
      <div className="footer-actions">
        {action}
        {d.step > 0 && <button className="text-btn quiet" onClick={() => patch({ step: d.step - 1 })}>Back</button>}
      </div>
    </>
  );
}

export function Shared() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  return (
    <main className="main" style={{ justifyContent: "center" }}>
      <div className="caught-up" style={{ paddingTop: 96 }}>
        <span className="mark" aria-hidden="true">,</span>
        <h1 className="headline">Your Story is here.</h1>
        <p className="muted">Thank you for trusting us with it.</p>
        <div className="stack g8" style={{ width: "100%", maxWidth: 320, marginTop: 16 }}>
          <button className="btn btn-primary btn-block" onClick={() => router.replace("/story/" + id)}>View my Story</button>
          <button className="btn btn-secondary btn-block" onClick={() => router.reset("/today")}>Back to Today</button>
        </div>
      </div>
    </main>
  );
}

/* ---------------- S11 Profile ---------------- */
type ProfileKey = keyof JourneyState["profile"]["audience"];
const AUD_LABEL: Record<SectionAudience, string> = { all: "All members", people: "My People", me: "Only me" };

function ProfileSection({ k, label, children, empty, viewAs, editing }: { k: ProfileKey; label: string; children: ReactNode; empty: string; viewAs: "self" | "member" | "connection"; editing: boolean }) {
  const { state, set } = useJourney();
  const p = state.profile;
  if (!sectionVisibleTo(p.audience[k], viewAs)) return null;
  const setAud = (v: SectionAudience) => set(s => ({ ...s, profile: { ...s.profile, audience: { ...s.profile.audience, [k]: v } } }));
  return (
    <section className="profile-section">
      <div className="row g8"><span className="section-label grow">{label}</span>{viewAs === "self" && <span className="aud-chip"><Icon name={p.audience[k] === "all" ? "globe" : p.audience[k] === "people" ? "people" : "lock"} size={14} />{AUD_LABEL[p.audience[k]]}</span>}</div>
      {children || <p className="small muted">{empty}</p>}
      {editing && viewAs === "self" && (
        <div className="segmented" role="group" aria-label={`Who can see ${label}`}>
          {(["all", "people", "me"] as SectionAudience[]).map(v => <button key={v} aria-pressed={p.audience[k] === v} onClick={() => setAud(v)}>{AUD_LABEL[v]}</button>)}
        </div>
      )}
    </section>
  );
}

export function You() {
  const { state, set, say, reset } = useJourney();
  const router = useRouter();
  const [viewAs, setViewAs] = useState<"self" | "member" | "connection">("self");
  const [editing, setEditing] = useState(false);
  const p = state.profile;
  const mine = state.stories.filter(s => s.authorId === "me" && !s.deleted).sort((a, b) => b.postedOrder - a.postedOrder);
  const visibleStories = viewAs === "self" ? mine : mine.filter(s => !s.anonymous && (s.audience === "open" || (viewAs === "connection" && s.audience === "people")));
  const shows = (k: ProfileKey) => sectionVisibleTo(p.audience[k], viewAs);
  const toggleIn = (k: "navigating" | "speakFrom" | "circlesShown", v: string) =>
    set(s => ({ ...s, profile: { ...s.profile, [k]: (s.profile[k] as string[]).includes(v) ? (s.profile[k] as string[]).filter(x => x !== v) : [...(s.profile[k] as string[]), v] } }));
  const allPrivate = (["navigating", "speakFrom", "learning", "circles"] as ProfileKey[]).every(k => p.audience[k] === "me");

  const nothingShown = viewAs !== "self" && !(["navigating", "speakFrom", "learning", "circles"] as ProfileKey[]).some(shows) && !visibleStories.length;

  return (
    <>
      <TopBar title={state.displayName} />
      <main className="main">
        <div className="profile-head">
          <div className="row g16">
            <div className="stack g4 grow">
              <h1 className="headline">{state.displayName}</h1>
              {editing
                ? <input className="input" aria-label="A few words about you" maxLength={60} placeholder="A few words about you" value={p.shortLine} onChange={e => set(s => ({ ...s, profile: { ...s.profile, shortLine: e.target.value } }))} />
                : <p className="muted">{p.shortLine || (viewAs === "self" ? "Add a few words about you." : "")}</p>}
            </div>
            <div className="stack g8" style={{ alignItems: "center" }}>
              <Avatar name={state.displayName} size="lg" photo={state.profile.photo} />
              {editing && (
                <div className="stack g4" style={{ alignItems: "center" }}>
                  <PhotoPicker id="profile-photo" className="text-btn" label={state.profile.photo ? "Change photo" : "Add photo"} square maxSide={480} maxBytes={PROFILE_MAX_BYTES}
                    onPick={ph => { set(s => ({ ...s, profile: { ...s.profile, photo: ph.src } })); say("Photo added. Location and camera details were removed."); }} />
                  {state.profile.photo && <button className="text-btn quiet" style={{ fontSize: 14 }} onClick={() => set(s => ({ ...s, profile: { ...s.profile, photo: null } }))}>Remove photo</button>}
                </div>
              )}
            </div>
          </div>
          {viewAs === "self" && (
            <button className="btn btn-outline btn-sm btn-block" onClick={() => { if (editing) say("Your profile is updated."); setEditing(!editing); }}>{editing ? "Done" : "Edit profile"}</button>
          )}
          <div className="stack g8">
            <span className="tiny muted">See how others see you</span>
            <div className="segmented" role="group" aria-label="Preview as">
              {([["self", "You"], ["member", "A member"], ["connection", "Your people"]] as const).map(([k, l]) => (
                <button key={k} aria-pressed={viewAs === k} onClick={() => { setViewAs(k); setEditing(false); }}>{l}</button>
              ))}
            </div>
          </div>
          {viewAs === "self" && allPrivate && !editing && (
            <div className="gentle small"><span>Only your name is visible right now. Choose what you'd like people to know.</span><button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setEditing(true)}>Choose</button></div>
          )}
        </div>

        {nothingShown ? (
          <section className="profile-section"><p className="muted">{state.displayName} is still settling in. Their Stories will appear here when they share with you.</p></section>
        ) : (
          <>
            <ProfileSection viewAs={viewAs} editing={editing} k="navigating" label="Currently navigating" empty="Choose which of your Experiences to show.">
              {editing ? <div className="pills">{state.experiences.map(e => <button key={e} className="pill" aria-pressed={p.navigating.includes(e)} onClick={() => toggleIn("navigating", e)}><Icon name={EXPERIENCE_BY_ID[e].icon} size={16} />{EXPERIENCE_BY_ID[e].name}</button>)}</div>
                : p.navigating.length ? <div className="pills">{p.navigating.map(e => <span key={e} className="pill" style={{ cursor: "default" }}><Icon name={EXPERIENCE_BY_ID[e].icon} size={16} />{EXPERIENCE_BY_ID[e].name}</span>)}</div> : null}
            </ProfileSection>
            <ProfileSection viewAs={viewAs} editing={editing} k="speakFrom" label="Experiences I can speak from" empty="Things you've lived through and could speak to.">
              {editing ? <div className="pills">{EXPERIENCES.map(e => <button key={e.id} className="pill plain" aria-pressed={p.speakFrom.includes(e.id)} onClick={() => toggleIn("speakFrom", e.id)}>{e.name}</button>)}</div>
                : p.speakFrom.length ? <div className="pills">{p.speakFrom.map(e => <span key={e} className="pill plain" style={{ cursor: "default" }}>{EXPERIENCE_BY_ID[e].name}</span>)}</div> : null}
            </ProfileSection>
            <ProfileSection viewAs={viewAs} editing={editing} k="learning" label="Something I'm learning" empty="What's something you're learning? You can keep it just for you.">
              {editing ? <input className="input" aria-label="Something I'm learning" maxLength={150} value={p.learning} onChange={e => set(s => ({ ...s, profile: { ...s.profile, learning: e.target.value } }))} />
                : p.learning ? <p className="quote">“{p.learning}”</p> : null}
            </ProfileSection>
            <ProfileSection viewAs={viewAs} editing={editing} k="circles" label="Circles" empty={state.joined.length ? "Choose which Circles to list, if any." : "You haven't joined a Circle yet."}>
              {editing ? <div className="pills">{state.joined.map(c => <button key={c} className="pill plain" aria-pressed={p.circlesShown.includes(c)} onClick={() => toggleIn("circlesShown", c)}>{CIRCLE_BY_ID[c].name}</button>)}</div>
                : p.circlesShown.filter(c => state.joined.includes(c)).length ? <div className="pills">{p.circlesShown.filter(c => state.joined.includes(c)).map(c => <span key={c} className="pill plain" style={{ cursor: "default" }}>{CIRCLE_BY_ID[c].name}</span>)}</div> : null}
            </ProfileSection>
            <section className="profile-section" style={{ paddingInline: 0 }}>
              <span className="section-label gutter">Stories</span>
              {visibleStories.length
                ? <div className="feed">{visibleStories.map(s => <div key={s.id}>{viewAs === "self" && s.anonymous && <p className="gutter tiny muted pt8"><Icon name="lock" size={12} /> Only you know this was you</p>}<StoryPost story={s} /></div>)}</div>
                : <p className="gutter small muted">{viewAs === "self" ? "Your Stories will live here. Share one when you're ready." : "No Stories shared with this viewer."}</p>}
            </section>
          </>
        )}

        {viewAs === "self" && (
          <div className="stack" style={{ borderTop: "1px solid var(--line)" }}>
            {state.role === "founder" && (
              <div className="list-link" style={{ cursor: "default" }}>
                <Icon name="check" />
                <span className="grow stack"><span>Founder view</span><span className="small muted">{state.asMember ? "Seeing the app as a beta member" : "Seeing after-beta features (members can't)"}</span></span>
                <button className="switch" role="switch" aria-label="Founder view" aria-checked={!state.asMember} onClick={() => set(s => ({ ...s, asMember: !s.asMember }))} />
              </div>
            )}
            {showsAfterBeta(effectiveRole(state)) && (            <Link href="/resources" className="list-link"><Icon name="heal" /><span className="grow">Support and growth</span><span className="small muted">{state.plus.active ? "HUMAN, TOO+" : "Professionals, Plus, Pro"}</span></Link>)}
            <Link href="/our-story" className="list-link"><Icon name="info" /><span className="grow">Why HUMAN, TOO exists</span></Link>
            <Link href="/covenant" className="list-link"><Icon name="heart" /><span className="grow">Community Covenant</span></Link>
            <Link href="/edit/reasons" className="list-link"><Icon name="compass" /><span className="grow">What brings you here</span></Link>
            <button className="list-link" onClick={() => { signOut().finally(() => { reset(); router.reset("/"); }); }}><Icon name="back" /><span className="grow">Sign out</span></button>
          </div>
        )}
        <div className="pb24" />
      </main>
      <BottomNav />
    </>
  );
}

/* ---------------- Someone else's profile (S11c) ---------------- */
export function Person() {
  const { id } = useParams<{ id: string }>();
  const { state, set, say } = useJourney();
  const m = MEMBERS[id];
  const blocked = state.blocked.includes(id);
  const connected = state.connections.includes(id);
  const requested = state.requested.includes(id);
  const stories = useMemo(() => state.stories.filter(s => s.authorId === id && !s.anonymous && canSee(s, viewerOf(state))).sort((a, b) => b.postedOrder - a.postedOrder), [state, id]);
  if (!m || !m.displayName || blocked) return <><TopBar back title="Profile" /><main className="main"><div className="empty"><p className="lede">This profile isn't available.</p></div></main><BottomNav /></>;
  return (
    <>
      <TopBar back title={m.displayName} />
      <main className="main">
        <div className="profile-head">
          <div className="row g16">
            <div className="stack g4 grow"><h1 className="headline">{m.displayName}</h1>{m.sectionsOpen && m.shortLine && <p className="muted">{m.shortLine}</p>}</div>
            <Avatar name={m.displayName} size="lg" />
          </div>
          {connected ? <button className="btn btn-secondary btn-sm btn-block" onClick={() => { set(s => ({ ...s, connections: s.connections.filter(c => c !== id) })); say("Connection removed. They won't be told."); }}>Connected <Icon name="check" size={16} /></button>
            : requested ? <button className="btn btn-secondary btn-sm btn-block" disabled>Request sent</button>
            : <button className="btn btn-primary btn-sm btn-block" onClick={() => { set(s => ({ ...s, requested: [...s.requested, id] })); say(`Sent. ${m.displayName} can choose whether to connect.`); }}>Offer to connect</button>}
        </div>
        {m.sectionsOpen && m.currentlyNavigating?.length ? <section className="profile-section"><span className="section-label">Currently navigating</span><div className="pills">{m.currentlyNavigating.map(e => <span key={e} className="pill" style={{ cursor: "default" }}><Icon name={EXPERIENCE_BY_ID[e].icon} size={16} />{EXPERIENCE_BY_ID[e].name}</span>)}</div></section> : null}
        {m.sectionsOpen && m.canSpeakFrom?.length ? <section className="profile-section"><span className="section-label">Experiences I can speak from</span><div className="pills">{m.canSpeakFrom.map(e => <span key={e} className="pill plain" style={{ cursor: "default" }}>{EXPERIENCE_BY_ID[e].name}</span>)}</div></section> : null}
        {m.sectionsOpen && m.learning ? <section className="profile-section"><span className="section-label">Something I'm learning</span><p className="quote">“{m.learning}”</p></section> : null}
        <section className="profile-section" style={{ paddingInline: 0 }}>
          <span className="section-label gutter">Stories</span>
          {stories.length ? <div className="feed">{stories.map(s => <StoryPost key={s.id} story={s} />)}</div> : <p className="gutter muted">{m.displayName} is still settling in. Their Stories will appear here when they share with you.</p>}
        </section>
      </main>
      <BottomNav />
    </>
  );
}

// Re-exported for tests and future screens.
export { ReactionActions, ConnectOffer };
