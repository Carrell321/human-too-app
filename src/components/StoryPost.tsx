import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Avatar } from "./Chrome";
import { Link, useRouter } from "../router/router";
import { useJourney, type JourneyState } from "../state/journey";
import { EXPERIENCE_BY_ID, SUPPORT } from "../lib/content";
import { CIRCLE_BY_ID, MEMBERS } from "../lib/sample-data";
import type { Story, StoryPhoto } from "../lib/types";

export function authorName(s: JourneyState, story: Story): string | null {
  if (story.anonymous) return null;
  if (story.authorId === "me") return s.displayName;
  return MEMBERS[story.authorId]?.displayName ?? null;
}

/** The two MVP reactions (S8). Counts are never shown to non-authors (D-6). */
export function useReact(story: Story) {
  const { state, set, openSheet } = useJourney();
  const mine = state.reactions[story.id] ?? {};
  const toggle = (kind: "see" | "same") => {
    const turningOn = !mine[kind];
    set(s => ({ ...s, reactions: { ...s.reactions, [story.id]: { ...s.reactions[story.id], [kind]: turningOn } } }));
    if (turningOn && !state.explainerSeen) {
      set(s => ({ ...s, explainerSeen: true }));
      openSheet({ kind: "explainer" });
    }
  };
  return { mine, toggle };
}

export function ReactionActions({ story, onReply }: { story: Story; onReply?: () => void }) {
  const { state, openSheet } = useJourney();
  const { mine, toggle } = useReact(story);
  const name = authorName(state, story);
  if (story.authorId === "me") return <PrivateSummary story={story} />;
  return (
    <div className="actions">
      <button className="act" aria-pressed={!!mine.see} onClick={() => toggle("see")}>
        <Icon name="heart" size={20} filled={!!mine.see} />
        {mine.see ? (name ? `You see ${name}` : "You see them") : "I See You"}
      </button>
      <button className="act" aria-pressed={!!mine.same} onClick={() => toggle("same")}>
        <Icon name="same" size={20} strokeWidth={mine.same ? 2.2 : 1.7} /> Same Here
      </button>
      {onReply && story.support !== "listen" && !story.repliesOff && (
        <button className="act" onClick={onReply} aria-label="Join the Conversation"><Icon name="chat" size={20} /></button>
      )}
      <button className="act more" onClick={() => openSheet({ kind: "storyMenu", storyId: story.id })} aria-label="More options"><Icon name="more" size={20} /></button>
    </div>
  );
}

/** S8b: only the author sees who reacted and how many. */
export function PrivateSummary({ story }: { story: Story }) {
  const { openSheet } = useJourney();
  const sample = SIMULATED_REACTIONS[story.id];
  return (
    <div className="actions">
      {sample
        ? <button className="private-summary" onClick={() => openSheet({ kind: "reactors", storyId: story.id })}><Icon name="lock" size={15} /> {sample.filter(r => r[1] === "see").length} people see you · {sample.filter(r => r[1] === "same").length} said Same Here · only you can see this</button>
        : <span className="private-summary"><Icon name="lock" size={15} /> When someone sees you, you'll know here. Only you will see it.</span>}
      <button className="act more" onClick={() => openSheet({ kind: "storyMenu", storyId: story.id })} aria-label="More options"><Icon name="more" size={20} /></button>
    </div>
  );
}

/** Reactions the prototype simulates on the member's own Stories, so the author view can be experienced. */
export const SIMULATED_REACTIONS: Record<string, [string, "see" | "same"][]> = {};

/** S8c: consent-based connect offer after Same Here. */
export function ConnectOffer({ story }: { story: Story }) {
  const { state, set, say } = useJourney();
  const mine = state.reactions[story.id] ?? {};
  if (!mine.same || story.anonymous || story.authorId === "me" || state.connections.includes(story.authorId) || state.connectDismissed.includes(story.id)) return null;
  const name = MEMBERS[story.authorId]?.displayName ?? "them";
  if (state.requested.includes(story.authorId)) {
    return <div className="connect-offer"><span>You've offered to connect with {name}. {name} can choose whether to say yes.</span></div>;
  }
  return (
    <div className="connect-offer">
      <span>You and {name} share this. Want to let {name} know you're open to connecting?</span>
      <div className="row g8">
        <button className="btn btn-primary btn-sm" onClick={() => {
          set(s => ({ ...s, requested: [...s.requested, story.authorId] }));
          say(`Sent. ${name} can choose whether to connect.`);
          // Prototype: one sample member accepts, so My People can be experienced.
          if (story.authorId === "jordan" || story.authorId === "maya") {
            setTimeout(() => {
              set(s => ({ ...s, requested: s.requested.filter(x => x !== story.authorId), connections: [...new Set([...s.connections, story.authorId])] }));
              say(`${name} said yes. You're now connected.`);
            }, 4000);
          }
        }}>Offer to connect</button>
        <button className="text-btn quiet" onClick={() => set(s => ({ ...s, connectDismissed: [...s.connectDismissed, story.id] }))}>No thanks</button>
      </div>
    </div>
  );
}

/** A Story's photo. Never shown under a content-note cover. */
export function StoryPhotoView({ photo, onOpen }: { photo: StoryPhoto; onOpen?: () => void }) {
  const img = <img className="story-photo" src={photo.src} alt={photo.alt || "Photo shared with this Story"} width={photo.width} height={photo.height} loading="lazy" />;
  return onOpen ? <button onClick={onOpen} aria-label="Open Story" style={{ display: "block", width: "100%" }}>{img}</button> : img;
}

export function StoryPost({ story, full = false }: { story: Story; full?: boolean }) {
  const { state, set } = useJourney();
  const router = useRouter();
  const name = authorName(state, story);
  const covered = story.contentNote && !state.uncovered.includes(story.id);
  const isMine = story.authorId === "me";
  const open = () => router.push("/story/" + story.id);
  return (
    <article className="post" aria-label={name ? `Story by ${name}` : "Story shared anonymously"}>
      <Avatar name={name ?? undefined} anonymous={!name} photo={isMine ? state.profile.photo : null} />
      <div className="stack g8">
        <div className="stack">
          <div className="post-head">
            {name && !isMine ? <Link href={"/people/" + story.authorId} className="post-name">{name}</Link> : <span className="post-name">{isMine ? (story.anonymous ? "You, anonymously" : name) : "A member"}</span>}
            <span className="meta">{story.postedLabel}{story.edited ? " · edited" : ""}</span>
          </div>
          <div className="post-sub">
            {story.experiences.map(e => <span key={e}>{EXPERIENCE_BY_ID[e].name}</span>).reduce<ReactNode[]>((acc, el, i) => i ? [...acc, <span key={"d" + i}>·</span>, el] : [el], [])}
            {story.audience === "circle" && story.circleId && <><span>·</span><span>in {CIRCLE_BY_ID[story.circleId].name}</span></>}
            {isMine && story.audience !== "circle" && <><span>·</span><span>{story.audience === "open" ? "Open" : "My People"}</span></>}
          </div>
        </div>
        {covered ? (
          <div className="note-cover">
            <span className="grow small">This Story mentions {story.contentNote!.toLowerCase()}.</span>
            <button className="btn btn-secondary btn-sm" onClick={() => set(s => ({ ...s, uncovered: [...s.uncovered, story.id] }))}>Read Story</button>
          </div>
        ) : full ? (
          <p className="post-text" style={{ fontSize: 18 }}>{story.text}</p>
        ) : (
          <button onClick={open} style={{ textAlign: "left" }} aria-label="Open Story"><p className="post-text clamp">{story.text}</p></button>
        )}
        {story.photo && !covered && <StoryPhotoView photo={story.photo} onOpen={full ? undefined : open} />}
        <p className="asked">Asked for <b>{SUPPORT[story.support].name}</b></p>
        <ReactionActions story={story} onReply={full ? undefined : open} />
        <ConnectOffer story={story} />
      </div>
    </article>
  );
}
