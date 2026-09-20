import { format, parseISO, subDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// --- CASA-021: historial week range ---
function formatWeekRange(w){ const e = subDays(w.end,1); return `${format(w.start,'d MMM')} – ${format(e,'d MMM')}` }
const start = parseISO('2026-09-13'), end = parseISO('2026-09-20')
console.log('CASA-021 stored 2026-09-13/2026-09-20 renders:', formatWeekRange({start,end}))
console.log('CASA-021 next card starts:', format(end,'d MMM'), '(shares a date with previous end?',
  format(subDays(end,1),'d MMM') === format(end,'d MMM'), ')')

// --- CASA-006: today in household tz ---
const tz = 'America/Argentina/Buenos_Aires'
for (const iso of ['2026-09-17T00:30:00Z','2026-09-17T15:00:00Z','2026-03-01T02:30:00Z']) {
  const now = new Date(iso)
  console.log(`CASA-006 ${iso}  server-local=${format(now,'yyyy-MM-dd')}  household-local=${format(toZonedTime(now,tz),'yyyy-MM-dd')}`)
}
