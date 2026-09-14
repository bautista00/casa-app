grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- Two households, exactly the PRODUCT.md scenario: Bauti+brother, parents separately.
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'), -- bauti  (household A owner)
  ('22222222-2222-2222-2222-222222222222'), -- herman (household A member)
  ('33333333-3333-3333-3333-333333333333'); -- mama   (household B owner)

update profiles set display_name='Bauti', phone_e164='+5491133334444' where id='11111111-1111-1111-1111-111111111111';
update profiles set display_name='Hernan', phone_e164='+5491155556666' where id='22222222-2222-2222-2222-222222222222';
update profiles set display_name='Mama',   phone_e164='+5491177778888' where id='33333333-3333-3333-3333-333333333333';

insert into households (id, name, join_code) values
  ('aaaaaaaa-0000-0000-0000-000000000001','Depto Palermo','AAAAAA'),
  ('bbbbbbbb-0000-0000-0000-000000000002','Casa de los viejos','BBBBBB');

insert into household_members (household_id, profile_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','owner'),
  ('aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','member'),
  ('bbbbbbbb-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333','owner');
