import React, { useState, useRef, useEffect } from 'react'
import { colors, typography, radius, shadows } from '../tokens'
import { Button, PetAvatar } from '../components'
import { BackIcon, TrashIcon, CautionIcon, CloseSmIcon, SuccessIcon } from '../assets/icons'
import Chip from '../components/Chip'

// ── Responsive hook ────────────────────────────────────────────────────────────
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth > 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

// ── Text style helper ──────────────────────────────────────────────────────────
const tx = (size, weight, color) => ({
  fontFamily: typography.fontFamily, fontSize: size, fontWeight: weight, color, margin: 0,
})

// ── Sidebar card ───────────────────────────────────────────────────────────────
const UserInfoCard = ({ owner }) => (
  <div style={{ background: colors.white, borderRadius: radius.primary, padding: '24px 16px' }}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <PetAvatar size={64} images={[owner.image]} />
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', paddingLeft: 8 }}>
        <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25 }}>{owner.name}</p>
        <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.5 }}>{owner.service}</p>
        <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.5 }}>{owner.petNames}</p>
      </div>
    </div>
  </div>
)

const TemplateCard = ({ owner }) => {
  // Group template entries by day (preserving week order)
  const byDay = {}
  owner.template.forEach(({ day, time }) => {
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(time)
  })
  const entries = Object.entries(byDay)

  return (
    <div style={{ background: colors.white, borderRadius: radius.primary, padding: '24px 16px' }}>
      <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25, marginBottom: 16 }}>Weekly schedule template</p>
      <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.25, marginBottom: 8 }}>Repeats on</p>
      {entries.map(([day, times]) => (
        <div key={day} style={{ paddingBottom: 24 }}>
          <p style={{ ...tx(16, 600, colors.primary), lineHeight: 1.5, marginBottom: 8 }}>{day}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {times.map((t, i) => (
              <p key={i} style={{ ...tx(14, 400, colors.primary), margin: 0 }}>{t}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ emptyDays, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      background: '#FFEDE8', borderRadius: 4,
      boxShadow: '0px 2px 12px -1px rgba(27,31,35,0.24)',
      padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start',
      marginBottom: 16,
    }}>
      <CautionIcon />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 14, color: colors.primary, lineHeight: 1.25, margin: '0 0 4px' }}>
          The following days have no time scheduled:
        </p>
        <ul style={{ margin: 0, paddingLeft: 21 }}>
          {emptyDays.map((day, i) => (
            <li key={i} style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.primary, lineHeight: 1.5 }}>
              {day}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0, marginTop: 2 }}
      >
        <CloseSmIcon />
      </button>
    </div>
  )
}

// ── Template diff ─────────────────────────────────────────────────────────────
const computeTemplateChanges = (oldTemplate, selectedDays, daySchedules) => {
  const changes = []
  const allDays = [...new Set([
    ...oldTemplate.map(t => t.day),
    ...selectedDays,
  ])]
  allDays.forEach(day => {
    const oldTimes = oldTemplate.filter(t => t.day === day).map(t => t.time)
    const newTimes = selectedDays.includes(day) ? (daySchedules[day] || []) : []
    const removed = oldTimes.filter(t => !newTimes.includes(t))
    const added   = newTimes.filter(t => !oldTimes.includes(t))
    if (removed.length || added.length) {
      changes.push({ day, removed, added })
    }
  })
  return changes
}

// ── Template change rows ───────────────────────────────────────────────────────
function TemplateChangeRows({ changes }) {
  return (
    <div className="hide-scrollbar" style={{ maxHeight: 240, overflowY: 'auto', padding: '24px 0' }}>
      {changes.map((change, i) => (
        <div key={i} style={{ paddingBottom: i < changes.length - 1 ? 12 : 0 }}>
          <p style={{ fontFamily: typography.fontFamily, fontSize: 16, fontWeight: 600, color: colors.primary, marginBottom: 4, lineHeight: 1.5 }}>
            {change.day}
          </p>
          {change.removed.map((t, j) => (
            <p key={`r${j}`} style={{ fontFamily: typography.fontFamily, fontSize: 14, fontWeight: 400, color: '#BC4338', marginBottom: 2, lineHeight: 1.5 }}>
              Removed: {t}
            </p>
          ))}
          {change.added.map((t, j) => (
            <p key={`a${j}`} style={{ fontFamily: typography.fontFamily, fontSize: 14, fontWeight: 400, color: '#1B6C42', marginBottom: 2, lineHeight: 1.5 }}>
              Added: {t}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Confirm sheet (mobile) ─────────────────────────────────────────────────────
function ConfirmSheet({ changes, ownerName, onConfirm, onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(27,31,35,0.48)', display: 'flex', alignItems: 'flex-end', zIndex: 10 }}
      onClick={onClose}
    >
      <div
        style={{ background: colors.white, borderRadius: '16px 16px 0 0', boxShadow: shadows.medium, padding: '32px 16px 24px', width: '100%', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 36, height: 5, borderRadius: 35, background: '#C9CFD4' }} />
        <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25, marginBottom: 8 }}>
          Confirm changes
        </p>
        <p style={{ ...tx(14, 400, colors.primary), lineHeight: 1.5, marginBottom: 0 }}>
          Review your changes below. We'll notify {ownerName} of these updates.
        </p>
        <TemplateChangeRows changes={changes} />
        <Button variant="primary" size="default" fullWidth onClick={onConfirm}>
          Confirm and notify
        </Button>
        <div style={{ paddingTop: 12 }}>
          <Button variant="default" size="default" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm modal (desktop) ────────────────────────────────────────────────────
function ConfirmModal({ changes, ownerName, onConfirm, onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(27,31,35,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: colors.white, borderRadius: 8,
        boxShadow: '0px 4px 16px 0px rgba(0,0,0,0.12)',
        padding: 24, width: 400, maxWidth: 'calc(100vw - 48px)',
      }}>
        <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25, marginBottom: 8 }}>
          Confirm changes
        </p>
        <p style={{ ...tx(14, 400, colors.primary), lineHeight: 1.5, marginBottom: 0 }}>
          Review your changes below. We'll notify {ownerName} of these updates.
        </p>
        <TemplateChangeRows changes={changes} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button variant="primary" size="default" fullWidth onClick={onConfirm}>
            Confirm and notify
          </Button>
          <Button variant="flat" size="default" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Success banner ─────────────────────────────────────────────────────────────
function SuccessBanner({ onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      background: '#F1FDF6', borderRadius: 4,
      boxShadow: '0px 2px 12px -1px rgba(27,31,35,0.24)',
      padding: 16, display: 'flex', gap: 12, alignItems: 'center',
      marginBottom: 16,
    }}>
      <SuccessIcon />
      <p style={{ ...tx(14, 600, colors.primary), lineHeight: 1.25, flex: 1, margin: 0 }}>
        Schedule template was updated successfully
      </p>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
      >
        <CloseSmIcon />
      </button>
    </div>
  )
}

// ── Time helpers ──────────────────────────────────────────────────────────────
const DAYS = [
  { key: 'Monday',    label: 'Monday' },
  { key: 'Tuesday',  label: 'Tuesday' },
  { key: 'Wednesday',label: 'Wednesday' },
  { key: 'Thursday', label: 'Thursday' },
  { key: 'Friday',   label: 'Friday' },
  { key: 'Saturday', label: 'Saturday' },
  { key: 'Sunday',   label: 'Sunday' },
]

const ALL_TIMES = []
for (let h = 6; h <= 21; h++) {
  for (const m of [0, 30]) {
    const h12 = h % 12 || 12
    const ampm = h >= 12 ? 'PM' : 'AM'
    ALL_TIMES.push(`${h12}:${String(m).padStart(2, '0')} ${ampm}`)
  }
}

function timeToMins(t) {
  const [time, ampm] = t.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return h * 60 + m
}

function fmtStartDate(date) {
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${dayNames[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
}

// ── TimeDropdown ──────────────────────────────────────────────────────────────
function TimeDropdown({ existingTimes, onSelect, anchorRef }) {
  const ref = useRef(null)
  const [above, setAbove] = useState(false)

  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setAbove(window.innerHeight - rect.bottom < 240 && rect.top > 240)
    }
  }, [anchorRef])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) &&
          anchorRef?.current && !anchorRef.current.contains(e.target)) {
        // parent handles closing via onSelect or blur
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [anchorRef])

  const available = ALL_TIMES.filter(t =>
    !existingTimes.includes(t) &&
    !existingTimes.some(et => Math.abs(timeToMins(t) - timeToMins(et)) < 60)
  )

  return (
    <div ref={ref} style={{
      position: 'absolute',
      [above ? 'bottom' : 'top']: 'calc(100% + 4px)',
      left: 0,
      zIndex: 200,
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.primary,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      maxHeight: 224,
      overflowY: 'auto',
      minWidth: 140,
    }}>
      {available.length === 0 ? (
        <p style={{ padding: '10px 12px', fontFamily: typography.fontFamily, fontSize: 14, color: colors.tertiary, margin: 0 }}>
          No times available
        </p>
      ) : available.map(t => (
        <button
          key={t}
          onMouseDown={(e) => { e.preventDefault(); onSelect(t) }}
          style={{
            display: 'block', width: '100%', padding: '10px 12px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: typography.fontFamily, fontSize: 14,
            color: colors.primary, textAlign: 'left',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// ── DayRow ────────────────────────────────────────────────────────────────────
function DayRow({ dayLabel, times, onAddTime, onRemoveTime, onRemoveDay, showTrash, isOnly }) {
  const [openAdd, setOpenAdd] = useState(false)
  const addRef = useRef(null)

  useEffect(() => {
    if (!openAdd) return
    const handler = (e) => {
      if (addRef.current && !addRef.current.contains(e.target)) setOpenAdd(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openAdd])

  return (
    <div style={{ background: colors.bgSecondary, borderRadius: radius.primary, padding: 16 }}>
      {/* Day header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ flex: 1, fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, color: colors.primary, margin: 0, lineHeight: 1.5 }}>
          {dayLabel}
        </p>
        {showTrash && !isOnly && (
          <button
            onMouseDown={onRemoveDay}
            style={{
              background: 'none', border: 'none', padding: 8, cursor: 'pointer',
              color: '#BC4338', borderRadius: '50%', display: 'flex', alignItems: 'center',
              transition: 'background 0.1s',
            }}
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {times.map(t => (
          <Chip
            key={t}
            label={t}
            selected={false}
            onRemove={() => onRemoveTime(t)}
          />
        ))}
        <div ref={addRef} style={{ position: 'relative' }}>
          <Chip
            label="Add time"
            selected={openAdd}
            onClick={() => setOpenAdd(v => !v)}
          />
          {openAdd && (
            <TimeDropdown
              existingTimes={times}
              onSelect={(t) => { onAddTime(t); setOpenAdd(false) }}
              anchorRef={addRef}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── EditTemplateScreen ────────────────────────────────────────────────────────
export default function EditTemplateScreen({ owner, startDate, sublabel, onSave, onBack, initialSameSchedule = false }) {
  const isDesktop = useIsDesktop()
  // Init selected days and per-day schedules from owner template
  const initSelectedDays = () => [...new Set(owner.template.map(t => t.day))]
  const initSchedules = () => {
    const map = {}
    owner.template.forEach(({ day, time }) => {
      if (!map[day]) map[day] = []
      if (!map[day].includes(time)) map[day].push(time)
    })
    return map
  }

  const [selectedDays, setSelectedDays] = useState(initSelectedDays)
  const [sameSchedule, setSameSchedule]  = useState(initialSameSchedule)
  const [daySchedules, setDaySchedules]  = useState(initSchedules)
  const [sharedTimes, setSharedTimes]    = useState(() => {
    if (!initialSameSchedule) return []
    const allTimes = [...new Set(owner.template.map(t => t.time))]
    return allTimes.sort((a, b) => timeToMins(a) - timeToMins(b))
  })
  const [errorDays, setErrorDays]        = useState(null)
  const [showConfirm, setShowConfirm]    = useState(false)
  const [pendingData, setPendingData]    = useState(null)
  const [showSuccess, setShowSuccess]    = useState(false)

  const resolvedSchedules = sameSchedule
    ? Object.fromEntries(selectedDays.map(d => [d, sharedTimes]))
    : daySchedules
  const hasChanges = computeTemplateChanges(owner.template, selectedDays, resolvedSchedules).length > 0
    || sameSchedule !== initialSameSchedule

  const handleSave = () => {
    if (sameSchedule) {
      if (!sharedTimes.length) { setErrorDays(selectedDays); return }
    } else {
      const empty = selectedDays.filter(d => !(daySchedules[d]?.length))
      if (empty.length) { setErrorDays(empty); return }
    }
    setErrorDays(null)
    const data = { selectedDays, daySchedules: resolvedSchedules, sameSchedule }
    setPendingData(data)
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    setShowConfirm(false)
    onSave?.(pendingData)
    setShowSuccess(true)
  }

  // Ordered selection by week
  const orderedSelected = DAYS.filter(d => selectedDays.includes(d.key))

  const toggleDay = (key) => {
    if (selectedDays.includes(key)) {
      if (selectedDays.length === 1) return
      setSelectedDays(prev => prev.filter(d => d !== key))
    } else {
      setSelectedDays(prev => [...prev, key])
      if (!daySchedules[key]) {
        setDaySchedules(prev => ({ ...prev, [key]: [] }))
      }
    }
  }

  const addTime = (dayKey, time) => {
    const sorted = (arr) => [...arr, time].sort((a, b) => timeToMins(a) - timeToMins(b))
    if (sameSchedule) {
      setSharedTimes(prev => sorted(prev))
    } else {
      setDaySchedules(prev => ({ ...prev, [dayKey]: sorted(prev[dayKey] || []) }))
    }
  }

  const removeTime = (dayKey, time) => {
    if (sameSchedule) {
      setSharedTimes(prev => prev.filter(t => t !== time))
    } else {
      setDaySchedules(prev => ({ ...prev, [dayKey]: (prev[dayKey] || []).filter(t => t !== time) }))
    }
  }

  const removeDay = (key) => {
    if (selectedDays.length === 1) return
    setSelectedDays(prev => prev.filter(d => d !== key))
  }

  const startDateStr = fmtStartDate(startDate)

  const formBody = (
    <div style={{ padding: '0 16px' }}>

      {/* What days? */}
      <div style={{ padding: '24px 0 16px' }}>
        <p style={{ ...tx(16, 700, colors.primary), lineHeight: 1.5, marginBottom: 4 }}>
          What days?
        </p>
        <div style={{ display: 'flex', gap: 4 }}>
          {DAYS.map(({ key, label }) => {
            const chipLabel = isDesktop ? label.slice(0, 3) : label.slice(0, 1)
            return (
              <div key={key} style={{ flex: 1 }}>
                <Chip
                  label={chipLabel}
                  selected={selectedDays.includes(key)}
                  onClick={() => toggleDay(key)}
                  style={{ minWidth: 0, width: '100%', padding: '8px 4px' }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Same schedule toggle */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 56, padding: '8px 0' }}>
        <p style={{ ...tx(16, 700, colors.primary), flex: 1, margin: 0, lineHeight: 1.5 }}>
          Use the same schedule for all days
        </p>
        <button
          onMouseDown={() => {
            if (!sameSchedule) {
              // Turning ON: merge all selected days' times into sharedTimes
              const allTimes = [...new Set(
                selectedDays.flatMap(d => daySchedules[d] || [])
              )].sort((a, b) => timeToMins(a) - timeToMins(b))
              setSharedTimes(allTimes)
            } else {
              // Turning OFF: apply sharedTimes to every selected day
              setDaySchedules(prev => {
                const next = { ...prev }
                selectedDays.forEach(d => { next[d] = [...sharedTimes] })
                return next
              })
            }
            setSameSchedule(v => !v)
          }}
          style={{
            position: 'relative', width: 56, height: 32, borderRadius: 99999,
            background: sameSchedule ? colors.link : colors.bgTertiary,
            border: 'none', cursor: 'pointer', flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 4,
            left: sameSchedule ? 28 : 4,
            width: 24, height: 24, borderRadius: '50%',
            background: colors.white,
            transition: 'left 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* Day schedule rows */}
      <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sameSchedule ? (() => {
          const labels = orderedSelected.map(d => d.label)
          const mergedLabel = labels.length <= 1
            ? labels[0] ?? ''
            : labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1]
          return (
            <DayRow
              key="merged"
              dayLabel={mergedLabel}
              times={sharedTimes}
              onAddTime={(t) => addTime(null, t)}
              onRemoveTime={(t) => removeTime(null, t)}
              showTrash={false}
              isOnly={true}
            />
          )
        })() : orderedSelected.map(({ key, label }) => (
          <DayRow
            key={key}
            dayLabel={label}
            times={daySchedules[key] || []}
            onAddTime={(t) => addTime(key, t)}
            onRemoveTime={(t) => removeTime(key, t)}
            onRemoveDay={() => removeDay(key)}
            showTrash={true}
            isOnly={selectedDays.length === 1}
          />
        ))}
      </div>

      {/* Start date (read-only) */}
      <div style={{ padding: '16px 0 24px' }}>
        <p style={{ ...tx(16, 700, colors.primary), margin: '0 0 4px', lineHeight: 1.5 }}>
          Start date: {startDateStr}
        </p>
        <p style={{ ...tx(14, 400, colors.tertiary), margin: 0, lineHeight: 1.25 }}>
          Changes take effect starting on {startDateStr} and we'll notify {owner.name} of the change.
        </p>
      </div>

      {/* Actions */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
        {errorDays && (
          <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, paddingBottom: 8 }}>
            <ErrorBanner emptyDays={errorDays} onDismiss={() => setErrorDays(null)} />
          </div>
        )}
        {showSuccess && (
          <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, paddingBottom: 8 }}>
            <SuccessBanner onDismiss={() => setShowSuccess(false)} />
          </div>
        )}
        <Button variant="primary" fullWidth disabled={!hasChanges} onClick={handleSave}>
          Save changes
        </Button>
        <Button variant="default" fullWidth onClick={onBack}>
          Go back
        </Button>
      </div>

    </div>
  )

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.bgSecondary }}>

      {/* ── Nav header ── */}
      <div style={{
        background: colors.white, borderBottom: `1px solid ${colors.border}`,
        boxShadow: shadows.headerShadow, padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 8, height: 56, flexShrink: 0, zIndex: 3,
      }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={onBack}>
          <BackIcon />
        </div>
        <p style={{ ...tx(16, 700, colors.primary), margin: 0 }}>Edit schedule template</p>
      </div>

      {isDesktop ? (
        // ── Desktop: sidebar + form panel ────────────────────────────────
        <div className="hide-scrollbar" style={{
          flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start',
          maxWidth: 1140, margin: '0 auto', width: '100%',
          gap: 24, padding: '24px 24px 0', boxSizing: 'border-box',
        }}>
          {/* Sidebar — scrolls with outer container */}
          <div style={{ width: 360, flexShrink: 0, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <UserInfoCard owner={owner} />
            <TemplateCard owner={owner} />
          </div>

          {/* Form panel — sticky */}
          <div style={{
            flex: 1, minWidth: 0, background: colors.white,
            borderRadius: radius.primary,
            position: 'sticky', top: 0,
            height: 'calc(100vh - 56px)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            {/* Panel header */}
            <div style={{ padding: '24px 16px 16px', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
              <p style={{ ...tx(20, 700, colors.primary), lineHeight: 1.25, margin: '0 0 4px' }}>
                Edit schedule template
              </p>
              <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.5, margin: 0 }}>
                {sublabel || 'Changes here affect all future weeks.'}
              </p>
            </div>
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              {formBody}
            </div>
          </div>
        </div>
      ) : (
        // ── Mobile: sidebar cards + form in single scroll ────────────────
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
            {/* Sidebar cards */}
            <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <UserInfoCard owner={owner} />
              <TemplateCard owner={owner} />
            </div>

            {/* Edit form panel */}
            <div style={{ margin: 16, background: colors.white, borderRadius: radius.primary }}>
              <div style={{ padding: '24px 16px 16px', borderBottom: `1px solid ${colors.border}` }}>
                <p style={{ ...tx(20, 700, colors.primary), lineHeight: 1.25, margin: '0 0 4px' }}>
                  Edit schedule template
                </p>
                <p style={{ ...tx(14, 400, colors.secondary), lineHeight: 1.5, margin: 0 }}>
                  {sublabel || 'Changes here affect all future weeks.'}
                </p>
              </div>
              {formBody}
            </div>
          </div>
        </div>
      )}

    </div>

    {showConfirm && pendingData && (
      isDesktop
        ? <ConfirmModal
            changes={computeTemplateChanges(owner.template, pendingData.selectedDays, pendingData.daySchedules)}
            ownerName={owner.name}
            onConfirm={handleConfirm}
            onClose={() => setShowConfirm(false)}
          />
        : <ConfirmSheet
            changes={computeTemplateChanges(owner.template, pendingData.selectedDays, pendingData.daySchedules)}
            ownerName={owner.name}
            onConfirm={handleConfirm}
            onClose={() => setShowConfirm(false)}
          />
    )}
    </>
  )
}
