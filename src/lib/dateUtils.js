// ─── Date / time utilities ────────────────────────────────────────────────────
// Pure helpers with no React or app-data dependencies.

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export function parseDate(s)  { return s ? new Date(s + 'T00:00:00') : null }
export function dateKey(d)    { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

export function fmtDate(d)      { if (!d) return ''; return `${MONTHS_S[d.getMonth()]} ${d.getDate()}` }
export function fmtDateFull(d)  { if (!d) return ''; return `${MONTHS_S[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` }
export function fmtDateLong(d)  { if (!d) return ''; return `${DAYS_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}` }
export function fmtMonthYear(d) { if (!d) return ''; return `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }

export function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export function addDays(d, n)   { const r = new Date(d); r.setDate(r.getDate() + n); return r }
export function addWeeks(d, n)  { return addDays(d, n * 7) }
export function addMonths(d, n) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r }

export function isToday(d) {
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}
export function isYesterday(d) {
  const y = addDays(new Date(new Date().setHours(0,0,0,0)), -1)
  return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate()
}
export function fmtRelDate(d) {
  if (isToday(d))     return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return fmtDate(d)
}
export function isPast(d) { return d < new Date(new Date().setHours(0,0,0,0)) }

export function nightCount(u) {
  if (!u.startDate || !u.endDate) return 1
  return Math.max(1, Math.round((parseDate(u.endDate) - parseDate(u.startDate)) / 86400000))
}

export function endTimeFromDuration(t, mins) {
  if (!t || !mins) return ''
  const [h, m] = t.split(':').map(Number)
  const tot = h * 60 + m + mins
  return `${String(Math.floor(tot / 60) % 24).padStart(2,'0')}:${String(tot % 60).padStart(2,'0')}`
}
