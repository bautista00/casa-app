-- Casa — Initial schema
-- Run against a fresh Supabase project

-- Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  emoji text not null default '🏠',
  phone_e164 text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read any profile"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Households
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique,
  week_end_day int not null default 0 check (week_end_day between 0 and 6),
  timezone text not null default 'America/Argentina/Buenos_Aires',
  reward_text text,
  dreaded_template_id uuid,
  created_at timestamptz not null default now()
);

alter table households enable row level security;

-- Household members
create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, profile_id)
);

alter table household_members enable row level security;

-- Helper: is user a member of household?
create or replace function is_member(h uuid)
returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from household_members
    where household_id = h and profile_id = auth.uid()
  );
$$;

-- RLS for households: members can read
create policy "Members can read their households"
  on households for select using (is_member(id));

create policy "Owners can update their households"
  on households for update using (
    exists (
      select 1 from household_members
      where household_id = id and profile_id = auth.uid() and role = 'owner'
    )
  );

-- RLS for household_members
create policy "Members can read members of their households"
  on household_members for select using (is_member(household_id));

create policy "Owners can manage members"
  on household_members for all using (
    exists (
      select 1 from household_members hm
      where hm.household_id = household_members.household_id
        and hm.profile_id = auth.uid()
        and hm.role = 'owner'
    )
  );

-- Allow users to leave a household (delete their own row)
create policy "Users can leave households"
  on household_members for delete using (profile_id = auth.uid());

-- Join household RPC (security definer — user can't read households they're not in yet)
create or replace function join_household(code text, user_id uuid)
returns json
language plpgsql security definer as $$
declare
  h households%rowtype;
begin
  select * into h from households where join_code = upper(code);
  if not found then
    raise exception 'Invalid join code';
  end if;

  -- Check if already a member
  if exists (select 1 from household_members where household_id = h.id and profile_id = user_id) then
    raise exception 'Already a member';
  end if;

  insert into household_members (household_id, profile_id, role)
  values (h.id, user_id, 'member');

  return row_to_json(h);
end;
$$;

-- Task templates (recurring task definitions)
create table task_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  notes text,
  effort text not null default 'normal' check (effort in ('rapida', 'normal', 'pesada')),
  active boolean not null default true,
  recurrence text not null check (recurrence in ('daily', 'weekly', 'monthly')),
  days_of_week int[] not null default '{}',
  day_of_month int,
  assignment text not null default 'fixed' check (assignment in ('fixed', 'rotate')),
  default_assignee_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table task_templates enable row level security;

create policy "Members can read templates"
  on task_templates for select using (is_member(household_id));

create policy "Members can manage templates"
  on task_templates for all using (is_member(household_id));

-- Add FK from households.dreaded_template_id → task_templates
alter table households
  add constraint fk_dreaded_template
  foreign key (dreaded_template_id) references task_templates(id)
  on delete set null;

-- Tasks (concrete instances)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  template_id uuid references task_templates(id) on delete set null,
  title text not null,
  notes text,
  effort text not null default 'normal' check (effort in ('rapida', 'normal', 'pesada')),
  points int not null default 3,
  assignee_id uuid references profiles(id),
  due_date date,
  status text not null default 'open' check (status in ('open', 'done')),
  completed_by uuid references profiles(id),
  completed_at timestamptz,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  -- Prevent duplicate task instances from recurring templates
  unique nulls not distinct (template_id, due_date)
);

alter table tasks enable row level security;

create policy "Members can read tasks"
  on tasks for select using (is_member(household_id));

create policy "Members can create tasks"
  on tasks for insert with check (is_member(household_id));

create policy "Members can update tasks"
  on tasks for update using (is_member(household_id));

create policy "Members can delete tasks"
  on tasks for delete using (is_member(household_id));

-- Indexes for common queries
create index idx_tasks_household_status on tasks(household_id, status);
create index idx_tasks_household_due on tasks(household_id, due_date);
create index idx_tasks_template_due on tasks(template_id, due_date);

-- Weeks (closed week snapshots)
create table weeks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  closed_at timestamptz,
  winner_profile_id uuid references profiles(id),
  last_place_profile_id uuid references profiles(id),
  reward_text_snapshot text,
  unique (household_id, week_end)
);

alter table weeks enable row level security;

create policy "Members can read weeks"
  on weeks for select using (is_member(household_id));

-- Week scores (frozen per-member stats for a closed week)
create table week_scores (
  week_id uuid not null references weeks(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  points int not null default 0,
  tasks_done int not null default 0,
  primary key (week_id, profile_id)
);

alter table week_scores enable row level security;

create policy "Members can read week scores"
  on week_scores for select using (
    exists (
      select 1 from weeks w
      where w.id = week_scores.week_id and is_member(w.household_id)
    )
  );

-- Notification preferences
create table notification_prefs (
  profile_id uuid not null references profiles(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  whatsapp_enabled boolean not null default true,
  push_enabled boolean not null default false,
  primary key (profile_id, household_id)
);

alter table notification_prefs enable row level security;

create policy "Users can manage own notification prefs"
  on notification_prefs for all using (profile_id = auth.uid());

-- Push subscriptions (for web push)
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions"
  on push_subscriptions for all using (profile_id = auth.uid());

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql security definer as $$
begin
  insert into profiles (id, display_name, emoji)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Nuevo'), '🏠');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Enable realtime for tasks (so the board updates live)
alter publication supabase_realtime add table tasks;
