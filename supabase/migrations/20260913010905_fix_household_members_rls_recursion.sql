-- "Owners can manage members" self-referenced household_members directly
-- inside a FOR ALL policy (which also applies to SELECT). That causes
-- Postgres to raise "infinite recursion detected in policy for relation
-- household_members" on every query against the table as an authenticated
-- user (confirmed live). Mirror the existing is_member() pattern: check
-- ownership through a SECURITY DEFINER helper so the check bypasses RLS
-- instead of re-triggering it.

create or replace function is_owner(h uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = h and profile_id = auth.uid() and role = 'owner'
  );
$$;

drop policy if exists "Owners can manage members" on household_members;

create policy "Owners can manage members"
  on household_members for all using (is_owner(household_id));

-- Also harden the other SECURITY DEFINER functions against search_path
-- hijacking (handle_new_user was already fixed; these two were not).
alter function is_member(uuid) set search_path = public;
alter function join_household(text, uuid) set search_path = public;
