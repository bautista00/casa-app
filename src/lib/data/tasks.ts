// Casa — Task queries
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Task, Effort, EFFORT_POINTS } from '@/types'
import { EFFORT_POINTS as Points } from '@/types'

export async function createTask(
  supabase: SupabaseClient,
  task: {
    household_id: string
    title: string
    notes?: string | null
    effort: Effort
    assignee_id?: string | null
    due_date?: string | null
    created_by: string
    template_id?: string | null
  }
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...task,
      points: Points[task.effort],
      status: 'open',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeTask(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'done',
      completed_by: userId,
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('status', 'open') // guard: can't complete twice
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reopenTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'open',
      completed_by: null,
      completed_at: null,
    })
    .eq('id', taskId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getHouseholdTasks(
  supabase: SupabaseClient,
  householdId: string,
  opts?: { from?: string; to?: string; status?: 'open' | 'done' }
): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assignee_id_fkey(*)')
    .eq('household_id', householdId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (opts?.status) {
    query = query.eq('status', opts.status)
  }
  if (opts?.from) {
    query = query.gte('due_date', opts.from)
  }
  if (opts?.to) {
    query = query.lte('due_date', opts.to)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getWeekTasks(
  supabase: SupabaseClient,
  householdId: string,
  weekStart: string,
  weekEnd: string
): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assignee_id_fkey(*)')
    .eq('household_id', householdId)
    .gte('due_date', weekStart)
    .lt('due_date', weekEnd)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function deleteTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}
