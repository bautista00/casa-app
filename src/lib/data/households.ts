// Casa — Household queries
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Household, HouseholdMember } from '@/types'

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createHousehold(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  weekEndDay: number = 0,
  timezone: string = 'America/Argentina/Buenos_Aires'
): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .insert({
      name,
      join_code: generateJoinCode(),
      week_end_day: weekEndDay,
      timezone,
    })
    .select()
    .single()
  if (error) throw error

  // Add creator as owner
  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: data.id,
      profile_id: userId,
      role: 'owner',
    })
  if (memberError) throw memberError

  return data
}

export async function joinHousehold(
  supabase: SupabaseClient,
  userId: string,
  joinCode: string
): Promise<Household> {
  // Use RPC since user can't read households they're not in yet
  const { data, error } = await supabase.rpc('join_household', {
    code: joinCode.toUpperCase(),
    user_id: userId,
  })
  if (error) throw error
  return data
}

export async function getUserHouseholds(
  supabase: SupabaseClient,
  userId: string
): Promise<Household[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('household:households(*)')
    .eq('profile_id', userId)
  if (error) throw error
  return (data ?? []).map((d) => (d as unknown as { household: Household }).household)
}

export async function getHousehold(
  supabase: SupabaseClient,
  householdId: string
): Promise<Household | null> {
  const { data } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()
  return data
}

export async function getHouseholdMembers(
  supabase: SupabaseClient,
  householdId: string
): Promise<HouseholdMember[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('*, profile:profiles(*)')
    .eq('household_id', householdId)
  if (error) throw error
  return data ?? []
}

export async function updateHousehold(
  supabase: SupabaseClient,
  householdId: string,
  updates: Partial<
    Pick<
      Household,
      | 'name'
      | 'week_end_day'
      | 'timezone'
      | 'reward_text'
      | 'dreaded_template_id'
    >
  >
): Promise<void> {
  const { error } = await supabase
    .from('households')
    .update(updates)
    .eq('id', householdId)
  if (error) throw error
}
