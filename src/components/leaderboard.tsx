'use client'

import type { MemberStanding } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { es } from '@/lib/i18n/es'
import { Trophy, Flame, Clock } from 'lucide-react'

interface LeaderboardProps {
  standings: MemberStanding[]
  daysLeft: number
  rewardText: string | null
  lastWinnerId: string | null
  winStats: { profile_id: string; wins: number; streak: number }[]
}

export function Leaderboard({
  standings,
  daysLeft,
  rewardText,
  lastWinnerId,
  winStats,
}: LeaderboardProps) {
  return (
    <Card className="border-2 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 px-4 py-3 flex items-center justify-between">
        <h2 className="font-bold text-lg font-[family-name:var(--font-heading)]">
          {es.leaderboard.title}
        </h2>
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          {daysLeft} {daysLeft === 1 ? es.leaderboard.dayLeft : es.leaderboard.daysLeft}
        </Badge>
      </div>

      <CardContent className="pt-3 space-y-2">
        {/* Rankings */}
        {standings.map((member, i) => {
          const stats = winStats.find((w) => w.profile_id === member.profile_id)
          const isCrowned = lastWinnerId === member.profile_id

          return (
            <div
              key={member.profile_id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                i === 0
                  ? 'bg-crown/10 border-2 border-crown/30'
                  : i === 1
                    ? 'bg-muted/60 border border-border'
                    : 'bg-muted/30'
              }`}
            >
              {/* Rank */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  i === 0
                    ? 'bg-crown text-white'
                    : i === 1
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {member.rank}
              </div>

              {/* Avatar + name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{member.emoji}</span>
                  <span className="font-semibold truncate">
                    {member.display_name}
                  </span>
                  {isCrowned && (
                    <span className="text-lg" title="Ganador de la semana pasada">
                      👑
                    </span>
                  )}
                </div>
                {stats && (stats.wins > 0 || stats.streak > 0) && (
                  <div className="flex items-center gap-2 mt-0.5">
                    {stats.wins > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Trophy className="w-3 h-3" />
                        {stats.wins} {es.leaderboard.trophies}
                      </span>
                    )}
                    {stats.streak > 1 && (
                      <span className="text-xs text-accent flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        {stats.streak} {es.leaderboard.streak}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="font-bold text-lg tabular-nums">
                  {member.points}
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.tasks_done} {es.leaderboard.tasks}
                </div>
              </div>
            </div>
          )
        })}

        {standings.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            {es.board.noTasks}
          </p>
        )}

        {/* Weekly prize */}
        {rewardText && (
          <div className="mt-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
            <p className="text-sm font-medium text-accent-foreground">
              🎁 {es.leaderboard.weekPrize}
            </p>
            <p className="text-sm mt-1">{rewardText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
