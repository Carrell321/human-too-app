-- HUMAN, TOO · Step 2: Stories, I See You, Same Here, replies, Circles, blocks and reports
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
--
-- Privacy rules built in here (not just in the app):
--   • Members read Stories only through visible_stories(), which applies the
--     audience, Circle membership and block rules, and hides the author of an
--     anonymous Story from everyone but the author.
--   • No public counts. Only a Story's author can see who reacted (my_story_reactions()).
--   • Nobody can list who is in a Circle.
--   • Reports can be sent but never read from the app.

-- ---------- Circles ----------
create table if not exists public.circles (
  id text primary key,
  name text not null
);
insert into public.circles (id, name) values
  ('starting-over', 'Starting Over'),
  ('finding-myself', 'Finding Myself'),
  ('rejection-resilience', 'Rejection & Resilience'),
  ('loneliness', 'Loneliness'),
  ('career-purpose', 'Career & Purpose'),
  ('faith', 'Faith')
on conflict (id) do update set name = excluded.name;
alter table public.circles enable row level security;
drop policy if exists "Members can read circles" on public.circles;
create policy "Members can read circles" on public.circles for select to authenticated using (true);

create table if not exists public.circle_members (
  circle_id text not null references public.circles(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  joined_at timestamptz not null default now(),
  primary key (circle_id, member_id)
);
alter table public.circle_members enable row level security;
drop policy if exists "See only your own Circles" on public.circle_members;
create policy "See only your own Circles" on public.circle_members for select to authenticated using (member_id = auth.uid());
drop policy if exists "Join a Circle" on public.circle_members;
create policy "Join a Circle" on public.circle_members for insert to authenticated with check (member_id = auth.uid());
drop policy if exists "Leave a Circle" on public.circle_members;
create policy "Leave a Circle" on public.circle_members for delete to authenticated using (member_id = auth.uid());

-- ---------- Blocks ----------
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
drop policy if exists "See your own blocks" on public.blocks;
create policy "See your own blocks" on public.blocks for select to authenticated using (blocker_id = auth.uid());
drop policy if exists "Block someone" on public.blocks;
create policy "Block someone" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
drop policy if exists "Unblock someone" on public.blocks;
create policy "Unblock someone" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

-- ---------- Connections (My People) — filled in by a later step ----------
create table if not exists public.connections (
  member_a uuid not null references public.profiles(id) on delete cascade,
  member_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_a, member_b),
  check (member_a < member_b)
);
alter table public.connections enable row level security;
drop policy if exists "See your own connections" on public.connections;
create policy "See your own connections" on public.connections for select to authenticated
  using (auth.uid() in (member_a, member_b));

-- ---------- Stories ----------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  anonymous boolean not null default false,
  experiences text[] not null default '{}' check (cardinality(experiences) <= 5),
  audience text not null check (audience in ('open', 'people', 'circle')),
  circle_id text references public.circles(id),
  support text not null check (support in ('listen', 'relate', 'encourage', 'perspective', 'resources')),
  content_note text check (content_note in ('Loss', 'Suicide or self-harm', 'Abuse', 'Eating and body', 'Substances')),
  body text not null check (char_length(body) between 1 and 3000),
  replies_off boolean not null default false,
  flagged_urgent boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((audience = 'circle') = (circle_id is not null)),
  check (not anonymous or audience in ('open', 'circle'))
);
create index if not exists stories_created_idx on public.stories (created_at desc);
alter table public.stories enable row level security;
-- Direct table access is only ever to your own Stories. Everyone else's come through visible_stories().
drop policy if exists "Read your own Stories" on public.stories;
create policy "Read your own Stories" on public.stories for select to authenticated using (author_id = auth.uid());
drop policy if exists "Share a Story" on public.stories;
create policy "Share a Story" on public.stories for insert to authenticated with check (
  author_id = auth.uid() and deleted_at is null
  and (circle_id is null or exists (select 1 from public.circle_members m where m.circle_id = stories.circle_id and m.member_id = auth.uid()))
);
drop policy if exists "Change your own Story" on public.stories;
create policy "Change your own Story" on public.stories for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Once anonymous, always anonymous; an audience can only narrow; the author and date never change.
create or replace function public.protect_story()
returns trigger language plpgsql as $$
begin
  new.author_id := old.author_id;
  new.created_at := old.created_at;
  new.flagged_urgent := old.flagged_urgent or new.flagged_urgent;
  if old.anonymous then new.anonymous := true; end if;
  if new.audience is distinct from old.audience
     and not (old.audience = 'open' and new.audience in ('circle', 'people')) then
    new.audience := old.audience; new.circle_id := old.circle_id;
  end if;
  if old.deleted_at is not null then new.deleted_at := old.deleted_at; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists stories_protect on public.stories;
create trigger stories_protect before update on public.stories for each row execute function public.protect_story();

-- ---------- Visibility helpers ----------
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create or replace function public.can_see_story(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from stories s
    where s.id = sid and s.deleted_at is null and (
      s.author_id = auth.uid() or (
        not is_blocked_between(s.author_id, auth.uid()) and (
          s.audience = 'open'
          or (s.audience = 'circle' and exists (select 1 from circle_members m where m.circle_id = s.circle_id and m.member_id = auth.uid()))
          or (s.audience = 'people' and exists (select 1 from connections c
                where (c.member_a = s.author_id and c.member_b = auth.uid()) or (c.member_b = s.author_id and c.member_a = auth.uid())))
        )
      )
    )
  );
$$;

-- Every Story you're allowed to see, newest first, with anonymous authors hidden.
create or replace function public.visible_stories(max_rows int default 200)
returns table (
  id uuid, author_id uuid, author_name text, is_mine boolean, anonymous boolean, experiences text[],
  audience text, circle_id text, support text, content_note text, body text, replies_off boolean,
  flagged_urgent boolean, created_at timestamptz, edited boolean
) language sql stable security definer set search_path = public as $$
  select s.id,
         case when s.anonymous and s.author_id <> auth.uid() then null else s.author_id end,
         case when s.anonymous and s.author_id <> auth.uid() then null else p.display_name end,
         s.author_id = auth.uid(),
         s.anonymous, s.experiences, s.audience, s.circle_id, s.support, s.content_note, s.body, s.replies_off,
         case when s.author_id = auth.uid() then s.flagged_urgent else false end,
         s.created_at, false
  from stories s join profiles p on p.id = s.author_id
  where auth.uid() is not null and public.can_see_story(s.id)
  order by s.created_at desc
  limit least(greatest(max_rows, 1), 500);
$$;

-- ---------- I See You / Same Here ----------
create table if not exists public.reactions (
  story_id uuid not null references public.stories(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('see', 'same')),
  created_at timestamptz not null default now(),
  primary key (story_id, member_id, kind)
);
alter table public.reactions enable row level security;
drop policy if exists "See your own reactions" on public.reactions;
create policy "See your own reactions" on public.reactions for select to authenticated using (member_id = auth.uid());
drop policy if exists "React to a Story you can see" on public.reactions;
create policy "React to a Story you can see" on public.reactions for insert to authenticated
  with check (member_id = auth.uid() and public.can_see_story(story_id)
              and not exists (select 1 from stories s where s.id = story_id and s.author_id = auth.uid()));
drop policy if exists "Take back a reaction" on public.reactions;
create policy "Take back a reaction" on public.reactions for delete to authenticated using (member_id = auth.uid());

-- Only the author sees who reacted to their Stories. No one else ever sees counts.
create or replace function public.my_story_reactions()
returns table (story_id uuid, member_id uuid, member_name text, kind text)
language sql stable security definer set search_path = public as $$
  select r.story_id, r.member_id, p.display_name, r.kind
  from reactions r join stories s on s.id = r.story_id join profiles p on p.id = r.member_id
  where s.author_id = auth.uid() and s.deleted_at is null
    and not public.is_blocked_between(r.member_id, auth.uid())
  order by r.created_at;
$$;

-- ---------- Replies ----------
create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  parent_id uuid references public.replies(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  anonymous boolean not null default false,
  body text not null check (char_length(body) between 1 and 1000),
  held_for_review boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists replies_story_idx on public.replies (story_id, created_at);
alter table public.replies enable row level security;
drop policy if exists "Read your own replies" on public.replies;
create policy "Read your own replies" on public.replies for select to authenticated using (author_id = auth.uid());
-- Checked with the owner's view of the data, so replies to other people's Stories work.
create or replace function public.can_reply(sid uuid, anon boolean, parent uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_see_story(sid)
    and exists (select 1 from stories s where s.id = sid and s.support <> 'listen' and not s.replies_off
                and (not anon or s.audience = 'circle'))
    and (parent is null or exists (select 1 from replies p where p.id = parent and p.story_id = sid
                                   and p.parent_id is null and p.deleted_at is null));
$$;
drop policy if exists "Reply to a Story you can see" on public.replies;
create policy "Reply to a Story you can see" on public.replies for insert to authenticated with check (
  author_id = auth.uid() and deleted_at is null and public.can_reply(story_id, anonymous, parent_id)
);
drop policy if exists "Delete your own reply" on public.replies;
create policy "Delete your own reply" on public.replies for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

-- A reply can only be deleted by its author; nothing else about it changes, and a held reply stays held.
create or replace function public.protect_reply()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  old.deleted_at := coalesce(old.deleted_at, new.deleted_at);
  return old;
end $$;
drop trigger if exists replies_protect on public.replies;
create trigger replies_protect before update on public.replies for each row execute function public.protect_reply();

create or replace function public.story_replies(sid uuid)
returns table (id uuid, parent_id uuid, author_id uuid, author_name text, is_mine boolean, anonymous boolean,
               body text, held_for_review boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.parent_id,
         case when r.anonymous and r.author_id <> auth.uid() then null else r.author_id end,
         case when r.anonymous and r.author_id <> auth.uid() then null else p.display_name end,
         r.author_id = auth.uid(), r.anonymous, r.body, r.held_for_review, r.created_at
  from replies r join profiles p on p.id = r.author_id
  where r.story_id = sid and r.deleted_at is null and public.can_see_story(sid)
    and (not r.held_for_review or r.author_id = auth.uid())
    and not public.is_blocked_between(r.author_id, auth.uid())
  order by r.created_at;
$$;

-- ---------- Reports (read only by the HUMAN, TOO team in the dashboard) ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  story_id uuid references public.stories(id) on delete set null,
  reply_id uuid references public.replies(id) on delete set null,
  reason text not null check (char_length(reason) <= 80),
  note text check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists "Send a report" on public.reports;
create policy "Send a report" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and status = 'open');

-- Let signed-in members call the reading functions; nobody signed out can.
revoke all on function public.visible_stories(int), public.my_story_reactions(), public.story_replies(uuid),
  public.can_see_story(uuid), public.is_blocked_between(uuid, uuid), public.can_reply(uuid, boolean, uuid) from public, anon;
grant execute on function public.visible_stories(int), public.my_story_reactions(), public.story_replies(uuid),
  public.can_see_story(uuid), public.is_blocked_between(uuid, uuid), public.can_reply(uuid, boolean, uuid) to authenticated;
