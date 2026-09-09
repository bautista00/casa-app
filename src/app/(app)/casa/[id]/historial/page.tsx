import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getHousehold, getHouseholdMembers } from '@/lib/data/households'
import { getWeekHistory, getWeekScores, getWinCount, getWinStreak } from '@/lib/data/weeks'
import { es } from '@/lib/i18n/es'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, Crown } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default async function HistorialPage({
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
  const weeks = await getWeekHistory(supabase, id)

  // Hall of Fame: win counts and streaks
  const hallOfFame = await Promise.all(
    members
      .filter((m) => m.profile)
      .map(async (m) => ({
        profile: m.profile!,
        wins: await getWinCount(supabase, id, m.profile_id),
        streak: await getWinStreak(supabase, id, m.profile_id),
      }))
  )
  hallOfFame.sort((a, b) => b.wins - a.wins)

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
        {es.history.title}
      </h1>

      {/* Hall of Fame */}
      {hallOfFame.some((h) => h.wins > 0) && (
        <Card className="border-2 border-crown/30 shadow-lg">
          <div className="bg-gradient-to-r from-crown/10 to-crown/5 px-4 py-3">
            <h2 className="font-bold text-lg font-[family-name:var(--font-heading)] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-crown" />
              {es.history.hallOfFame}
            </h2>
          </div>
          <CardContent className="pt-3 space-y-2">
            {hallOfFame
              .filter((h) => h.wins > 0)
              .map((h, i) => (
                <div
                  key={h.profile.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0
                        ? 'bg-crown text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="text-lg">{h.profile.emoji}</span>
                  <span className="font-semibold flex-1">
                    {h.profile.display_name}
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-crown">
                      <Trophy className="w-4 h-4" />
                      {h.wins}
                    </span>
                    {h.streak > 1 && (
                      <span className="flex items-center gap-1 text-accent">
                        <Flame className="w-4 h-4" />
                        {h.streak}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Week history */}
      <div className="space-y-3">
        {weeks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {es.history.noHistory}
          </p>
        ) : (
          weeks.map((week) => (
            <WeekCard key={week.id} week={week} members={members} />
          ))
        )}
      </div>
    </div>
  )
}

function WeekCard({
  week,
  members,
}: {
  week: Awaited<ReturnType<typeof getWeekHistory>>[number]
  members: Awaited<ReturnType<typeof getHouseholdMembers>>
}) {
  const winnerMember = members.find((m) => m.profile_id === week.winner_profile_id)
  const startStr = format(parseISO(week.week_start), 'd MMM')
  const endStr = format(parseISO(week.week_end), 'd MMM')

  return (
    <Card className="border">
      <CardContent className="py-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            {startStr} – {endStr}
          </p>
          {winnerMember?.profile ? (
            <p className="font-semibold flex items-center gap-1.5 mt-1">
              <span>👑</span>
              <span>{winnerMember.profile.emoji}</span>
              <span>{winnerMember.profile.display_name}</span>
            </p>
          ) : (
            <p className="font-semibold text-muted-foreground mt-1">
              🤝 {es.history.tie}
            </p>
          )}
          {week.reward_text_snapshot && (
            <p className="text-sm text-muted-foreground mt-1">
              🎁 {week.reward_text_snapshot}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
