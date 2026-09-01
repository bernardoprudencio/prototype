import React from 'react'
import { colors, radius } from '../tokens'

/**
 * Switch — port of Kibble's switch control.
 *
 * Production has no standalone `Switch` component: the toggle visuals live
 * inside `SwitchField`'s icon slot at
 * `kibble/forms/fields/SwitchField/SwitchFieldIcon.tsx`. This file is that
 * control extracted so it can be used on its own; `SwitchField` composes it.
 *
 * Geometry and colours are the real Kibble values, not the guessed ones the
 * previous `OnOffSwitch` shipped:
 *   track  56x32, 2px solid border, borderRadius round   (SwitchFieldIcon.tsx:62-67)
 *   knob   24x24, top 4, left 4 -> 28                    (SwitchFieldIcon.tsx:87, 101-108)
 *          `top` is deliberately 4 here, NOT Kibble's 2. Kibble measures that
 *          2 from inside the track's 2px border, because there the border is on
 *          the knob's own positioning parent. This port puts the border on the
 *          <input> sibling instead, so the knob's containing block is the full
 *          56x32 outer span and the centred value is (32 - 24) / 2 = 4. The
 *          literal is used rather than top:'50%' + translateY(-50%) because the
 *          knob animates `left`, and a transform risks a compositing seam.
 *   motion `left 150ms ease-in-out`                      (SwitchFieldIcon.tsx:110,
 *                                       ANIMATION_DURATION_MS SwitchField.common.tsx:21)
 *   mt     -2px, to align the 32px control to the label  (SwitchFieldIcon.tsx:73)
 *
 * Kibble colours all map onto existing tokens:
 *   off      transparent track / #C9CFD4 border / #404347 knob
 *   on       #404347 track + border / #FFFFFF knob
 *   hover    off -> #767C82 border + #1F2124 knob; on -> #1F2124 track + border
 *   disabled #F4F5F6 track / #E6E8EB border / #9EA5AC knob
 * One mismatch worth naming: Kibble's disabled border is #E6E8EB, which is our
 * `colors.bgTertiary` — `colors.disabledBorder` is #E8EBED and does NOT match,
 * so it is deliberately not used here.
 *
 * Disabled is NOT the `disabled` attribute. Kibble keeps the input focusable and
 * reverts `e.target.checked` instead, a deliberate a11y choice documented at
 * `SwitchFieldIcon.tsx:30-37`. Ported as-is.
 *
 * `hovered` is a prop rather than a `:hover` rule because this repo styles
 * inline only; `SwitchField` owns the hover state for the whole row and passes
 * it down, so the knob and the row tint change together as they do in Kibble.
 *
 * Props:
 *   checked          bool
 *   onChange         (nextChecked) => void
 *   disabled         bool
 *   hovered          bool     — row-level hover, supplied by SwitchField
 *   id               string   — paired with SwitchField's <label htmlFor>
 *   ariaLabel        string   — standalone use only; inside SwitchField the
 *                              visible <label> is the accessible name
 *   ariaDescribedBy  string   — SwitchField's secondary-label id
 */
export default function Switch({
  checked = false,
  onChange,
  disabled = false,
  hovered = false,
  id,
  ariaLabel,
  ariaDescribedBy,
}) {
  const hot = hovered && !disabled

  let trackFill, trackBorder, knobFill, glyphFill
  if (disabled) {
    trackFill   = colors.disabledBg
    trackBorder = colors.bgTertiary
    knobFill    = colors.disabledText
    glyphFill   = colors.disabledBg
  } else if (checked) {
    trackFill   = hot ? colors.primary : colors.secondary
    trackBorder = trackFill
    knobFill    = colors.white
    glyphFill   = colors.primary
  } else {
    trackFill   = 'transparent'
    trackBorder = hot ? colors.navigation : colors.borderInteractive
    knobFill    = hot ? colors.primary : colors.secondary
    glyphFill   = colors.white
  }

  return (
    <span style={{
      position: 'relative',
      width: 56, height: 32,
      flexShrink: 0,
      marginTop: -2,
      display: 'inline-block',
    }}>
      <input
        type="checkbox"
        role="switch"
        id={id}
        checked={checked}
        readOnly={disabled}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        // Kibble reverts the value rather than setting `disabled`, so the
        // control stays focusable for screen readers. SwitchFieldIcon.tsx:30-37.
        onChange={e => {
          if (disabled) { e.target.checked = checked; return }
          onChange?.(e.target.checked)
        }}
        // Stops SwitchField's whole-row handler re-firing .click() on this same
        // input and double-toggling. SwitchFieldIcon.tsx:61.
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          margin: 0, padding: 0,
          appearance: 'none', WebkitAppearance: 'none',
          borderRadius: radius.round,
          border: `2px solid ${trackBorder}`,
          background: trackFill,
          outline: 'none',
          cursor: 'inherit',
          transition: 'background 150ms ease-in-out, border-color 150ms ease-in-out',
        }}
      />
      <span
        // Sits above the input in paint order, so it must not eat the click.
        style={{
          position: 'absolute',
          top: 4,
          left: checked ? 28 : 4,
          width: 24, height: 24,
          borderRadius: '50%',
          background: knobFill,
          transition: 'left 150ms ease-in-out',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Kibble puts check-small.svg / xmark-small.svg in the knob at 24px
            (SwitchFieldIcon.tsx:113-132). The shared icons in assets/icons.jsx
            hardcode 16px and a fixed fill, so the same paths are inlined here
            with token fills. They render at 16px inside the 24px knob because
            our paths are full-bleed in a 32 viewBox where Kibble's *-small
            assets carry their own padding — 24px would read oversized. */}
        {checked ? (
          <svg width="16" height="16" viewBox="0 0 32 32" fill={glyphFill} aria-hidden="true">
            <path d="M26.191 4.412a1 1 0 1 1 1.618 1.176l-16 22a1 1 0 0 1-1.516.12l-6-6a1 1 0 1 1 1.414-1.415l5.173 5.172L26.19 4.412z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 32 32" fill={glyphFill} aria-hidden="true">
            <path d="M17.414 16l7.293-7.293a1 1 0 0 0-1.414-1.414L16 14.586 8.707 7.293a1 1 0 0 0-1.414 1.414L14.586 16l-7.293 7.293a1 1 0 0 0 1.414 1.414L16 17.414l7.293 7.293a1 1 0 0 0 1.414-1.414L17.414 16z" />
          </svg>
        )}
      </span>
    </span>
  )
}
