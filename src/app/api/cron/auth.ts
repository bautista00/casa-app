// CASA-003: all three cron routes used to compare
// `authHeader !== \`Bearer ${process.env.CRON_SECRET}\``. When CRON_SECRET is
// unset, the template literal interpolates the string "undefined", so
// `Authorization: Bearer undefined` passed and the caller got a
// service-role client that bypasses RLS entirely. A missing secret must fail
// closed, not open. This is also the one place the comparison happens —
// previously it was copy-pasted three times, non-constant-time.
import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

export function cronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // fail closed — no secret configured, no access

  const header = request.headers.get('authorization') ?? ''
  const expected = Buffer.from(`Bearer ${secret}`)
  const got = Buffer.from(header)

  // timingSafeEqual throws if the buffers differ in length, so check that
  // first (this length check itself leaks no more than the header's length
  // already does over the wire).
  return got.length === expected.length && timingSafeEqual(got, expected)
}
