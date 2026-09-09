// Casa — Week history queries
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Week, WeekScore } from '@/types'

export async function getWeekHistory(
  supabase: SupabaseClient,
  householdId: string,
  limit: number = 20
): Promise<Week[]> {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('household_id', householdId)
    .not('closed_at', 'is', null)
    .order('week_end', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getWeekScores(
  supabase: SupabaseClient,
  weekId: string
): Promise<WeekScore[]> {
  const { data, error } = await supabase
    .from('week_scores')
    .select('*, profile:profiles(*)')
    .eq('week_id', weekId)
    .order('points', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getWinCount(
  supabase: SupabaseClient,
  householdId: string,
  profileId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('weeks')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('winner_profile_id', profileId)

  if (error) throw error
  return count ?? 0
}

export async function getWinStreak(
  supabase: SupabaseClient,
  householdId: string,
  profileId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('weeks')
    .select('winner_profile_id')
    .eq('household_id', householdId)
    .not('closed_at', 'is', null)
    .order('week_end', { ascending: false })
    .limit(50)

  if (error) throw error
  if (!data) return 0

  let streak = 0
  for (const week of data) {
    if (week.winner_profile_id === profileId) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export async function getCurrentWeekWinner(
  supabase: SupabaseClient,
  householdId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('weeks')
    .select('winner_profile_id')
    .eq('household_id', householdId)
    .not('closed_at', 'is', null)
    .order('week_end', { ascending: false })
    .limit(1)
    .single()

  return data?.winner_profile_id ?? null
}
