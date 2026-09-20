-- CASA-009: join_household(code, user_id) is SECURITY DEFINER and inserts the
-- CALLER-SUPPLIED user_id without checking it against auth.uid(). Any signed-in
-- user who has a join code can therefore add any other Casa user to any
-- household. Drop the parameter and use the session identity instead. Also
-- stop returning the household's join_code in the result — it was leaking the
-- code to a caller who, at the moment of the call, is not yet a member.

drop function if exists join_household(text, uuid);

create or replace function join_household(code text)
returns json
language plpgsql security definer
set search_path = public
as $$
declare
  h households%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into h from households where join_code = upper(code);
  if not found then
    raise exception 'Invalid join code';
  end if;

  if exists (select 1 from household_members where household_id = h.id and profile_id = uid) then
    raise exception 'Already a member';
  end if;

  insert into household_members (household_id, profile_id, role)
  values (h.id, uid, 'member');

  -- Do not leak join_code to the (until-now) non-member caller.
  return json_build_object('id', h.id, 'name', h.name);
end;
$$;
