'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getHousehold, getHouseholdMembers, updateHousehold } from '@/lib/data/households'
import { updatePhone } from '@/lib/data/profiles'
import { getActiveTemplates } from '@/lib/data/templates'
import type { Household, HouseholdMember, TaskTemplate } from '@/types'
import { es } from '@/lib/i18n/es'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  Skull,
  Users,
  Bell,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AjustesPage() {
  const params = useParams()
  const router = useRouter()
  const householdId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [codeCopied, setCodeCopied] = useState(false)

  // Editable fields
  const [name, setName] = useState('')
  const [weekEndDay, setWeekEndDay] = useState(0)
  const [rewardText, setRewardText] = useState('')
  const [dreadedTemplateId, setDreadedTemplateId] = useState<string | null>(null)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const [h, m, t] = await Promise.all([
        getHousehold(supabase, householdId),
        getHouseholdMembers(supabase, householdId),
        getActiveTemplates(supabase, householdId),
      ])

      if (!h) { router.push('/onboarding'); return }
      setHousehold(h)
      setMembers(m)
      setTemplates(t)
      setName(h.name)
      setWeekEndDay(h.week_end_day)
      setRewardText(h.reward_text ?? '')
      setDreadedTemplateId(h.dreaded_template_id)

      // Get user's phone
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_e164')
        .eq('id', user.id)
        .single()
      setPhone(profile?.phone_e164 ?? '')

      setLoading(false)
    }
    init()
  }, [])

  // Only the owner can update `households` — RLS blocks everyone else, and a
  // blocked UPDATE matches zero rows without raising an error, so a member used
  // to get "¡Guardado!" for a change that was thrown away (CASA-010).
  const isOwner = members.some(
    (m) => m.profile_id === userId && m.role === 'owner'
  )

  async function handleSave() {
    setSaving(true)
    try {
      if (isOwner) {
        await updateHousehold(supabase, householdId, {
          name: name.trim(),
          week_end_day: weekEndDay,
          reward_text: rewardText.trim() || null,
          dreaded_template_id: dreadedTemplateId,
        })
      }
      if (phone.trim()) {
        await updatePhone(supabase, userId, phone.trim())
      }
      toast.success(es.settings.saved)
    } catch {
      toast.error(es.errors.generic)
    }
    setSaving(false)
  }

  async function copyCode() {
    if (!household) return
    await navigator.clipboard.writeText(household.join_code)
    setCodeCopied(true)
    toast.success(es.settings.codeCopied)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  if (loading || !household) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/casa/${householdId}`)}
          className="cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
          {es.settings.title}
        </h1>
      </div>

      {/* House settings */}
      <Card className="border-2">
        <CardHeader className="pb-2 flex-row items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">General</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="houseName">{es.settings.houseName}</Label>
            <Input
              id="houseName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label>{es.settings.weekEndDay}</Label>
            <div className="grid grid-cols-7 gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWeekEndDay(d)}
                  disabled={!isOwner}
                  className={`py-2 rounded-lg text-xs font-medium cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
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
          <div className="space-y-2">
            <Label htmlFor="reward">{es.settings.weeklyPrize}</Label>
            <Input
              id="reward"
              placeholder={es.settings.weeklyPrizePlaceholder}
              value={rewardText}
              onChange={(e) => setRewardText(e.target.value)}
              disabled={!isOwner}
              className="h-10"
            />
          </div>
          {!isOwner && (
            <p className="text-xs text-muted-foreground">
              {es.settings.ownerOnly}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dreaded task */}
      <Card className="border-2">
        <CardHeader className="pb-2 flex-row items-center gap-2">
          <Skull className="w-5 h-5 text-destructive" />
          <div>
            <h2 className="font-semibold">{es.settings.dreadedTask}</h2>
            <p className="text-xs text-muted-foreground">{es.settings.dreadedTaskDesc}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setDreadedTemplateId(null)}
              disabled={!isOwner}
              className={`px-3 py-2 rounded-lg border text-sm text-left cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                !dreadedTemplateId ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              Ninguna
            </button>
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDreadedTemplateId(t.id)}
                disabled={!isOwner}
                className={`px-3 py-2 rounded-lg border text-sm text-left cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  dreadedTemplateId === t.id ? 'border-destructive bg-destructive/10' : 'border-border'
                }`}
              >
                💀 {t.title}
              </button>
            ))}
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Creá tareas recurrentes primero
              </p>
            )}
            {!isOwner && (
              <p className="text-xs text-muted-foreground">
                {es.settings.ownerOnly}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members & invite code */}
      <Card className="border-2">
        <CardHeader className="pb-2 flex-row items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">{es.settings.members}</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => (
            <div key={m.profile_id} className="flex items-center gap-3 p-2">
              <span className="text-lg">{m.profile?.emoji}</span>
              <span className="font-medium flex-1">{m.profile?.display_name}</span>
              <Badge variant="secondary" className="text-xs">
                {m.role === 'owner' ? 'Admin' : 'Miembro'}
              </Badge>
            </div>
          ))}
          <Separator />
          <div className="space-y-2">
            <Label>{es.settings.inviteCode}</Label>
            <div className="flex gap-2">
              <code className="flex-1 px-4 py-2 rounded-lg bg-muted text-center font-mono text-lg tracking-[0.3em]">
                {household.join_code}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyCode}
                className="cursor-pointer"
              >
                {codeCopied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-2">
        <CardHeader className="pb-2 flex-row items-center gap-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">{es.settings.notifications}</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="phone">{es.settings.phone}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={es.settings.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Para recibir recordatorios y el resumen semanal por WhatsApp
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        onClick={handleSave}
        className="w-full h-12 text-base font-semibold cursor-pointer"
        disabled={saving}
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : es.settings.save}
      </Button>
    </div>
  )
}
