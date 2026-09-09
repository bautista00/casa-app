import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { nextOccurrences, pickRotatedAssignee } from '@/lib/domain/recurrence'
import { EFFORT_POINTS } from '@/types'
import type { Effort } from '@/types'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const nowParam = request.nextUrl.searchParams.get('now')
  const now = nowParam ? new Date(nowParam) : new Date()

  const supabase = createServiceClient()
  const results: string[] = []

  // Get all active templates
  const { data: templates } = await supabase
    .from('task_templates')
    .select('*, households(timezone)')
    .eq('active', true)

  if (!templates) {
    return NextResponse.json({ message: 'No templates', results })
  }

  for (const template of templates) {
    const dates = nextOccurrences(
      {
        recurrence: template.recurrence,
        days_of_week: template.days_of_week ?? [],
        day_of_month: template.day_of_month,
      },
      now,
      14
    )

    // Determine assignee
    let assigneeId = template.default_assignee_id

    if (template.assignment === 'rotate') {
      // Get household members for rotation
      const { data: members } = await supabase
        .from('household_members')
        .select('profile_id')
        .eq('household_id', template.household_id)
        .order('joined_at')

      if (members && members.length > 0) {
        const memberIds = members.map((m: { profile_id: string }) => m.profile_id)

        // Find the last assigned instance to determine rotation
        const { data: lastTask } = await supabase
          .from('tasks')
          .select('assignee_id')
          .eq('template_id', template.id)
          .not('assignee_id', 'is', null)
          .order('due_date', { ascending: false })
          .limit(1)
          .single()

        assigneeId = pickRotatedAssignee(
          memberIds,
          lastTask?.assignee_id ?? null
        )
      }
    }

    // System user ID for created_by (use the template creator or first member)
    const { data: firstMember } = await supabase
      .from('household_members')
      .select('profile_id')
      .eq('household_id', template.household_id)
      .limit(1)
      .single()

    const createdBy = firstMember?.profile_id

    if (!createdBy) continue

    for (const dateStr of dates) {
      // Insert with ON CONFLICT DO NOTHING (the UNIQUE constraint handles idempotency)
      const { error } = await supabase.from('tasks').upsert(
        {
          household_id: template.household_id,
          template_id: template.id,
          title: template.title,
          notes: template.notes,
          effort: template.effort,
          points: EFFORT_POINTS[template.effort as Effort],
          assignee_id: assigneeId,
          due_date: dateStr,
          status: 'open',
          created_by: createdBy,
        },
        { onConflict: 'template_id,due_date', ignoreDuplicates: true }
      )

      if (!error) {
        results.push(`${template.title} → ${dateStr}`)
      }
    }
  }

  return NextResponse.json({ message: 'Generate complete', created: results.length, results })
}
