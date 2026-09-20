-- Cover foreign key columns flagged by the performance advisor as
-- unindexed (join/lookup performance as these tables grow).
create index if not exists idx_household_members_profile_id on household_members(profile_id);
create index if not exists idx_households_dreaded_template_id on households(dreaded_template_id);
create index if not exists idx_notification_prefs_household_id on notification_prefs(household_id);
create index if not exists idx_push_subscriptions_profile_id on push_subscriptions(profile_id);
create index if not exists idx_task_templates_default_assignee_id on task_templates(default_assignee_id);
create index if not exists idx_task_templates_household_id on task_templates(household_id);
create index if not exists idx_tasks_assignee_id on tasks(assignee_id);
create index if not exists idx_tasks_completed_by on tasks(completed_by);
create index if not exists idx_tasks_created_by on tasks(created_by);
create index if not exists idx_week_scores_profile_id on week_scores(profile_id);
create index if not exists idx_weeks_last_place_profile_id on weeks(last_place_profile_id);
create index if not exists idx_weeks_winner_profile_id on weeks(winner_profile_id);
