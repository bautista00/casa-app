// Casa — Task template queries
import type { SupabaseClient } from '@supabase/supabase-js'
import type { TaskTemplate, Effort, Recurrence, AssignmentMode } from '@/types'

export async function createTemplate(
  supabase: SupabaseClient,
  template: {
    household_id: string
    title: string
    notes?: string | null
    effort: Effort
    recurrence: Recurrence
    days_of_week?: number[]
    day_of_month?: number | null
    assignment: AssignmentMode
    default_assignee_id?: string | null
  }
): Promise<TaskTemplate> {
  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      ...template,
      active: true,
      days_of_week: template.days_of_week ?? [],
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getActiveTemplates(
  supabase: SupabaseClient,
  householdId: string
): Promise<TaskTemplate[]> {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('household_id', householdId)
    .eq('active', true)
    .order('title')

  if (error) throw error
  return data ?? []
}

export async function updateTemplate(
  supabase: SupabaseClient,
  templateId: string,
  updates: Partial<TaskTemplate>
): Promise<void> {
  const { error } = await supabase
    .from('task_templates')
    .update(updates)
    .eq('id', templateId)
  if (error) throw error
}

export async function deactivateTemplate(
  supabase: SupabaseClient,
  templateId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_templates')
    .update({ active: false })
    .eq('id', templateId)
  if (error) throw error
}
