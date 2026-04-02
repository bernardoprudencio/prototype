import { useState, useRef, useEffect } from 'react'
import { colors, typography } from '../tokens'
import { DropdownIcon, CheckIcon } from '../assets/icons'

const fontFamily = typography.fontFamily

// 6:00 AM – 9:00 PM in 30-min steps
const ALL_TIMES = (() => {
  const times = []
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 21 && m === 30) break
      const h12 = h === 12 ? 12 : h > 12 ? h - 12 : h
      const period = h >= 12 ? 'PM' : 'AM'
      times.push(`${h12}:${m === 0 ? '00' : '30'} ${period}`)
    }
  }
  return times
})()

function toHHMM(label) {
  const [time, period] = label.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

/**
 * TimeInput — time picker dropdown (6 AM – 9 PM, 30-min intervals).
 *
 * Props:
 *   value       "HH:MM" string or ""
 *   onChange    fn("HH:MM")
 *   placeholder string
 */
export default function TimeInput({ value, onChange, placeholder }) {
  const [open, setOpen]       = useState(false)
  const [dropPos, setDropPos] = useState(null)
  const btnRef  = useRef(null)
  const listRef = useRef(null)

  const handleOpen = () => {
    if (open) { setOpen(false); return }
    const rect       = btnRef.current.getBoundingClientRect()
    const dropHeight = 224
    const spaceBelow = window.innerHeight - rect.bottom
    const showAbove  = spaceBelow < dropHeight + 10 && rect.top > dropHeight
    setDropPos({
      position: 'fixed',
      left:  rect.left,
      width: rect.width,
      zIndex: 900,
      ...(showAbove
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    if (value && listRef.current) {
      const el = listRef.current.querySelector('[data-selected="true"]')
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
    const h = e => { if (btnRef.current && !btnRef.current.closest('[data-timeinput]').contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const displayValue = value ? fmtTime(value) : null

  return (
    <div data-timeinput style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          width: '100%', padding: '12px 8px 12px 12px',
          border: `2px solid ${open ? colors.link : colors.borderInteractive}`,
          borderRadius: 4, fontSize: 16, fontFamily,
          color: displayValue ? colors.primary : colors.disabledText,
          background: '#fff', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', minHeight: 48, boxSizing: 'border-box',
        }}
      >
        <span style={{ flex: 1, fontWeight: 400, lineHeight: 1.5 }}>
          {displayValue || (placeholder || 'Select time…')}
        </span>
        <DropdownIcon />
      </button>

      {open && dropPos && (
        <div style={{
          ...dropPos,
          background: '#fff', borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: `1.5px solid ${colors.border}`,
        }}>
          <div ref={listRef} className="hide-scrollbar" style={{ maxHeight: 224, overflowY: 'auto' }}>
            {ALL_TIMES.map(time => {
              const selected = displayValue === time
              return (
                <div
                  key={time}
                  data-selected={selected}
                  onMouseDown={() => { onChange(toHHMM(time)); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px', cursor: 'pointer',
                    background: selected ? '#EBF1FB' : 'transparent',
                    transition: 'background 0.08s',
                  }}
                >
                  <span style={{
                    fontFamily, fontSize: 14,
                    fontWeight: selected ? 600 : 400,
                    color: selected ? colors.link : colors.primary,
                  }}>
                    {time}
                  </span>
                  {selected && <CheckIcon />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
