import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getWeekWindow, getClosableWeek } from '@/lib/domain/week'
import { computeStandings, determineResults } from '@/lib/domain/ranking'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { cronAuthorized } from '@/app/api/cron/auth'

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Allow override for testing
  const nowParam = request.nextUrl.searchParams.get('now')
  const now = nowParam ? new Date(nowParam) : new Date()

  const supabase = createServiceClient()
  const results: string[] = []

  // Get all households
  const { data: households } = await supabase
    .from('households')
    .select('*')

  if (!households) {
    return NextResponse.json({ message: 'No households', results })
  }

  for (const household of households) {
    const zonedNow = toZonedTime(now, household.timezone)
    const closable = getClosableWeek(now, household.week_end_day, household.timezone)
    const weekEndStr = format(closable.end, 'yyyy-MM-dd')
    const weekStartStr = format(closable.start, 'yyyy-MM-dd')

    // Check if this week is already closed
    const { data: existing } = await supabase
      .from('weeks')
      .select('id')
      .eq('household_id', household.id)
      .eq('week_end', weekEndStr)
      .single()

    if (existing) {
      results.push(`${household.name}: week ${weekEndStr} already closed`)
      continue
    }

    // Check if the week-end boundary has actually passed
    const currentWeek = getWeekWindow(now, household.week_end_day, household.timezone)
    if (format(currentWeek.start, 'yyyy-MM-dd') === weekStartStr) {
      // The closable week IS the current week — boundary hasn't passed yet
      results.push(`${household.name}: week not ended yet`)
      continue
    }

    // Get members
    const { data: members } = await supabase
      .from('household_members')
      .select('profile_id, profiles(display_name, emoji)')
      .eq('household_id', household.id)

    if (!members || members.length === 0) continue

    // Get tasks for the closing week
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('household_id', household.id)
      .gte('due_date', weekStartStr)
      .lt('due_date', weekEndStr)

    const memberInfos = members.map((m: Record<string, unknown>) => ({
      profile_id: m.profile_id as string,
      display_name: (m.profiles as Record<string, string>)?.display_name ?? '',
      emoji: (m.profiles as Record<string, string>)?.emoji ?? '🏠',
    }))

    const standings = computeStandings(tasks ?? [], memberInfos)
    const { winner, lastPlace, isTie } = determineResults(standings)

    // Create week record
    const { data: week, error: weekError } = await supabase
      .from('weeks')
      .insert({
        household_id: household.id,
        week_start: weekStartStr,
        week_end: weekEndStr,
        closed_at: now.toISOString(),
        winner_profile_id: winner?.profile_id ?? null,
        last_place_profile_id: lastPlace?.profile_id ?? null,
        reward_text_snapshot: household.reward_text,
      })
      .select()
      .single()

    if (weekError) {
      // UNIQUE constraint — already closed (idempotent)
      results.push(`${household.name}: duplicate week ${weekEndStr}`)
      continue
    }

    // Insert week scores
    const scores = standings.map((s) => ({
      week_id: week.id,
      profile_id: s.profile_id,
      points: s.points,
      tasks_done: s.tasks_done,
    }))

    if (scores.length > 0) {
      await supabase.from('week_scores').insert(scores)
    }

    // Dreaded task rotation: if there's a dreaded template and a last-place member
    if (household.dreaded_template_id && lastPlace) {
      // Reassign next week's instances of the dreaded template to last place
      const nextWeek = getWeekWindow(now, household.week_end_day, household.timezone)
      const nextWeekStart = format(nextWeek.start, 'yyyy-MM-dd')
      const nextWeekEnd = format(nextWeek.end, 'yyyy-MM-dd')

      await supabase
        .from('tasks')
        .update({ assignee_id: lastPlace.profile_id })
        .eq('template_id', household.dreaded_template_id)
        .gte('due_date', nextWeekStart)
        .lt('due_date', nextWeekEnd)
        .eq('status', 'open')
    }

    const winnerName = winner ? `${winner.emoji} ${winner.display_name}` : 'empate'
    results.push(`${household.name}: closed ${weekEndStr}, winner: ${winnerName}`)
  }

  return NextResponse.json({ message: 'Week close complete', results })
}
