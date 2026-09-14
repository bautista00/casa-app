'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createTask } from '@/lib/data/tasks'
import { createTemplate } from '@/lib/data/templates'
import { getHouseholdMembers } from '@/lib/data/households'
import type { HouseholdMember, Effort, Recurrence, AssignmentMode } from '@/types'
import { EFFORT_POINTS } from '@/types'
import { es } from '@/lib/i18n/es'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Zap, Flame, Dumbbell, ArrowLeft, Repeat } from 'lucide-react'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'

export default function NuevaTaskPage() {
  const router = useRouter()
  const params = useParams()
  const householdId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [members, setMembers] = useState<HouseholdMember[]>([])

  // Task fields
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [effort, setEffort] = useState<Effort>('normal')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isRecurring, setIsRecurring] = useState(false)

  // Recurring fields
  const [recurrence, setRecurrence] = useState<Recurrence>('weekly')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [dayOfMonth, setDayOfMonth] = useState<number>(1)
  const [assignment, setAssignment] = useState<AssignmentMode>('fixed')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const m = await getHouseholdMembers(supabase, householdId)
      setMembers(m)
      setLoading(false)
    }
    init()
  }, [])

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  // A one-off task without a due date can never be scored: both the board's
  // week filter and the week-close snapshot select tasks by `due_date`
  // (CASA-011), so the date is required for non-recurring tasks.
  const missingDueDate = !isRecurring && !dueDate

  // A recurring template only ever produces tasks when its schedule is
  // satisfiable: `nextOccurrences` bails out immediately on an empty
  // `days_of_week` (weekly) and a monthly day outside 1..31 can never match a
  // real date. Saving either one is a task that silently never happens
  // (CASA-022), so block the save and say why.
  const missingWeekday =
    isRecurring && recurrence === 'weekly' && daysOfWeek.length === 0
  const badDayOfMonth =
    isRecurring &&
    recurrence === 'monthly' &&
    (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)
  const recurrenceInvalid = missingWeekday || badDayOfMonth

  async function handleSave() {
    if (!title.trim() || missingDueDate || recurrenceInvalid) return
    setSaving(true)
    try {
      if (isRecurring) {
        // Create a template
        await createTemplate(supabase, {
          household_id: householdId,
          title: title.trim(),
          notes: notes.trim() || null,
          effort,
          recurrence,
          days_of_week: recurrence === 'weekly' ? daysOfWeek : [],
          day_of_month: recurrence === 'monthly' ? dayOfMonth : null,
          assignment,
          default_assignee_id: assigneeId,
        })
        toast.success(es.task.recurringCreated)
      } else {
        // Create a one-off task
        await createTask(supabase, {
          household_id: householdId,
          title: title.trim(),
          notes: notes.trim() || null,
          effort,
          assignee_id: assigneeId,
          due_date: dueDate,
          created_by: userId,
        })
        toast.success(es.task.created)
      }
      router.push(`/casa/${householdId}`)
    } catch {
      toast.error(es.errors.generic)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="size-11 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
          {es.task.create}
        </h1>
      </div>

      <Card className="border-2 shadow-lg">
        <CardContent className="pt-6 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{es.task.title}</Label>
            <Input
              id="title"
              placeholder={es.task.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-base"
              autoFocus
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{es.task.notes}</Label>
            <Input
              id="notes"
              placeholder={es.task.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Effort */}
          <div className="space-y-2">
            <Label>{es.task.effort}</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'rapida' as Effort, icon: Zap, label: es.task.effortRapida, ink: 'text-effort-rapida-ink' },
                { key: 'normal' as Effort, icon: Flame, label: es.task.effortNormal, ink: 'text-effort-normal-ink' },
                { key: 'pesada' as Effort, icon: Dumbbell, label: es.task.effortPesada, ink: 'text-effort-pesada-ink' },
              ]).map(({ key, icon: Icon, label, ink }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEffort(key)}
                  className={`flex min-h-11 flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    effort === key
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${ink}`} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label>{es.task.assignee}</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAssigneeId(null)}
                className={`min-h-11 px-3 py-2 rounded-xl border-2 text-sm transition-all cursor-pointer ${
                  !assigneeId
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {es.task.unassigned}
              </button>
              {members.map((m) => (
                <button
                  key={m.profile_id}
                  type="button"
                  onClick={() => setAssigneeId(m.profile_id)}
                  className={`min-h-11 px-3 py-2 rounded-xl border-2 text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                    assigneeId === m.profile_id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <span>{m.profile?.emoji}</span>
                  <span>{m.profile?.display_name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Due date (only for non-recurring) */}
          {!isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="dueDate">{es.task.dueDate}</Label>
              <Input
                id="dueDate"
                type="date"
                required
                aria-invalid={missingDueDate || undefined}
                aria-describedby={missingDueDate ? 'dueDate-hint' : undefined}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10"
              />
              {missingDueDate && (
                <p id="dueDate-hint" className="text-xs text-destructive">
                  {es.task.dueDateRequired}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Recurring toggle */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                isRecurring ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <Repeat className={`w-5 h-5 ${isRecurring ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-medium">{es.task.recurring}</span>
            </button>

            {isRecurring && (
              <div className="space-y-4 pl-2">
                {/* Recurrence type */}
                <div className="space-y-2">
                  <Label>{es.task.recurrence}</Label>
                  <div className="flex gap-2">
                    {(['daily', 'weekly', 'monthly'] as Recurrence[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRecurrence(r)}
                        className={`min-h-11 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
                          recurrence === r
                            ? 'border-primary bg-primary/10 font-medium'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        {r === 'daily' ? es.task.daily : r === 'weekly' ? es.task.weekly : es.task.monthly}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Days of week (for weekly) */}
                {recurrence === 'weekly' && (
                  <div className="space-y-2">
                    <Label>{es.task.daysOfWeek}</Label>
                    <div
                      role="group"
                      aria-describedby={missingWeekday ? 'daysOfWeek-hint' : undefined}
                      className="grid grid-cols-7 gap-1"
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          className={`min-h-11 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                            daysOfWeek.includes(d)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {es.daysShort[d as keyof typeof es.daysShort]}
                        </button>
                      ))}
                    </div>
                    {missingWeekday && (
                      <p id="daysOfWeek-hint" className="text-xs text-destructive">
                        {es.task.pickAtLeastOneDay}
                      </p>
                    )}
                  </div>
                )}

                {/* Day of month (for monthly) */}
                {recurrence === 'monthly' && (
                  <div className="space-y-2">
                    <Label htmlFor="dayOfMonth">{es.task.dayOfMonth}</Label>
                    <Input
                      id="dayOfMonth"
                      type="number"
                      min={1}
                      max={31}
                      aria-invalid={badDayOfMonth || undefined}
                      aria-describedby={badDayOfMonth ? 'dayOfMonth-hint' : undefined}
                      value={Number.isNaN(dayOfMonth) ? '' : dayOfMonth}
                      onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10))}
                      className="h-10 w-24"
                    />
                    {badDayOfMonth && (
                      <p id="dayOfMonth-hint" className="text-xs text-destructive">
                        {es.task.dayOfMonthRange}
                      </p>
                    )}
                  </div>
                )}

                {/* Assignment mode */}
                <div className="space-y-2">
                  <Label>{es.task.assignment}</Label>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignment('fixed')}
                      className={`min-h-11 px-3 py-2 rounded-lg border text-sm text-left cursor-pointer transition-all ${
                        assignment === 'fixed'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      {es.task.fixed}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignment('rotate')}
                      className={`min-h-11 px-3 py-2 rounded-lg border text-sm text-left cursor-pointer transition-all ${
                        assignment === 'rotate'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      {es.task.rotate}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            className="w-full h-12 text-base font-semibold cursor-pointer"
            disabled={saving || !title.trim() || missingDueDate || recurrenceInvalid}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : es.task.save}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
