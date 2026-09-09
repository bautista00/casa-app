'use client'

import { useState, useEffect, useOptimistic, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { completeTask, reopenTask } from '@/lib/data/tasks'
import type { Task, HouseholdMember } from '@/types'
import { es } from '@/lib/i18n/es'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Undo2, AlertCircle, Calendar, Zap, Flame, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

interface BoardViewProps {
  tasks: Task[]
  members: HouseholdMember[]
  householdId: string
  userId: string
  today: string
  weekStart: string
  weekEnd: string
}

type TaskGroup = 'overdue' | 'today' | 'thisWeek' | 'done'

function groupTasks(tasks: Task[], today: string, weekStart: string, weekEnd: string) {
  const groups: Record<TaskGroup, Task[]> = {
    overdue: [],
    today: [],
    thisWeek: [],
    done: [],
  }

  for (const task of tasks) {
    if (task.status === 'done') {
      // Show done tasks from this week
      if (task.due_date && task.due_date >= weekStart && task.due_date < weekEnd) {
        groups.done.push(task)
      } else if (!task.due_date && task.completed_at) {
        const completedDate = format(parseISO(task.completed_at), 'yyyy-MM-dd')
        if (completedDate >= weekStart && completedDate < weekEnd) {
          groups.done.push(task)
        }
      }
    } else if (task.due_date && task.due_date < today) {
      groups.overdue.push(task)
    } else if (task.due_date === today) {
      groups.today.push(task)
    } else if (task.due_date && task.due_date >= weekStart && task.due_date < weekEnd) {
      groups.thisWeek.push(task)
    } else if (!task.due_date) {
      groups.thisWeek.push(task) // No date → show in "this week"
    }
  }

  return groups
}

const effortConfig = {
  rapida: { icon: Zap, label: '1pt', className: 'text-effort-rapida' },
  normal: { icon: Flame, label: '3pts', className: 'text-effort-normal' },
  pesada: { icon: Dumbbell, label: '5pts', className: 'text-effort-pesada' },
}

function TaskCard({
  task,
  userId,
  onComplete,
  onReopen,
}: {
  task: Task
  userId: string
  onComplete: (id: string) => void
  onReopen: (id: string) => void
}) {
  const effort = effortConfig[task.effort]
  const EffortIcon = effort.icon
  const isDone = task.status === 'done'

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isDone
          ? 'bg-success/5 border-success/20 opacity-70'
          : 'bg-card border-border hover:border-primary/30'
      }`}
    >
      {/* Complete/Reopen button */}
      <Button
        variant={isDone ? 'outline' : 'default'}
        size="icon"
        className={`w-10 h-10 rounded-full shrink-0 cursor-pointer ${
          isDone ? 'border-success text-success' : ''
        }`}
        onClick={() => (isDone ? onReopen(task.id) : onComplete(task.id))}
      >
        {isDone ? <Undo2 className="w-4 h-4" /> : <Check className="w-5 h-5" />}
      </Button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium ${
            isDone ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {task.assignee && (
            <span className="text-xs text-muted-foreground">
              {task.assignee.emoji} {task.assignee.display_name}
            </span>
          )}
          {task.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />
              {format(parseISO(task.due_date), 'd MMM')}
            </span>
          )}
        </div>
      </div>

      {/* Effort badge */}
      <Badge variant="secondary" className={`gap-1 shrink-0 ${effort.className}`}>
        <EffortIcon className="w-3 h-3" />
        {effort.label}
      </Badge>
    </div>
  )
}

export function BoardView({
  tasks: initialTasks,
  members,
  householdId,
  userId,
  today,
  weekStart,
  weekEnd,
}: BoardViewProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`tasks-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [...prev, payload.new as Task])
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t))
            )
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) =>
              prev.filter((t) => t.id !== (payload.old as { id: string }).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, supabase])

  async function handleComplete(taskId: string) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'done' as const, completed_by: userId, completed_at: new Date().toISOString() }
          : t
      )
    )
    try {
      await completeTask(supabase, taskId, userId)
      toast.success(es.board.complete)
    } catch {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'open' as const, completed_by: null, completed_at: null }
            : t
        )
      )
      toast.error(es.errors.generic)
    }
  }

  async function handleReopen(taskId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'open' as const, completed_by: null, completed_at: null }
          : t
      )
    )
    try {
      await reopenTask(supabase, taskId)
    } catch {
      toast.error(es.errors.generic)
    }
  }

  const groups = groupTasks(tasks, today, weekStart, weekEnd)

  const sections: { key: TaskGroup; label: string; icon: typeof AlertCircle; alert?: boolean }[] = [
    { key: 'overdue', label: es.board.overdue, icon: AlertCircle, alert: true },
    { key: 'today', label: es.board.today, icon: Calendar },
    { key: 'thisWeek', label: es.board.thisWeek, icon: Calendar },
    { key: 'done', label: es.board.done, icon: Check },
  ]

  return (
    <div className="space-y-4">
      {sections.map(({ key, label, icon: Icon, alert }) => {
        const sectionTasks = groups[key]
        if (sectionTasks.length === 0 && key !== 'today') return null

        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <Icon
                className={`w-4 h-4 ${alert && sectionTasks.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
              />
              <h3
                className={`font-semibold text-sm uppercase tracking-wide ${
                  alert && sectionTasks.length > 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {label}
              </h3>
              {sectionTasks.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {sectionTasks.length}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {sectionTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {es.board.noTasks} 🎉
                </p>
              ) : (
                sectionTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userId={userId}
                    onComplete={handleComplete}
                    onReopen={handleReopen}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
