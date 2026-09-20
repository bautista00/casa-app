import { describe, it, expect } from 'vitest'
import { getWeekWindow, daysRemaining, isInWeek, formatWeekRange, getClosableWeek } from '../week'
import { format } from 'date-fns'

const TZ = 'America/Argentina/Buenos_Aires'
const at = (isoUtc: string) => new Date(isoUtc)
const d = (x: Date) => format(x, 'yyyy-MM-dd')

describe('getWeekWindow — weekEndDay = 0 (Sunday)', () => {
  it('includes the end day itself', () => {
    const w = getWeekWindow(at('2026-09-20T15:00:00Z'), 0, TZ) // Sunday noon ART
    expect(d(w.start)).toBe('2026-09-14') // Monday
    expect(d(w.end)).toBe('2026-09-21')   // exclusive: next Monday
    expect(isInWeek(new Date('2026-09-20T12:00:00'), w)).toBe(true)
  })

  it('daysRemaining counts down to 1 on the end day', () => {
    const days = (iso: string) => daysRemaining(at(iso), 0, TZ)
    expect(days('2026-09-14T15:00:00Z')).toBe(7) // Monday
    expect(days('2026-09-19T15:00:00Z')).toBe(2) // Saturday
    expect(days('2026-09-20T15:00:00Z')).toBe(1) // Sunday — the end day
    expect(days('2026-09-21T15:00:00Z')).toBe(7) // next Monday, new week
  })

  it('formats the range as Mon–Sun', () => {
    expect(formatWeekRange(getWeekWindow(at('2026-09-16T15:00:00Z'), 0, TZ))).toBe('14 Sep – 20 Sep')
  })
})

describe('getWeekWindow — every weekEndDay', () => {
  it('always spans exactly 7 days and ends the day after weekEndDay', () => {
    for (let end = 0; end <= 6; end++) {
      for (let i = 0; i < 7; i++) {
        const now = at(`2026-09-${14 + i}T15:00:00Z`)
        const w = getWeekWindow(now, end, TZ)
        expect((+w.end - +w.start) / 86400000).toBe(7)
        expect(new Date(+w.end - 86400000).getDay()).toBe(end) // last included day
        expect(isInWeek(new Date(+now - 3 * 3600e3), w)).toBe(true)
      }
    }
  })
})

describe('getClosableWeek', () => {
  it('returns the seven days that just finished', () => {
    const c = getClosableWeek(at('2026-09-21T06:00:00Z'), 0, TZ) // Monday 03:00 ART
    expect(d(c.start)).toBe('2026-09-14')
    expect(d(c.end)).toBe('2026-09-21')
  })
})
