-- QA harness: minimal Supabase stubs so 001_initial_schema.sql can run verbatim
create schema if not exists auth;
create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('qa.uid', true), '')::uuid
$$;
create publication supabase_realtime;
create role authenticated;
grant usage on schema public, auth to authenticated;
