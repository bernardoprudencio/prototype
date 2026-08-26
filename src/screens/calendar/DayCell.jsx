import React, { useState } from 'react'
import { DAY_STATE, composeDayCellAriaLabel, dayStateToAriaPhrase } from '../../lib/calendarUtils'
import { CAL_COLORS, CAL_DIMS, backgroundForState, textHaloForState } from './calendarTheme'

/**
 * One day tile — port of the POC's `V1DayCell.tsx`.
 *
 * Source: roverdotcom/web @ origin/ai-pilot-web-calendar
 *   src/frontend/react-lib/src/pages/account/NewCalendarPage/layouts/v1/V1DayCell.tsx
 *
 * Three sizes: `mini` and `tile` are the 44px square used by the mini-month
 * and the compact week strip; `grid` is the 96px-floor month cell that also
 * renders booking stubs. Everything below — the border precedence, the
 * reserved-border-width trick, the past-day dimming, the halo suppression
 * rules, the hidden state mirror — is the POC's, and each of those rules
 * exists because of a bug it fixed, so they port verbatim.
 *
 * Two things are dropped: Kibble's `LoadingShimmer` (`isLoading`) has no
 * meaning here — the prototype's data is synchronous, so no loading state
 * exists — and `A11yHiddenBox` becomes an inline visually-hidden span.
 */

// V1DayCell.tsx:110-131. `mini`/`tile` keep the literal 44px for RxN parity.
const SIZE = {
  mini: { minHeight: CAL_DIMS.miniDayTileSize, borderRadius: CAL_DIMS.cellRadius, padding: 0 },
  tile: { minHeight: CAL_DIMS.miniDayTileSize, borderRadius: CAL_DIMS.cellRadius, padding: 0 },
  grid: { minHeight: 80, borderRadius: CAL_DIMS.gridCellRadius, padding: 6 },
}

const srOnly = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0,
}

export default function DayCell({
  state = DAY_STATE.FULLY_AVAILABLE,
  isSelected,
  isRangeStart,
  isRangeEnd,
  isInRange,
  isToday,
  isPast,
  date,
  bookingCount,
  bookingLabels,
  size = 'mini',
  onClick,
  ariaLabel,
  children,
  role,
  tabIndex,
  buttonRef,
  onKeyDown,
}) {
  // `:focus-visible` can't be expressed inline, and the POC is emphatic that
  // the ring is never removed. Reading `matches(':focus-visible')` on focus
  // gives the same semantics with no stylesheet: a mouse click doesn't ring,
  // a keyboard arrival does.
  const [showFocusRing, setShowFocusRing] = useState(false)

  const sizeStyle = SIZE[size]
  const isGrid = size === 'grid'
  const isRangeEndpoint = isRangeStart || isRangeEnd

  // Always reserve the border width — only its colour changes. Without this,
  // going from transparent to a 2px coloured border shifts the cell's box by
  // 4px, which ripples through the month grid's `minmax(96px, 1fr)` rows and
  // visibly moves neighbouring rows when you select a "+N more" day.
  let borderColor = 'transparent'
  if (isSelected) {
    // The focused day wins even when it is also a range endpoint — the blue
    // border means exactly one thing: this is the day driving the view.
    borderColor = CAL_COLORS.primaryBlue
  } else if (isRangeEndpoint || isInRange) {
    // Endpoints and interior cells share one quieter dark border, so the
    // range reads as a bracket without competing with the focused day.
    borderColor = CAL_COLORS.selectedRangeEdge
  }

  // Suppressed on past days: a stripe-coloured halo behind an already-dimmed
  // numeral looks like a rendering glitch rather than an accessibility aid.
  const textHalo = isPast ? undefined : textHaloForState(state)

  const style = {
    width: '100%',
    // `grid` cells live under `gridAutoRows: minmax(96px, 1fr)`, and that
    // parent floor is meant to be the only thing deciding row height. These
    // three rules are what make it so: `minHeight: 0` lets the cell shrink
    // below its own content, `height: 100%` fills whatever the track
    // resolved to, and `overflow: hidden` clips the trailing stub instead of
    // pushing the row taller than its peers.
    minHeight: isGrid ? 0 : sizeStyle.minHeight,
    ...(isGrid ? { height: '100%', overflow: 'hidden' } : {}),
    boxSizing: 'border-box',
    borderRadius: sizeStyle.borderRadius,
    padding: sizeStyle.padding,
    background: backgroundForState(state),
    border: `${CAL_DIMS.cellBorderWidth}px solid ${borderColor}`,
    color: isPast ? CAL_COLORS.textMuted : CAL_COLORS.textPrimary,
    // Past month cells render stubs and "+N more", which `textMuted` alone
    // doesn't reach — dimming the whole cell washes stubs, digit and fill out
    // together. Mini/tile sizes render no children, so they stay on the
    // colour override only.
    ...(isPast && isGrid ? { opacity: 0.45 } : {}),
    ...(textHalo ? { textShadow: textHalo } : {}),
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: isGrid ? 'column' : 'row',
    alignItems: isGrid ? 'flex-start' : 'center',
    justifyContent: isGrid ? 'flex-start' : 'center',
    position: 'relative',
    ...(showFocusRing
      ? { outline: `${CAL_DIMS.cellBorderWidth}px solid ${CAL_COLORS.primaryBlue}`, outlineOffset: CAL_DIMS.cellBorderWidth }
      : {}),
  }

  // Prefer the composed label whenever the caller hands us a date; an
  // explicit `ariaLabel` still wins, for callers that pass their own.
  const composed = date
    ? composeDayCellAriaLabel({
        date, state, bookingCount, bookingLabels,
        isToday, isSelected, isRangeStart, isRangeEnd, isInRange,
      })
    : undefined
  const effectiveAriaLabel = composed ?? ariaLabel

  // Visually-hidden mirror of the state phrase. Redundant with the
  // aria-label on purpose — aria-label owns the accessible name, the mirror
  // is what inner-text walkers see.
  const stateMirror = dayStateToAriaPhrase(state)
  const hiddenMirror = stateMirror ? <span style={srOnly}>{stateMirror}</span> : null

  const inner = (
    <>
      {children}
      {hiddenMirror}
    </>
  )

  // The `min-height: 0` on the wrapper is the other half of the decoupling
  // above: without it the gridcell keeps an implicit `min-height: auto`
  // floor, which re-introduces the content-driven row stretch.
  const wrapperStyle = isGrid
    ? { width: '100%', display: 'block', minHeight: 0, height: '100%' }
    : { width: '100%', display: 'block' }

  if (onClick) {
    const button = (
      <button
        type="button"
        ref={buttonRef}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onFocus={(e) => setShowFocusRing(e.currentTarget.matches(':focus-visible'))}
        onBlur={() => setShowFocusRing(false)}
        aria-label={effectiveAriaLabel || undefined}
        aria-current={isSelected ? 'date' : undefined}
        tabIndex={typeof tabIndex === 'number' ? tabIndex : undefined}
        data-today={isToday ? 'true' : undefined}
        style={{ ...style, cursor: 'pointer' }}
      >
        {inner}
      </button>
    )
    // Inside a role="grid" the wrapper carries the gridcell role and the
    // inner button stays the focusable element.
    return role ? <div role={role} style={wrapperStyle}>{button}</div> : button
  }

  if (role) {
    return (
      <div role={role} style={wrapperStyle}>
        <div style={style}>{inner}</div>
      </div>
    )
  }
  return <div style={style}>{inner}</div>
}
