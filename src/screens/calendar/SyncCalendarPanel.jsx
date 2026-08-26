import React, { useState } from 'react'
import { colors, radius, textStyles } from '../../tokens'
import { palette } from '../../tokens/tokens'
import { useIsWide } from '../../lib/useMediaQuery'
import { SYNC } from '../../data/calendarCopy'
import { CALENDAR_ICAL_URL } from '../../data/calendarData'
import { CAL_COLORS } from './calendarTheme'
import Button from '../../components/Button'
import Chip from '../../components/Chip'
import CalendarPanelShell from './CalendarPanelShell'

/**
 * Port of `components/SyncCalendarPanel.tsx` — subscribe an external calendar
 * to a feed of this sitter's requests, bookings, and meet & greets.
 *
 * Source: roverdotcom/web @ origin/ai-pilot-web-calendar
 *   .../NewCalendarPage/components/SyncCalendarPanel.tsx
 *
 * The POC is itself a port — of the legacy jQuery `SyncCalendarModal` in
 * `calendar_view.js` — and it is emphatic about preserving that form's URL
 * contract so existing iCal/Google subscriptions round-trip: one `type=` pair
 * per selected include type, in a fixed order, then a single `display_type=`
 * (`:47-56`). `buildSyncUrls` is ported unchanged for the same reason, even
 * though nothing here can resolve the result.
 *
 * The three URLs it builds (`:59-70`): `webcal:` for the OS calendar app,
 * `http:` for manual paste, and Google's add-by-URL endpoint wrapping the
 * `http:` one. The two buttons are real anchors, as they are in the POC, where
 * Kibble's Button renders an anchor when handed an `href`.
 *
 * PROTOTYPE-ONLY: the iCal URL. Production injects a signed, per-sitter one
 * through `Rover.pages.newCalendar.iCalUrl`; `CALENDAR_ICAL_URL` reproduces the
 * shape with a stand-in token.
 */

// `ALL_INCLUDE_TYPES` (:45) and the option order at `:130-139`.
const INCLUDE_OPTIONS = [
  { value: 'unbooked', label: SYNC.requests },
  { value: 'booked', label: SYNC.bookings },
  { value: 'meet-and-greet', label: SYNC.meetAndGreets },
]

const DISPLAY_OPTIONS = [
  { value: 'duration', label: SYNC.showFullDuration },
  { value: 'pick_up_drop_off', label: SYNC.showPickupDropoff },
]

// `buildQueryString` (:51-56). Order follows the option list, not the click
// order, so the string is stable for a given selection.
function buildQueryString(types, displayType) {
  const parts = types.map((t) => `type=${encodeURIComponent(t)}`)
  parts.push(`display_type=${encodeURIComponent(displayType)}`)
  return parts.join('&')
}

const GOOGLE_ADD_BY_URL_PREFIX = 'https://www.google.com/calendar/render?cid='

export function buildSyncUrls(iCalUrl, types, displayType) {
  const base = `${iCalUrl}?${buildQueryString(types, displayType)}`
  const httpCalUrl = `http:${base}`
  return {
    webCalUrl: `webcal:${base}`,
    httpCalUrl,
    addToGoogleUrl: `${GOOGLE_ADD_BY_URL_PREFIX}${encodeURIComponent(httpCalUrl)}`,
  }
}

// `groupLabel` + `showLabel` on Kibble's FilterChipGroup renders a visible
// legend above the chips and names the group for assistive tech; the prototype
// has no chip-group primitive, so the fieldset is written out here.
function ChipGroup({ label, options, isSelected, onSelect, multi }) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend style={{ ...textStyles.text100Semibold, color: colors.primary, padding: 0, marginBottom: 8 }}>
        {label}
      </legend>
      <div
        role={multi ? 'group' : 'radiogroup'}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        {options.map((opt) => {
          const selected = isSelected(opt.value)
          return (
            <div
              key={opt.value}
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={selected}
              aria-label={opt.label}
            >
              <Chip
                label={opt.label}
                size="small"
                selected={selected}
                checkmark={selected}
                // The single-select group is `isDeselectable={false}` (:194),
                // so its live chip has nothing to do on click.
                onClick={!multi && selected ? undefined : () => onSelect(opt.value)}
              />
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function SyncCalendarPanel({ isOpen, onClose }) {
  const isWide = useIsWide()

  // Defaults mirror the legacy `CalendarSyncForm`: everything included,
  // duration display (`:77-78`).
  const [includeTypes, setIncludeTypes] = useState(INCLUDE_OPTIONS.map((o) => o.value))
  const [displayType, setDisplayType] = useState('duration')
  const [copyState, setCopyState] = useState('idle')

  const { webCalUrl, httpCalUrl, addToGoogleUrl } = buildSyncUrls(
    CALENDAR_ICAL_URL, includeTypes, displayType,
  )

  const toggleInclude = (value) => {
    setIncludeTypes((prev) => {
      const next = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : INCLUDE_OPTIONS.map((o) => o.value).filter((v) => prev.includes(v) || v === value)
      return next
    })
    setCopyState('idle')
  }

  // `handleCopy` (:85-96) — the clipboard API can be absent (insecure context)
  // or refused, and both land on the same manual-copy message.
  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(httpCalUrl)
        setCopyState('copied')
      } else {
        setCopyState('error')
      }
    } catch {
      setCopyState('error')
    }
  }

  // `handleFocusSelect` / `handleClickSelect` (:101-108) — the legacy view's
  // `selectAll`, so the URL is one keystroke from copied once focused.
  const selectAll = (e) => e.currentTarget.select?.()

  return (
    <CalendarPanelShell
      isOpen={isOpen}
      title={SYNC.title}
      width={560}
      onClose={onClose}
      footer={(
        <Button variant="default" size="small" fullWidth onClick={onClose}>
          {SYNC.close}
        </Button>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ChipGroup
          multi
          label={SYNC.includeHeading}
          options={INCLUDE_OPTIONS}
          isSelected={(v) => includeTypes.includes(v)}
          onSelect={toggleInclude}
        />
        <ChipGroup
          label={SYNC.displayHeading}
          options={DISPLAY_OPTIONS}
          isSelected={(v) => v === displayType}
          onSelect={(v) => { setDisplayType(v); setCopyState('idle') }}
        />

        {/* `flexDirection={['column', 'row']}` (:203) — stacked on a phone,
            side by side once there is room. */}
        <div style={{
          display: 'flex', gap: 8,
          flexDirection: isWide ? 'row' : 'column',
        }}>
          <Button variant="primary" size="small" href={webCalUrl} fullWidth={!isWide}>
            {SYNC.addToICal}
          </Button>
          <Button
            variant="primary"
            size="small"
            href={addToGoogleUrl}
            hrefTarget="_blank"
            rel="noopener noreferrer"
            fullWidth={!isWide}
          >
            {SYNC.addToGoogle}
          </Button>
        </div>

        <div>
          {/* The input takes its accessible name from this visible line
              (`aria-labelledby`, :253-259) so the two never disagree. */}
          <div
            id="sync-calendar-url-help"
            style={{ ...textStyles.text100, color: CAL_COLORS.textSecondary, marginBottom: 8 }}
          >
            {SYNC.copyPrompt}
          </div>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'stretch',
            flexDirection: isWide ? 'row' : 'column',
          }}>
            <input
              readOnly
              value={httpCalUrl}
              aria-labelledby="sync-calendar-url-help"
              onFocus={selectAll}
              onClick={selectAll}
              style={{
                ...textStyles.text100,
                flex: '1 1 auto', minWidth: 0,
                padding: '8px 12px',
                color: CAL_COLORS.textPrimary,
                // A soft neutral fill so it reads as a copyable value rather
                // than an editable field (:264-268).
                background: palette.neutral[100],
                border: `1px solid ${CAL_COLORS.border}`,
                borderRadius: radius.secondary,
              }}
            />
            <Button variant="flat" size="small" onClick={handleCopy}>
              {copyState === 'copied' ? SYNC.copied : SYNC.copy}
            </Button>
          </div>
          {/* Permanent in the DOM so each transition is announced (:279-294). */}
          <div role="status" aria-live="polite" style={{ marginTop: 4 }}>
            {copyState === 'copied' && (
              <span style={{ ...textStyles.text100, color: CAL_COLORS.textPrimary }}>
                {SYNC.copiedAnnouncement}
              </span>
            )}
            {copyState === 'error' && (
              <span style={{ ...textStyles.text100, color: colors.destructive }}>
                {SYNC.copyFailed}
              </span>
            )}
          </div>
        </div>
      </div>
    </CalendarPanelShell>
  )
}
