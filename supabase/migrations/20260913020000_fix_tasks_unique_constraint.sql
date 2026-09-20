-- CASA-002: `unique nulls not distinct (template_id, due_date)` makes two NULL
-- template_ids compare equal, so the constraint collapses to "one dateless-
-- template task per due_date in the whole tasks table" — it blocks a second
-- one-off task on the same day, even across different households, since the
-- constraint has no household_id in it. The actual intent (stated in the
-- 001 migration's own comment) is "one generated instance per (template,
-- date)", which only makes sense when template_id IS NOT NULL. Replace the
-- table constraint with a partial unique index scoped to generated rows.

alter table tasks drop constraint tasks_template_id_due_date_key;

-- One instance per (template, date); ad-hoc tasks (template_id IS NULL)
-- are intentionally unconstrained by this index.
create unique index tasks_template_due_unique
  on tasks (template_id, due_date)
  where template_id is not null;
