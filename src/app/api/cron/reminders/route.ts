import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const nowParam = request.nextUrl.searchParams.get('now')
  const now = nowParam ? new Date(nowParam) : new Date()

  const supabase = createServiceClient()
  const results: string[] = []

  // Get all households
  const { data: households } = await supabase.from('households').select('*')
  if (!households) {
    return NextResponse.json({ message: 'No households', results })
  }

  for (const household of households) {
    const zonedNow = toZonedTime(now, household.timezone)
    const hour = zonedNow.getHours()

    // Only send at ~8 AM local time (cron runs hourly)
    if (hour !== 8) continue

    const today = format(zonedNow, 'yyyy-MM-dd')

    // Get today's open tasks with assignees
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(display_name, phone_e164)')
      .eq('household_id', household.id)
      .eq('status', 'open')
      .lte('due_date', today)
      .not('assignee_id', 'is', null)

    if (!tasks || tasks.length === 0) continue

    // Group tasks by assignee
    const byAssignee = new Map<string, { name: string; phone: string | null; tasks: string[] }>()
    for (const task of tasks) {
      const assignee = task.assignee as { display_name: string; phone_e164: string | null } | null
      if (!assignee || !task.assignee_id) continue
      if (!byAssignee.has(task.assignee_id)) {
        byAssignee.set(task.assignee_id, {
          name: assignee.display_name,
          phone: assignee.phone_e164,
          tasks: [],
        })
      }
      const prefix = task.due_date < today ? '⚠️ ' : ''
      byAssignee.get(task.assignee_id)!.tasks.push(`${prefix}${task.title}`)
    }

    // Send WhatsApp reminders
    for (const [profileId, data] of byAssignee) {
      if (!data.phone) continue

      const taskList = data.tasks.join('\n• ')
      const message = `Hoy te toca:\n• ${taskList}`

      // TODO: Wire up WhatsApp API call here
      // await sendWhatsApp(data.phone, 'recordatorio_hoy', [taskList])

      results.push(`${household.name} → ${data.name}: ${data.tasks.length} tareas`)
    }
  }

  return NextResponse.json({ message: 'Reminders sent', results })
}
