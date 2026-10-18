import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { effectiveRole, useJourney, storyById, toggle } from "../state/journey";
import { showsAfterBeta } from "../lib/launch";
import { useRouter } from "../router/router";
import { CIRCLE_BY_ID, MEMBERS } from "../lib/sample-data";
import { EXPERIENCE_BY_ID, REPORT_REASONS } from "../lib/content";
import { SIMULATED_REACTIONS, authorName } from "./StoryPost";
import { blockMember, joinCircle, live, persist, sendReport, updateStory } from "../lib/community";
import { Avatar } from "./Chrome";

function Sheet({ title, children, onClose, dismissable = true }: { title: string; children: ReactNode; onClose: () => void; dismissable?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>("button, input, textarea, select");
    first?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && dismissable) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissable, onClose]);
  return (
    <div className="scrim" onClick={e => { if (e.target === e.currentTarget && dismissable) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <span className="grabber" aria-hidden="true" />
        <div className="row g12">
          <h2 className="sheet-title grow">{title}</h2>
          {dismissable && <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>}
        </div>
        {children}
      </div>
    </div>
  );
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const { say } = useJourney();
  return (
    <button className="btn btn-secondary btn-sm" onClick={() => {
      navigator.clipboard?.writeText(value).then(() => say("Copied."), () => say(`Select the text to copy it: ${value}`))
        ?? say(`Select the text to copy it: ${value}`);
    }}><Icon name="copy" size={16} /> {label}</button>
  );
}

/** Support Resources sheet (Cross-cutting). Numbers verified by a clinician before beta. */
export function Resources() {
  const { state, closeSheet } = useJourney();
  const router = useRouter();
  return (
    <div className="stack g12">
      <div className="resource urgent">
        <span className="strong">If you're in immediate danger</span>
        <div className="row g12"><span className="number grow">911</span><a className="btn btn-danger btn-sm" href="tel:911">Call</a></div>
      </div>
      <div className="resource">
        <span className="strong">988 Suicide &amp; Crisis Lifeline</span>
        <span className="small muted">Call or text, any time. Free and confidential.</span>
        <div className="row g8"><span className="number grow">988</span><a className="btn btn-primary btn-sm" href="tel:988">Call</a><a className="btn btn-secondary btn-sm" href="sms:988">Text</a></div>
      </div>
      <div className="resource">
        <span className="strong">Crisis Text Line</span>
        <span className="small muted">Text HOME to 741741.</span>
        <div className="row g8"><span className="number grow">741741</span><CopyButton value="741741" /></div>
      </div>
      <div className="resource">
        <span className="strong">Someone you trust</span>
        <span className="small">It's okay to say: "I'm having a hard time. Can you talk?"</span>
        <div><CopyButton value="I'm having a hard time. Can you talk?" label="Copy message" /></div>
      </div>
      {showsAfterBeta(effectiveRole(state)) && (
      <a className="resource" href="#/professionals" style={{ textDecoration: "none" }} onClick={e => { e.preventDefault(); closeSheet(); router.push("/professionals"); }}>
        <span className="row g8"><span className="strong">Find a verified professional</span><span className="tier-tag later">After beta</span></span>
        <span className="small muted">Licensed therapists and counselors, by state and approach. Always free.</span>
      </a>
      )}
      <p className="small muted">HUMAN, TOO is a peer community, not an emergency service. Our team reviews safety concerns during published hours. If a call or text button doesn't open, dial the number directly.</p>
    </div>
  );
}

export function SheetHost() {
  const { state, set, sheet, closeSheet, openSheet, say } = useJourney();
  const router = useRouter();
  const [reason, setReason] = useState<number | null>(null);
  const [alsoBlock, setAlsoBlock] = useState(false);
  useEffect(() => { setReason(null); setAlsoBlock(false); }, [sheet]);
  if (!sheet) return null;

  switch (sheet.kind) {
    case "support":
      return <Sheet title="You deserve support right now" onClose={closeSheet}>{sheet.lead && <p className="gentle">{sheet.lead}</p>}<Resources /></Sheet>;

    case "explainer":
      return (
        <Sheet title="Two ways to say you're here" onClose={closeSheet}>
          <div className="choice-list">
            <div className="choice"><Icon name="heart" /><span><span className="strong">I See You</span><span className="desc">I hear you, and I'm holding space.</span></span></div>
            <div className="choice"><Icon name="same" /><span><span className="strong">Same Here</span><span className="desc">I've lived something like this too.</span></span></div>
          </div>
          <p className="small muted">Only the author sees who reacted. There are no public counts.</p>
          <button className="btn btn-primary btn-block" onClick={closeSheet}>Got it</button>
        </Sheet>
      );

    case "focus":
      return (
        <Sheet title="What feels present today?" onClose={closeSheet}>
          <div className="pills">
            {state.experiences.map(id => (
              <button key={id} className="pill" aria-pressed={state.checkin.focus === id} onClick={() => {
                set(s => ({ ...s, checkin: { ...s.checkin, focus: s.checkin.focus === id ? null : id }, todayIds: null }));
                closeSheet();
              }}><Icon name={EXPERIENCE_BY_ID[id].icon} size={18} />{EXPERIENCE_BY_ID[id].name}</button>
            ))}
          </div>
          <button className="text-btn" onClick={() => { closeSheet(); router.push("/edit/experiences"); }}>Change what I'm navigating</button>
        </Sheet>
      );

    case "reactors": {
      const list = SIMULATED_REACTIONS[sheet.storyId] ?? [];
      return (
        <Sheet title="People who see you" onClose={closeSheet}>
          <p className="privacy-line"><Icon name="lock" size={15} /> Only you can see this.</p>
          <div className="choice-list">
            {list.map(([who, kind]) => (
              <button key={who + kind} className="choice" onClick={() => { closeSheet(); router.push("/people/" + who); }}>
                <Avatar name={MEMBERS[who].displayName} size="sm" />
                <span className="grow strong">{MEMBERS[who].displayName}</span>
                <span className="small muted">{kind === "see" ? "I See You" : "Same Here"}</span>
              </button>
            ))}
          </div>
        </Sheet>
      );
    }

    case "storyMenu": {
      const story = storyById(state, sheet.storyId);
      if (!story) return null;
      if (story.authorId === "me") {
        return (
          <Sheet title="Your Story" onClose={closeSheet}>
            <div className="stack">
              {story.support !== "listen" && (
                <button className="menu-row" onClick={() => {
                  if (live()) persist(updateStory(story.id, { replies_off: !story.repliesOff }), say);
                  set(s => ({ ...s, stories: s.stories.map(x => x.id === story.id ? { ...x, repliesOff: !x.repliesOff } : x) }));
                  closeSheet(); say(story.repliesOff ? "Replies are open again." : "Replies are off.");
                }}><Icon name="chat" />{story.repliesOff ? "Open replies again" : "Turn off replies"}</button>
              )}
              {!story.anonymous && story.audience !== "people" && (
                <button className="menu-row" onClick={() => openSheet({
                  kind: "confirm", title: "Make this Story anonymous?", body: "Your name will be removed from it. This can't be undone.", confirmLabel: "Make anonymous",
                  onConfirm: () => { if (live()) persist(updateStory(story.id, { anonymous: true }), say); set(s => ({ ...s, stories: s.stories.map(x => x.id === story.id ? { ...x, anonymous: true } : x) })); say("Your Story is now anonymous."); },
                })}><Icon name="anon" />Make anonymous</button>
              )}
              <button className="menu-row danger" onClick={() => openSheet({
                kind: "confirm", title: "Delete this Story?", body: "This removes your Story and its replies for everyone.", confirmLabel: "Delete Story", cancelLabel: "Keep it", danger: true,
                onConfirm: () => { if (live()) persist(updateStory(story.id, { deleted: true }), say, "Your Story wasn't deleted"); set(s => ({ ...s, stories: s.stories.map(x => x.id === story.id ? { ...x, deleted: true } : x) })); say("Your Story was deleted."); router.reset("/you"); },
              })}><Icon name="close" />Delete</button>
            </div>
          </Sheet>
        );
      }
      const name = authorName(state, story);
      return (
        <Sheet title="Options" onClose={closeSheet}>
          <div className="stack">
            <button className="menu-row" onClick={() => openSheet({ kind: "report", storyId: story.id })}><Icon name="flag" />Report</button>
            {name ? (
              <button className="menu-row danger" onClick={() => openSheet({
                kind: "confirm", title: `Block ${name}?`, body: "You won't see each other's Stories, replies or profiles, and they can't connect with you. They won't be told.", confirmLabel: "Block", danger: true,
                onConfirm: () => {
                  if (live()) persist(blockMember(story.authorId), say, "The block didn't save");
                  set(s => ({ ...s, blocked: [...s.blocked, story.authorId], connections: s.connections.filter(c => c !== story.authorId), todayIds: null }));
                  say(`${name} is blocked. They won't be told.`); router.reset("/today");
                },
              })}><Icon name="alert" />Block {name}</button>
            ) : (
              <button className="menu-row" onClick={() => { set(s => ({ ...s, hidden: [...s.hidden, story.id], todayIds: null })); closeSheet(); say("Story hidden."); }}><Icon name="close" />Hide this Story</button>
            )}
          </div>
        </Sheet>
      );
    }

    case "report": {
      const story = storyById(state, sheet.storyId);
      const name = story && authorName(state, story);
      return (
        <Sheet title="What's going on?" onClose={closeSheet}>
          <div className="choice-list" role="radiogroup" aria-label="Reason">
            {REPORT_REASONS.map((r, i) => (
              <button key={r} className="choice" role="radio" aria-checked={reason === i} onClick={() => setReason(i)}><span className="radio-dot" /><span className="grow">{r}</span></button>
            ))}
          </div>
          <div className="field"><label htmlFor="report-note">Anything else we should know? (optional)</label><textarea id="report-note" className="input" rows={3} maxLength={500} /></div>
          {name && <label className="checkbox"><input type="checkbox" checked={alsoBlock} onChange={e => setAlsoBlock(e.target.checked)} /> Also block {name}</label>}
          <button className="btn btn-primary btn-block" disabled={reason === null} onClick={() => {
            if (live() && story && reason !== null) {
              const note = (document.getElementById("report-note") as HTMLTextAreaElement | null)?.value ?? "";
              persist(sendReport(story.id, REPORT_REASONS[reason], note), say, "Your report didn't send");
              if (alsoBlock) persist(blockMember(story.authorId), say, "The block didn't save");
            }
            if (alsoBlock && story) set(s => ({ ...s, blocked: [...s.blocked, story.authorId], todayIds: null }));
            say("Thank you. A person on our team will review this and let you know what happens.");
            if (reason === 0) openSheet({ kind: "support", lead: "Thank you for speaking up. If someone is in immediate danger, call 911." });
            else closeSheet();
            if (alsoBlock) router.reset("/today");
          }}>Send report</button>
        </Sheet>
      );
    }

    case "confirm":
      return (
        <Sheet title={sheet.title} onClose={closeSheet}>
          <p className="muted">{sheet.body}</p>
          <div className="stack g8">
            <button className={"btn btn-block " + (sheet.danger ? "btn-danger" : "btn-primary")} onClick={() => { closeSheet(); sheet.onConfirm(); }}>{sheet.confirmLabel}</button>
            <button className="btn btn-secondary btn-block" onClick={closeSheet}>{sheet.cancelLabel ?? "Cancel"}</button>
          </div>
        </Sheet>
      );

    case "join": {
      const c = CIRCLE_BY_ID[sheet.circleId];
      return (
        <Sheet title={`Join ${c.name}`} onClose={closeSheet}>
          <ul className="stack g8" style={{ margin: 0, paddingLeft: 20 }}>
            {c.norms.map(n => <li key={n}>{n}</li>)}
            <li>Our Community Covenant applies here too.</li>
          </ul>
          <p className="privacy-line"><Icon name="lock" size={15} /> No one sees a list of who's here. People only see you when you share or reply.</p>
          <div className="stack g8">
            <button className="btn btn-primary btn-block" onClick={() => {
              if (live()) persist(joinCircle(c.id), say, "Joining didn't save");
              set(s => ({ ...s, joined: [...new Set([...s.joined, c.id])], todayIds: null }));
              closeSheet(); say(`You're part of ${c.name} now.`);
            }}>Join Circle</button>
            <button className="btn btn-secondary btn-block" onClick={closeSheet}>Not yet</button>
          </div>
        </Sheet>
      );
    }

    case "safety": {
      if (sheet.level === "covenant") {
        return (
          <Sheet title="We couldn't share this yet" onClose={closeSheet}>
            <p>Part of it may go against our Covenant: <b>{sheet.category}</b>.</p>
            <p className="small muted">Your draft is saved. Nothing was shared.</p>
            <div className="stack g8">
              <button className="btn btn-primary btn-block" onClick={closeSheet}>Edit my Story</button>
              <button className="btn btn-secondary btn-block" onClick={() => { closeSheet(); say("A person on our team will review it. Your draft is saved."); }}>Ask for a review</button>
            </div>
          </Sheet>
        );
      }
      if (sheet.level === "distress") {
        return (
          <Sheet title="It sounds like you're carrying a lot" onClose={closeSheet}>
            <p className="muted">Would you like some support options before you share?</p>
            <div className="stack g8">
              <button className="btn btn-accent btn-block" onClick={() => openSheet({ kind: "support" })}>See support options</button>
              <button className="btn btn-primary btn-block" onClick={() => { closeSheet(); sheet.onShare?.(); }}>Share my Story</button>
              <button className="btn btn-secondary btn-block" onClick={closeSheet}>Keep editing</button>
            </div>
          </Sheet>
        );
      }
      return (
        <Sheet title="Your safety matters most" onClose={closeSheet} dismissable={false}>
          <p className="gentle">Your safety matters more than anything you could share here. If you might act on thoughts of ending your life or hurting yourself, please reach out now.</p>
          <Resources />
          <div className="stack g8">
            <button className="btn btn-secondary btn-block" onClick={() => { closeSheet(); sheet.onShare?.(); }}>Share my Story</button>
            <button className="btn btn-secondary btn-block" onClick={closeSheet}>Keep editing</button>
          </div>
        </Sheet>
      );
    }
  }
}

export function Toast() {
  const { toast } = useJourney();
  return toast ? <div className="toast" role="status">{toast}</div> : <div className="sr-only" role="status" />;
}

export { toggle };
