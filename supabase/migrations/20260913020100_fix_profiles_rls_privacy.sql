-- CASA-005: `profiles for select using (true)` lets ANY signed-in user read
-- every Casa user's display_name and phone_e164, across every household —
-- not just their own household mates. Every other table in this schema is
-- correctly scoped through is_member(); profiles was the one left open.
--
-- Replace it with two policies: a user can always read their own profile,
-- and a user can read the profiles of people who share a household with
-- them. The household-mate check goes through a SECURITY DEFINER helper,
-- the same pattern as is_member()/is_owner() — it must be SECURITY DEFINER
-- so the join against household_members does not re-trigger that table's
-- own RLS (that re-entrancy is exactly what caused CASA-001; do not repeat
-- it here).

drop policy if exists "Users can read any profile" on profiles;

create or replace function shares_household(p uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from household_members mine
    join household_members theirs on theirs.household_id = mine.household_id
    where mine.profile_id = auth.uid() and theirs.profile_id = p
  );
$$;

create policy "Users can read their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can read profiles of household mates"
  on profiles for select using (shares_household(id));
