'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { upsertProfile } from '@/lib/data/profiles'
import { createHousehold, joinHousehold, getUserHouseholds } from '@/lib/data/households'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { es } from '@/lib/i18n/es'
import { Home, UserPlus, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const EMOJIS = ['😊', '😎', '🤓', '🥳', '💪', '🌟', '🦊', '🐱', '🐶', '🦁', '🐸', '🌈']

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<'profile' | 'choose' | 'create' | 'join'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')

  // Profile
  const [displayName, setDisplayName] = useState('')
  const [emoji, setEmoji] = useState('😊')

  // Create house
  const [houseName, setHouseName] = useState('')
  const [weekEndDay, setWeekEndDay] = useState(0) // Sunday

  // Join house
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUserId(user.id)

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile && profile.display_name !== 'Nuevo') {
        // Has profile, check households
        const households = await getUserHouseholds(supabase, user.id)
        if (households.length > 0) {
          router.push(`/casa/${households[0].id}`)
          return
        }
        setStep('choose')
      } else {
        setStep('profile')
      }
      setLoading(false)
    }
    check()
  }, [])

  async function handleProfileSave() {
    if (!displayName.trim()) return
    setSaving(true)
    try {
      await upsertProfile(supabase, {
        id: userId,
        display_name: displayName.trim(),
        emoji,
      })
      setStep('choose')
    } catch {
      toast.error(es.errors.generic)
    }
    setSaving(false)
  }

  async function handleCreateHouse() {
    if (!houseName.trim()) return
    setSaving(true)
    try {
      const household = await createHousehold(
        supabase,
        userId,
        houseName.trim(),
        weekEndDay
      )
      router.push(`/casa/${household.id}`)
    } catch {
      toast.error(es.errors.generic)
    }
    setSaving(false)
  }

  async function handleJoinHouse() {
    if (!joinCode.trim()) return
    setSaving(true)
    try {
      const household = await joinHousehold(supabase, userId, joinCode.trim())
      router.push(`/casa/${household.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Already')) {
        toast.error(es.errors.alreadyMember)
      } else {
        toast.error(es.errors.invalidCode)
      }
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary/5 to-background">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] text-foreground">
          {es.onboarding.title}
        </h1>
      </div>

      {/* Step: Profile setup */}
      {step === 'profile' && (
        <Card className="w-full max-w-sm shadow-lg border-2">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold text-center">
              {es.auth.createProfile}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{es.auth.enterName}</Label>
              <Input
                id="name"
                placeholder="Bauti"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 text-base"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>{es.auth.enterEmoji}</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                      emoji === e
                        ? 'bg-primary/20 ring-2 ring-primary scale-110'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleProfileSave}
              className="w-full h-12 text-base font-semibold cursor-pointer"
              disabled={saving || !displayName.trim()}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Choose create or join */}
      {step === 'choose' && (
        <div className="w-full max-w-sm space-y-4">
          <Card
            className="shadow-lg border-2 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setStep('create')}
          >
            <CardContent className="flex items-center gap-4 py-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{es.onboarding.createHouse}</h3>
                <p className="text-sm text-muted-foreground">
                  Creá una casa nueva y compartí el código
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="shadow-lg border-2 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setStep('join')}
          >
            <CardContent className="flex items-center gap-4 py-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
                <UserPlus className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{es.onboarding.joinHouse}</h3>
                <p className="text-sm text-muted-foreground">
                  Uníte con el código de otra casa
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Create house */}
      {step === 'create' && (
        <Card className="w-full max-w-sm shadow-lg border-2">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold text-center">
              {es.onboarding.createHouse}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="houseName">{es.onboarding.houseName}</Label>
              <Input
                id="houseName"
                placeholder={es.onboarding.houseNamePlaceholder}
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                className="h-12 text-base"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>{es.onboarding.weekEndDay}</Label>
              <div className="grid grid-cols-7 gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setWeekEndDay(d)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      weekEndDay === d
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {es.daysShort[d as keyof typeof es.daysShort]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('choose')}
                className="flex-1 h-12 cursor-pointer"
              >
                Volver
              </Button>
              <Button
                onClick={handleCreateHouse}
                className="flex-1 h-12 text-base font-semibold cursor-pointer"
                disabled={saving || !houseName.trim()}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : es.onboarding.create}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Join house */}
      {step === 'join' && (
        <Card className="w-full max-w-sm shadow-lg border-2">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold text-center">
              {es.onboarding.joinHouse}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{es.onboarding.joinCode}</Label>
              <Input
                id="code"
                placeholder={es.onboarding.joinCodePlaceholder}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="h-12 text-base text-center tracking-[0.3em] font-mono uppercase"
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('choose')}
                className="flex-1 h-12 cursor-pointer"
              >
                Volver
              </Button>
              <Button
                onClick={handleJoinHouse}
                className="flex-1 h-12 text-base font-semibold cursor-pointer"
                disabled={saving || joinCode.length < 6}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : es.onboarding.join}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
