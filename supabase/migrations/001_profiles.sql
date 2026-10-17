-- HUMAN, TOO · Step 1: member profiles
-- Paste this whole file into Supabase → SQL Editor → New query → Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 40),
  short_line text check (char_length(short_line) <= 120),
  currently_navigating text[] not null default '{}',
  can_speak_from text[] not null default '{}',
  learning text check (char_length(learning) <= 200),
  sections_open boolean not null default false,
  confirmed_adult boolean not null default false,
  is_founder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Signed-in members can see other members' basic profiles.
create policy "Members can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- You can only create and change your own profile.
create policy "Members can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and is_founder = false);

create policy "Members can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Nobody can make themselves a founder from the app.
create or replace function public.protect_founder_flag()
returns trigger language plpgsql as $$
begin
  if new.is_founder is distinct from old.is_founder and auth.role() <> 'service_role' then
    new.is_founder := old.is_founder;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_founder_flag();

-- Every new account gets an empty profile automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
