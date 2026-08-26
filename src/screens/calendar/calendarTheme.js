/**
 * Calendar visual system — port of the POC's `v1Tokens.ts`.
 *
 * Source: roverdotcom/web @ origin/ai-pilot-web-calendar
 *   src/frontend/react-lib/src/pages/account/NewCalendarPage/v1Tokens.ts
 *
 * The POC read every colour off Kibble's `Color` object; this repo's
 * `palette` is the same Kibble scale, so all of them map 1:1 (verified
 * across neutral / yellow / red / blue). The two stripe patterns and the
 * text halo are the POC's own generated CSS, ported function-for-function
 * so the −45° bar direction and 15-bar density match RxN exactly — that
 * parity is the whole point of the pattern, per the source's comment
 * pointing at `reactNativeApp/.../utils.tsx:183-204`.
 *
 * Also holds the sub-14px type sizes the calendar needs. `textStyles`
 * bottoms out at 14px, and the POC's day cells run 11-13px, so those live
 * here as a local const rather than being forced up a step — precedent
 * `TabBar.jsx:44`, which hardcodes 10px for the same reason.
 */
import { palette, typography } from '../../tokens'
import { DAY_STATE } from '../../lib/calendarUtils'

const averta = typography.fontFamily

// ── Colours — v1Tokens.ts:8-32 ───────────────────────────────────────────
export const CAL_COLORS = {
  // Tile fill, aligned with RxN (`reactNativeApp/.../utils.tsx:177-181`).
  someBookingsFill: palette.yellow[200],

  // Chrome colours that are not tile-state concerns.
  primaryBlue: palette.blue[600],
  // Dark neutral border for the non-focused range anchor — quieter than
  // primaryBlue so the focused day reads as the primary signal.
  selectedRangeEdge: palette.neutral[900],
  textPrimary: palette.neutral[900],
  textSecondary: palette.neutral[800],
  textTertiary: palette.neutral[700],
  textMuted: palette.neutral[500],
  border: palette.neutral[400],
  blurbBg: palette.neutral[100],
  cardShadow: '0 1px 4px rgba(27, 31, 35, 0.32)',
  // Inner ring highlighting "today" in the month + mini grids. Reuses the
  // Rover blue so today stays visually aligned with focus.
  todayRing: palette.blue[600],

  // Used by the service editor's "Overbooked" chip (not a tile state).
  overbooked: palette.red[500],
  overbookedBg: palette.red[100],

  // The editor's per-service occupancy dot (ServiceRow.tsx:83-85). Amber while
  // bookings still fit the capacity, red once occupancy meets or exceeds it.
  occupancyDot: palette.yellow[200],
  occupancyDotFull: palette.red[200],
}

// RxN's striped background paints 15 equal-width bars at -45deg alternating
// two colours. v1Tokens.ts:38-49.
function buildRxnStripe(colorA, colorB) {
  const stripes = 15
  const barPct = 100 / stripes
  const stops = []
  for (let i = 0; i < stripes; i += 1) {
    const color = i % 2 === 0 ? colorA : colorB
    const start = i * barPct
    stops.push(`${color} ${start}%`, `${color} ${start + barPct}%`)
  }
  return `linear-gradient(-45deg, ${stops.join(', ')})`
}

/** `fullyBooked` — red stripes, matching RxN's FULLY_BOOKED_BACKGROUND. */
export const FULLY_BOOKED_PATTERN = buildRxnStripe(palette.red[300], palette.red[200])
/** `notAvailable` — neutral stripes, matching RxN's UNAVAILABLE_BACKGROUND. */
export const NOT_AVAILABLE_PATTERN = buildRxnStripe(palette.neutral[200], palette.neutral.white)

// 4-direction 1px halo. The glyph itself stays the same weight, but the
// diagonal stripes underneath stop cutting into the digit, so 44px tiles
// stay legible at glance-read speed. v1Tokens.ts:66-70.
function buildTextHalo(color) {
  return [`0 1px 0 ${color}`, `0 -1px 0 ${color}`, `1px 0 0 ${color}`, `-1px 0 0 ${color}`].join(', ')
}

// `fullyBooked` haloes with the lighter red so it reads as a soft glow
// against the stripe's brighter band, not a hard outline; `notAvailable`
// haloes white to blend with its white band.
export const FULLY_BOOKED_TEXT_HALO = buildTextHalo(palette.red[200])
export const NOT_AVAILABLE_TEXT_HALO = buildTextHalo(palette.neutral.white)

/** Day-state → tile background. v1Tokens/V1DayCell.tsx:85-98. */
export function backgroundForState(state) {
  if (state === DAY_STATE.SOME_BOOKINGS) return CAL_COLORS.someBookingsFill
  if (state === DAY_STATE.FULLY_BOOKED) return FULLY_BOOKED_PATTERN
  if (state === DAY_STATE.NOT_AVAILABLE) return NOT_AVAILABLE_PATTERN
  return 'transparent'
}

/** Halo for the striped states only. V1DayCell.tsx:103-107. */
export function textHaloForState(state) {
  if (state === DAY_STATE.FULLY_BOOKED) return FULLY_BOOKED_TEXT_HALO
  if (state === DAY_STATE.NOT_AVAILABLE) return NOT_AVAILABLE_TEXT_HALO
  return undefined
}

// ── Dimensions — v1Tokens.ts:82-98 ───────────────────────────────────────
// `railWidth` is the POC's `rightRailWidth`, renamed. The token name is a
// leftover: the comment on it says the rail moved to the left in both
// desktop layouts, and the month layout does use it as the *first* grid
// column (`NewCalendarPageMonth.tsx:38`). Porting the layout, not the name.
// The POC's `leftRailWidth: '375px'` was already dead there and is dropped.
export const CAL_DIMS = {
  railWidth: 320,
  pageGap: 56,
  pagePadX: 40,
  pagePadY: 24,
  miniDayTileSize: 44,
  eventAvatarSize: 48,
  checkboxSize: 24,
  // Month-grid metrics, NewCalendarPageMonth.tsx:512-513.
  gridRowMin: 96,
  gridGap: 4,
  // Kibble's `borderWidth.primary` / `radii.primary` / `radii.secondary`,
  // resolved to px. V1DayCell.tsx:117-131.
  cellBorderWidth: 2,
  cellRadius: 8,
  gridCellRadius: 4,
}

// ── Type sizes below the `textStyles` floor ──────────────────────────────
// PROTOTYPE-ONLY as tokens; the px values are the POC's.
export const CAL_TYPE = {
  // Day-of-week header — NewCalendarPageMonth.tsx:481-482.
  dowHeader: { fontFamily: averta, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' },
  // Day number — NewCalendarPageMonth.tsx:578.
  dayNumber: { fontFamily: averta, fontWeight: 600, fontSize: 13, lineHeight: 1.25 },
  // Booking stub / "+N more" — Kibble `Text size="50"`.
  stub: { fontFamily: averta, fontWeight: 400, fontSize: 11, lineHeight: 1.35 },
  // The mini-month / week-strip day-of-week letter. 12px semibold, and
  // deliberately *not* the uppercase-plus-tracking `dowHeader` above: the mini
  // grids render single letters, so there is nothing to letter-space
  // (V1MiniMonthCalendar.tsx:192-200, CompactWeekStrip.tsx:175-183).
  miniDowHeader: { fontFamily: averta, fontWeight: 600, fontSize: 12, lineHeight: 1 },
}
