// Casa — Recurrence expansion logic
// Pure TypeScript, zero framework imports. Unit-tested.

import {
  addDays,
  addMonths,
  startOfDay,
  setDate,
  getDay,
  format,
  isBefore,
  isEqual,
} from 'date-fns'
import type { Recurrence } from '@/types'

interface RecurrenceConfig {
  recurrence: Recurrence
  days_of_week: number[] // 0=Sun..6=Sat (used for weekly)
  day_of_month: number | null // 1-31 (used for monthly)
}

/**
 * Generate the next N occurrences (as ISO date strings) for a recurring task,
 * starting from `fromDate` and looking up to `horizon` days ahead.
 */
export function nextOccurrences(
  config: RecurrenceConfig,
  fromDate: Date,
  horizon: number = 14
): string[] {
  const start = startOfDay(fromDate)
  const end = addDays(start, horizon)
  const dates: string[] = []

  switch (config.recurrence) {
    case 'daily': {
      let d = start
      while (isBefore(d, end) || isEqual(d, end)) {
        dates.push(format(d, 'yyyy-MM-dd'))
        d = addDays(d, 1)
      }
      break
    }

    case 'weekly': {
      if (config.days_of_week.length === 0) break
      const daysSet = new Set(config.days_of_week)
      let d = start
      while (isBefore(d, end) || isEqual(d, end)) {
        if (daysSet.has(getDay(d))) {
          dates.push(format(d, 'yyyy-MM-dd'))
        }
        d = addDays(d, 1)
      }
      break
    }

    case 'monthly': {
      if (!config.day_of_month) break
      const targetDay = config.day_of_month
      // Check current month and next months within horizon
      let current = setDate(start, Math.min(targetDay, daysInMonth(start)))
      if (isBefore(current, start)) {
        current = setDate(
          addMonths(start, 1),
          Math.min(targetDay, daysInMonth(addMonths(start, 1)))
        )
      }
      for (let i = 0; i < 3; i++) {
        const candidate = setDate(
          addMonths(start, i),
          Math.min(targetDay, daysInMonth(addMonths(start, i)))
        )
        if (
          (isBefore(start, candidate) || isEqual(start, candidate)) &&
          (isBefore(candidate, end) || isEqual(candidate, end))
        ) {
          dates.push(format(candidate, 'yyyy-MM-dd'))
        }
      }
      break
    }
  }

  return dates
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

/**
 * Pick the next assignee in a rotation.
 * Given the list of member IDs and the last assignee, return the next one.
 */
export function pickRotatedAssignee(
  memberIds: string[],
  lastAssigneeId: string | null
): string | null {
  if (memberIds.length === 0) return null
  if (!lastAssigneeId) return memberIds[0]

  const idx = memberIds.indexOf(lastAssigneeId)
  if (idx === -1) return memberIds[0]

  return memberIds[(idx + 1) % memberIds.length]
}
