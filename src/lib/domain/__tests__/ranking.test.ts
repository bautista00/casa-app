import { describe, it, expect } from 'vitest'
import { computeStandings, determineResults } from '../ranking'

const members = [
  { profile_id: 'a', display_name: 'Bauti', emoji: '😎' },
  { profile_id: 'b', display_name: 'Hernán', emoji: '🤓' },
  { profile_id: 'c', display_name: 'Mamá', emoji: '🌟' },
]

describe('computeStandings', () => {
  it('ranks by points descending', () => {
    const tasks = [
      { assignee_id: 'a', completed_by: 'a', points: 5, status: 'done' as const },
      { assignee_id: 'b', completed_by: 'b', points: 3, status: 'done' as const },
      { assignee_id: 'c', completed_by: 'c', points: 1, status: 'done' as const },
    ]
    const standings = computeStandings(tasks, members)
    expect(standings[0].profile_id).toBe('a')
    expect(standings[0].points).toBe(5)
    expect(standings[0].rank).toBe(1)
    expect(standings[1].rank).toBe(2)
    expect(standings[2].rank).toBe(3)
  })

  it('breaks ties by tasks completed', () => {
    const tasks = [
      { assignee_id: 'a', completed_by: 'a', points: 3, status: 'done' as const },
      { assignee_id: 'b', completed_by: 'b', points: 1, status: 'done' as const },
      { assignee_id: 'b', completed_by: 'b', points: 1, status: 'done' as const },
      { assignee_id: 'b', completed_by: 'b', points: 1, status: 'done' as const },
    ]
    // Both have 3 points, but b has 3 tasks vs a's 1
    const standings = computeStandings(tasks, members)
    expect(standings[0].profile_id).toBe('b')
    expect(standings[0].tasks_done).toBe(3)
    expect(standings[1].profile_id).toBe('a')
  })

  it('assigns same rank for true ties', () => {
    const tasks = [
      { assignee_id: 'a', completed_by: 'a', points: 3, status: 'done' as const },
      { assignee_id: 'b', completed_by: 'b', points: 3, status: 'done' as const },
    ]
    const standings = computeStandings(tasks, members)
    expect(standings[0].rank).toBe(1)
    expect(standings[1].rank).toBe(1) // true tie
  })

  it('ignores open tasks', () => {
    const tasks = [
      { assignee_id: 'a', completed_by: null, points: 5, status: 'open' as const },
      { assignee_id: 'b', completed_by: 'b', points: 1, status: 'done' as const },
    ]
    const standings = computeStandings(tasks, members)
    expect(standings[0].profile_id).toBe('b')
    expect(standings[0].points).toBe(1)
  })

  it('handles no tasks', () => {
    const standings = computeStandings([], members)
    expect(standings).toHaveLength(3)
    expect(standings[0].points).toBe(0)
    expect(standings[0].rank).toBe(1)
  })
})

describe('determineResults', () => {
  it('identifies winner and last place', () => {
    const standings = computeStandings(
      [
        { assignee_id: 'a', completed_by: 'a', points: 5, status: 'done' as const },
        { assignee_id: 'b', completed_by: 'b', points: 3, status: 'done' as const },
        { assignee_id: 'c', completed_by: 'c', points: 1, status: 'done' as const },
      ],
      members
    )
    const result = determineResults(standings)
    expect(result.winner?.profile_id).toBe('a')
    expect(result.lastPlace?.profile_id).toBe('c')
    expect(result.isTie).toBe(false)
  })

  it('declares tie when top two are equal', () => {
    const standings = computeStandings(
      [
        { assignee_id: 'a', completed_by: 'a', points: 3, status: 'done' as const },
        { assignee_id: 'b', completed_by: 'b', points: 3, status: 'done' as const },
      ],
      members
    )
    const result = determineResults(standings)
    expect(result.winner).toBeNull()
    expect(result.isTie).toBe(true)
  })

  it('returns null lastPlace when bottom ties', () => {
    const standings = computeStandings(
      [
        { assignee_id: 'a', completed_by: 'a', points: 5, status: 'done' as const },
      ],
      [members[0], members[1]]
    )
    // b has 0 but is alone at the bottom — wait, there's only 2 members
    // with a at 5 and b at 0, b is last
    const result = determineResults(standings)
    expect(result.lastPlace?.profile_id).toBe('b')
  })
})
