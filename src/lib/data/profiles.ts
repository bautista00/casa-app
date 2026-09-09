// Casa — Profile queries
// Every function takes a SupabaseClient as first arg — portable to Expo.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function upsertProfile(
  supabase: SupabaseClient,
  profile: { id: string; display_name: string; emoji: string }
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePhone(
  supabase: SupabaseClient,
  userId: string,
  phone: string | null
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ phone_e164: phone })
    .eq('id', userId)
  if (error) throw error
}
