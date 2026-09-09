import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getHousehold, getHouseholdMembers } from '@/lib/data/households'
import { getHouseholdTasks } from '@/lib/data/tasks'
import { getCurrentWeekWinner, getWinCount, getWinStreak } from '@/lib/data/weeks'
import { getWeekWindow, daysRemaining } from '@/lib/domain/week'
import { computeStandings } from '@/lib/domain/ranking'
import { format } from 'date-fns'
import { BoardView } from '@/components/board-view'
import { Leaderboard } from '@/components/leaderboard'

export default async function CasaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const household = await getHousehold(supabase, id)
  if (!household) redirect('/onboarding')

  const members = await getHouseholdMembers(supabase, id)
  const now = new Date()
  const weekWindow = getWeekWindow(now, household.week_end_day, household.timezone)
  const days = daysRemaining(now, household.week_end_day, household.timezone)

  // Get all tasks for the current week
  const weekStart = format(weekWindow.start, 'yyyy-MM-dd')
  const weekEnd = format(weekWindow.end, 'yyyy-MM-dd')
  const allTasks = await getHouseholdTasks(supabase, id)

  // Current week tasks for standings
  const weekTasks = allTasks.filter((t) => {
    if (!t.due_date) return false
    return t.due_date >= weekStart && t.due_date < weekEnd
  })

  // Compute standings
  const memberInfos = members
    .filter((m) => m.profile)
    .map((m) => ({
      profile_id: m.profile_id,
      display_name: m.profile!.display_name,
      emoji: m.profile!.emoji,
    }))

  const standings = computeStandings(weekTasks, memberInfos)

  // Get last week's winner (for crown display)
  const lastWinnerId = await getCurrentWeekWinner(supabase, id)

  // Get win stats for all members
  const winStats = await Promise.all(
    memberInfos.map(async (m) => ({
      profile_id: m.profile_id,
      wins: await getWinCount(supabase, id, m.profile_id),
      streak: await getWinStreak(supabase, id, m.profile_id),
    }))
  )

  // Separate tasks by category for the board
  const today = format(now, 'yyyy-MM-dd')

  return (
    <div className="space-y-6 pb-20">
      {/* Leaderboard */}
      <Leaderboard
        standings={standings}
        daysLeft={days}
        rewardText={household.reward_text}
        lastWinnerId={lastWinnerId}
        winStats={winStats}
      />

      {/* Task Board */}
      <BoardView
        tasks={allTasks}
        members={members}
        householdId={id}
        userId={user.id}
        today={today}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    </div>
  )
}
