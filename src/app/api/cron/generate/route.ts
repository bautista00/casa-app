import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { nextOccurrences, pickRotatedAssignee } from '@/lib/domain/recurrence'
import { EFFORT_POINTS } from '@/types'
import type { Effort } from '@/types'
import { cronAuthorized } from '@/app/api/cron/auth'

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) {
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

    // Default (non-rotating) assignee. For 'rotate' templates this is
    // recomputed PER OCCURRENCE below (CASA-007) rather than once here — a
    // single value reused across the whole batch is what made a fresh
    // rotating daily task hand its first ~15 days to the same person.
    const fixedAssigneeId = template.default_assignee_id
    let memberIds: string[] = []
    let lastAssignee: string | null = null

    if (template.assignment === 'rotate') {
      // Get household members for rotation
      const { data: members } = await supabase
        .from('household_members')
        .select('profile_id')
        .eq('household_id', template.household_id)
        .order('joined_at')

      if (members && members.length > 0) {
        memberIds = members.map((m: { profile_id: string }) => m.profile_id)

        // Find the last assigned instance to determine where the rotation
        // currently stands.
        const { data: lastTask } = await supabase
          .from('tasks')
          .select('assignee_id')
          .eq('template_id', template.id)
          .not('assignee_id', 'is', null)
          .order('due_date', { ascending: false })
          .limit(1)
          .single()

        lastAssignee = lastTask?.assignee_id ?? null
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

    // Which of these candidate dates already have a row? A repeated cron run
    // (or a run whose horizon overlaps the previous one) must not touch
    // those — not the assignee, not anything else — and must not "spend" a
    // rotation step on a date that turns out to already exist (CASA-002 x
    // CASA-007: idempotency and per-occurrence rotation have to agree).
    const existingDates =
      dates.length > 0
        ? new Set(
            (
              (
                await supabase
                  .from('tasks')
                  .select('due_date')
                  .eq('template_id', template.id)
                  .in('due_date', dates)
              ).data ?? []
            ).map((r: { due_date: string }) => r.due_date)
          )
        : new Set<string>()

    for (const dateStr of dates) {
      if (existingDates.has(dateStr)) continue // already generated — idempotent skip

      let assigneeId = fixedAssigneeId
      if (template.assignment === 'rotate' && memberIds.length > 0) {
        assigneeId = pickRotatedAssignee(memberIds, lastAssignee)
        lastAssignee = assigneeId
      }

      // Plain insert, not upsert: the uniqueness guarantee now lives in a
      // PARTIAL unique index (template_id, due_date) WHERE template_id IS NOT
      // NULL (CASA-002 — the old table-wide constraint blocked a second
      // one-off task on any given day, even across households). PostgREST's
      // upsert `onConflict` only emits a column list, and Postgres requires
      // a partial index's predicate to be named explicitly in the ON
      // CONFLICT target to use it as the arbiter — something the query
      // builder has no option for. A plain insert sidesteps that: a
      // concurrent duplicate simply fails the unique index with 23505, which
      // is treated the same as "already exists, skip".
      const { error } = await supabase.from('tasks').insert({
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
      })

      if (!error) {
        results.push(`${template.title} → ${dateStr}`)
      } else if (error.code !== '23505') {
        // Not a benign duplicate — surface it, but keep processing the rest
        // of the batch instead of aborting the whole cron run.
        results.push(`${template.title} → ${dateStr}: ${error.message}`)
      }
    }
  }

  return NextResponse.json({ message: 'Generate complete', created: results.length, results })
}
