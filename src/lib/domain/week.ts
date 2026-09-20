// Casa — Week window logic
// Pure TypeScript, zero framework imports. Unit-tested.

import {
  startOfDay,
  addDays,
  subDays,
  differenceInDays,
  format,
} from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export interface WeekWindow {
  start: Date // inclusive
  end: Date // exclusive (the closing boundary)
  weekEndDay: number // 0-6
}

/**
 * Given a reference date and the household's week-end day,
 * return the current week's start and end boundaries.
 *
 * The week ENDS at midnight on weekEndDay. So if weekEndDay is 0 (Sunday),
 * the week runs Mon 00:00 → Sun 23:59:59 and closes at Sun midnight.
 */
export function getWeekWindow(
  now: Date,
  weekEndDay: number,
  timezone: string
): WeekWindow {
  const zonedNow = toZonedTime(now, timezone)
  const today = startOfDay(zonedNow)
  const currentDayOfWeek = today.getDay() // 0=Sun..6=Sat

  // Days until the midnight that CLOSES the week: the midnight AFTER
  // weekEndDay, not weekEndDay itself (CASA-004 — the exclusive boundary was
  // off by one day, which shifted the whole window one day earlier and
  // excluded the end day from its own week).
  // If today is the end day, the week closes tonight → 1 day away.
  const daysUntilEnd = ((weekEndDay - currentDayOfWeek + 7) % 7) + 1

  const end = addDays(today, daysUntilEnd)
  const start = subDays(end, 7)

  return { start, end, weekEndDay }
}

/**
 * Days remaining in the current week (including today).
 */
export function daysRemaining(
  now: Date,
  weekEndDay: number,
  timezone: string
): number {
  const window = getWeekWindow(now, weekEndDay, timezone)
  const zonedNow = toZonedTime(now, timezone)
  const today = startOfDay(zonedNow)
  return Math.max(0, differenceInDays(window.end, today))
}

/**
 * Format a week window for display: "2 Sep – 8 Sep"
 */
export function formatWeekRange(window: WeekWindow): string {
  const endDisplay = subDays(window.end, 1) // end is exclusive
  return `${format(window.start, 'd MMM')} – ${format(endDisplay, 'd MMM')}`
}

/**
 * Check if a given date falls within a week window.
 */
export function isInWeek(date: Date, window: WeekWindow): boolean {
  return date >= window.start && date < window.end
}

/**
 * Get the week window that should be closed (the one ending most recently before now).
 */
export function getClosableWeek(
  now: Date,
  weekEndDay: number,
  timezone: string
): WeekWindow {
  const current = getWeekWindow(now, weekEndDay, timezone)
  // The closable week is the one before the current
  return {
    start: subDays(current.start, 7),
    end: current.start,
    weekEndDay,
  }
}
