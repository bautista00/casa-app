import { describe, it, expect } from 'vitest'
import { nextOccurrences, pickRotatedAssignee } from '../recurrence'

// Use noon to avoid timezone-offset issues (UTC noon is the same day in all tz from UTC-12 to UTC+11)
function localDate(iso: string) {
  return new Date(`${iso}T12:00:00`)
}

describe('nextOccurrences', () => {
  it('generates daily occurrences', () => {
    const dates = nextOccurrences(
      { recurrence: 'daily', days_of_week: [], day_of_month: null },
      localDate('2024-09-09'), // Monday
      7
    )
    expect(dates).toHaveLength(8) // 9th through 16th inclusive
    expect(dates[0]).toBe('2024-09-09')
    expect(dates[7]).toBe('2024-09-16')
  })

  it('generates weekly occurrences for specific days', () => {
    const dates = nextOccurrences(
      { recurrence: 'weekly', days_of_week: [2], day_of_month: null }, // Tuesdays
      localDate('2024-09-09'), // Monday
      14
    )
    // Should find Tuesdays: Sep 10, Sep 17
    expect(dates).toContain('2024-09-10')
    expect(dates).toContain('2024-09-17')
    // All dates should be Tuesdays
    expect(dates.every((d) => localDate(d).getDay() === 2)).toBe(true)
  })

  it('generates weekly occurrences for multiple days', () => {
    const dates = nextOccurrences(
      { recurrence: 'weekly', days_of_week: [1, 4], day_of_month: null }, // Mon, Thu
      localDate('2024-09-09'), // Monday
      14
    )
    // Mon: Sep 9, 16; Thu: Sep 12, 19
    expect(dates).toContain('2024-09-09')
    expect(dates).toContain('2024-09-12')
    expect(dates).toContain('2024-09-16')
    expect(dates).toContain('2024-09-19')
  })

  it('returns empty for weekly with no days', () => {
    const dates = nextOccurrences(
      { recurrence: 'weekly', days_of_week: [], day_of_month: null },
      localDate('2024-09-09'),
      14
    )
    expect(dates).toHaveLength(0)
  })

  it('generates monthly occurrences', () => {
    const dates = nextOccurrences(
      { recurrence: 'monthly', days_of_week: [], day_of_month: 15 },
      localDate('2024-09-09'),
      45
    )
    expect(dates).toContain('2024-09-15')
    expect(dates).toContain('2024-10-15')
  })
})

describe('pickRotatedAssignee', () => {
  const memberIds = ['a', 'b', 'c']

  it('picks first member when no last assignee', () => {
    expect(pickRotatedAssignee(memberIds, null)).toBe('a')
  })

  it('rotates to next member', () => {
    expect(pickRotatedAssignee(memberIds, 'a')).toBe('b')
    expect(pickRotatedAssignee(memberIds, 'b')).toBe('c')
  })

  it('wraps around', () => {
    expect(pickRotatedAssignee(memberIds, 'c')).toBe('a')
  })

  it('returns first when last assignee is unknown', () => {
    expect(pickRotatedAssignee(memberIds, 'x')).toBe('a')
  })

  it('returns null for empty member list', () => {
    expect(pickRotatedAssignee([], 'a')).toBeNull()
  })
})
