import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/data/profiles'
import { getUserHouseholds } from '@/lib/data/households'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(supabase, user.id)
  const households = await getUserHouseholds(supabase, user.id)

  // No profile yet — they need to set up their name
  if (!profile || profile.display_name === 'Nuevo') {
    return <>{children}</>
  }

  return (
    <AppShell profile={profile} households={households}>
      {children}
    </AppShell>
  )
}
