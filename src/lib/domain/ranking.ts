// Casa — Ranking and scoring logic
// Pure TypeScript, zero framework imports. Unit-tested.

import type { MemberStanding } from '@/types'

interface CompletedTask {
  assignee_id: string | null
  completed_by: string | null
  points: number
  status: 'open' | 'done'
}

interface MemberInfo {
  profile_id: string
  display_name: string
  emoji: string
}

/**
 * Compute standings from a list of completed tasks and household members.
 * Returns members sorted by rank (1 = best).
 *
 * Tie-breaking:
 *   1. Most points
 *   2. Most tasks completed
 *   3. Declared empate (same rank)
 */
export function computeStandings(
  tasks: CompletedTask[],
  members: MemberInfo[]
): MemberStanding[] {
  // Accumulate points and task count per member
  const stats = new Map<string, { points: number; tasks_done: number }>()

  for (const m of members) {
    stats.set(m.profile_id, { points: 0, tasks_done: 0 })
  }

  for (const t of tasks) {
    if (t.status !== 'done' || !t.completed_by) continue
    const s = stats.get(t.completed_by)
    if (s) {
      s.points += t.points
      s.tasks_done += 1
    }
  }

  // Build standings and sort
  const standings: MemberStanding[] = members.map((m) => {
    const s = stats.get(m.profile_id) ?? { points: 0, tasks_done: 0 }
    return {
      profile_id: m.profile_id,
      display_name: m.display_name,
      emoji: m.emoji,
      points: s.points,
      tasks_done: s.tasks_done,
      rank: 0, // filled below
    }
  })

  // Sort: most points first, then most tasks, then stable order
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.tasks_done !== a.tasks_done) return b.tasks_done - a.tasks_done
    return 0 // true tie
  })

  // Assign ranks (ties get the same rank)
  let currentRank = 1
  for (let i = 0; i < standings.length; i++) {
    if (
      i > 0 &&
      standings[i].points === standings[i - 1].points &&
      standings[i].tasks_done === standings[i - 1].tasks_done
    ) {
      standings[i].rank = standings[i - 1].rank
    } else {
      standings[i].rank = currentRank
    }
    currentRank = i + 2
  }

  return standings
}

/**
 * Determine the winner and last-place member.
 * Returns null for winner if it's a tie at the top.
 * Returns null for lastPlace if it's a tie at the bottom.
 */
export function determineResults(standings: MemberStanding[]): {
  winner: MemberStanding | null
  lastPlace: MemberStanding | null
  isTie: boolean
} {
  if (standings.length === 0) {
    return { winner: null, lastPlace: null, isTie: true }
  }

  // Check for tie at the top
  const topRank = standings[0].rank
  const topCount = standings.filter((s) => s.rank === topRank).length
  const isTie = topCount > 1

  // Check for tie at the bottom
  const bottomRank = standings[standings.length - 1].rank
  const bottomCount = standings.filter((s) => s.rank === bottomRank).length

  return {
    winner: isTie ? null : standings[0],
    lastPlace:
      bottomCount > 1 || standings.length < 2
        ? null
        : standings[standings.length - 1],
    isTie,
  }
}
