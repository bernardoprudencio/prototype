import { useState, useRef, useEffect } from 'react'
import { colors, typography } from '../tokens'
import { DropdownIcon, ChevronRightIcon } from '../assets/icons'

const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LETTERS = ['M','T','W','T','F','S','S']
const fontFamily  = typography.fontFamily

function parseDate(s)   { return s ? new Date(s + 'T00:00:00') : null }
function dateKey(d)     { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function fmtDateLong(d) { return `${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}` }
function isToday(d)     { const t = new Date(); return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate() }

/**
 * CalInput — calendar date picker dropdown.
 *
 * Props:
 *   value        "YYYY-MM-DD" string or ""
 *   onChange     fn(dateKey)
 *   minDate      "YYYY-MM-DD" string (defaults to today)
 *   placeholder  string
 *   bookedDates  string[]  "YYYY-MM-DD" dates to show a green dot indicator
 */
export default function CalInput({ value, onChange, minDate, maxDate, placeholder, bookedDates }) {
  const sel   = value ? parseDate(value) : null
  const today = new Date(); today.setHours(0,0,0,0)
  const minD  = minDate ? parseDate(minDate) : today
  const maxD  = maxDate ? parseDate(maxDate) : null

  const bookedSet = bookedDates ? new Set(bookedDates) : null

  const [open,       setOpen]       = useState(false)
  const [dropPos,    setDropPos]    = useState(null)
  const [viewYear,   setViewYear]   = useState(sel ? sel.getFullYear()  : today.getFullYear())
  const [viewMonth,  setViewMonth]  = useState(sel ? sel.getMonth()     : today.getMonth())
  const [hoveredDay, setHoveredDay] = useState(null)
  const btnRef = useRef(null)

  const handleOpen = () => {
    if (open) { setOpen(false); return }
    const rect       = btnRef.current.getBoundingClientRect()
    const dropW      = Math.min(Math.max(rect.width, 284), 600)
    const dropHeight = 340
    const spaceBelow = window.innerHeight - rect.bottom
    const showAbove  = spaceBelow < dropHeight + 10 && rect.top > dropHeight
    const leftPos    = rect.left + dropW > window.innerWidth ? rect.right - dropW : rect.left
    setDropPos({
      position: 'fixed',
      left: leftPos,
      width: dropW,
      zIndex: 900,
      ...(showAbove
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const h = e => { if (!btnRef.current?.closest('[data-calinput]').contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Monday-first grid: Mon=0 … Sun=6
  const firstDay       = new Date(viewYear, viewMonth, 1)
  const firstDayOffset = (firstDay.getDay() - 1 + 7) % 7
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells          = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isAtMaxMonth = maxD && (viewYear > maxD.getFullYear() || (viewYear === maxD.getFullYear() && viewMonth >= maxD.getMonth()))
  const prevM = () => viewMonth === 0  ? (setViewYear(y => y - 1), setViewMonth(11)) : setViewMonth(m => m - 1)
  const nextM = () => { if (isAtMaxMonth) return; viewMonth === 11 ? (setViewYear(y => y + 1), setViewMonth(0)) : setViewMonth(m => m + 1) }

  const pick = day => {
    if (!day) return
    const d = new Date(viewYear, viewMonth, day)
    if (minD && d < minD) return
    if (maxD && d > maxD) return
    onChange(dateKey(d))
    setOpen(false)
  }

  const label = sel ? fmtDateLong(sel) : (placeholder || 'Select date…')

  return (
    <div data-calinput style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          width: '100%', padding: '12px 8px 12px 12px',
          border: `2px solid ${open ? colors.link : colors.borderInteractive}`,
          borderRadius: 4, fontSize: 16, fontFamily,
          color: sel ? colors.primary : colors.disabledText,
          background: '#fff', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', minHeight: 48, boxSizing: 'border-box',
        }}
      >
        <span style={{ flex: 1, fontWeight: 400, lineHeight: 1.5 }}>{label}</span>
        <DropdownIcon />
      </button>

      {open && dropPos && (
        <div
          style={{
            ...dropPos,
            background: '#fff', borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: `1.5px solid ${colors.border}`,
            padding: '14px 12px',
          }}
        >
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={prevM} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', transform: 'rotate(180deg)' }}><ChevronRightIcon /></button>
            <span style={{ fontFamily, fontWeight: 600, fontSize: 14, color: colors.primary }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextM} style={{ background: 'none', border: 'none', cursor: isAtMaxMonth ? 'default' : 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', opacity: isAtMaxMonth ? 0.3 : 1 }}><ChevronRightIcon /></button>
          </div>

          {/* Day letter headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, paddingBottom: 8 }}>
            {DAY_LETTERS.map((l, i) => (
              <div key={i} style={{ height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily, fontSize: 14, fontWeight: 400, color: colors.tertiary, lineHeight: 1 }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={'e' + i} />
              const d       = new Date(viewYear, viewMonth, day)
              const dk      = dateKey(d)
              const isSel   = sel && dk === dateKey(sel)
              const dis     = (minD && d < minD) || (maxD && d > maxD)
              const tod     = isToday(d)
              const booked  = bookedSet ? bookedSet.has(dk) : false
              const hover   = hoveredDay === day && !dis && !isSel
              return (
                <div
                  key={day}
                  onClick={() => !dis && pick(day)}
                  onMouseEnter={() => !dis && setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    width: '100%', height: 44,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    borderRadius: 8,
                    cursor: dis ? 'not-allowed' : 'pointer',
                    background: isSel ? colors.link : hover ? '#EBF1FB' : 'transparent',
                    opacity: dis ? 0.4 : 1,
                    transition: 'background 0.1s',
                    userSelect: 'none',
                  }}
                >
                  <span style={{
                    fontFamily, fontSize: 14, lineHeight: 1,
                    fontWeight: isSel ? 700 : tod ? 600 : 400,
                    color: dis ? colors.disabledText : isSel ? '#fff' : tod ? colors.link : colors.primary,
                  }}>
                    {day}
                  </span>
                  {booked && (
                    <div style={{
                      position: 'absolute', bottom: 4,
                      width: 6, height: 6, borderRadius: 3,
                      background: isSel ? colors.white : colors.success,
                      border: `1px solid ${colors.white}`,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
