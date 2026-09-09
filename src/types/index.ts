// Casa — shared types
// Pure TypeScript, no framework imports

export type Effort = 'rapida' | 'normal' | 'pesada'

export const EFFORT_POINTS: Record<Effort, number> = {
  rapida: 1,
  normal: 3,
  pesada: 5,
}

export type TaskStatus = 'open' | 'done'
export type Recurrence = 'daily' | 'weekly' | 'monthly'
export type AssignmentMode = 'fixed' | 'rotate'
export type HouseholdRole = 'owner' | 'member'

export interface Profile {
  id: string
  display_name: string
  emoji: string
  phone_e164: string | null
  created_at: string
}

export interface Household {
  id: string
  name: string
  join_code: string
  week_end_day: number // 0=Sun, 1=Mon, ..., 6=Sat
  timezone: string
  reward_text: string | null
  dreaded_template_id: string | null
  created_at: string
}

export interface HouseholdMember {
  household_id: string
  profile_id: string
  role: HouseholdRole
  joined_at: string
  profile?: Profile
}

export interface TaskTemplate {
  id: string
  household_id: string
  title: string
  notes: string | null
  effort: Effort
  active: boolean
  recurrence: Recurrence
  days_of_week: number[] // 0=Sun..6=Sat
  day_of_month: number | null
  assignment: AssignmentMode
  default_assignee_id: string | null
  created_at: string
}

export interface Task {
  id: string
  household_id: string
  template_id: string | null
  title: string
  notes: string | null
  effort: Effort
  points: number
  assignee_id: string | null
  due_date: string | null // ISO date
  status: TaskStatus
  completed_by: string | null
  completed_at: string | null
  created_by: string
  created_at: string
  // Joined fields
  assignee?: Profile
  completed_by_profile?: Profile
}

export interface Week {
  id: string
  household_id: string
  week_start: string
  week_end: string
  closed_at: string | null
  winner_profile_id: string | null
  last_place_profile_id: string | null
  reward_text_snapshot: string | null
}

export interface WeekScore {
  week_id: string
  profile_id: string
  points: number
  tasks_done: number
  profile?: Profile
}

export interface MemberStanding {
  profile_id: string
  display_name: string
  emoji: string
  points: number
  tasks_done: number
  rank: number
}
