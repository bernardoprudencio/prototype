import React, { useId } from 'react'
import { colors, radius, typography } from '../tokens'
import { MinusIcon, PlusIcon } from '../assets/icons'

/**
 * Stepper — port of `@rover/components/src/formFields/Stepper/Stepper.tsx`.
 *
 * A decrement button, a read-only value display, an increment button. The value
 * is never typed into: production renders an `<input readOnly tabIndex={-1}>`
 * with `aria-roledescription="Number field"` and `aria-controls` pointing at it
 * from both buttons, so the buttons are the only tab stops (Stepper.tsx:73-84).
 * That is reproduced exactly, including the `aria-roledescription`.
 *
 * Geometry (Stepper.tsx:53-101):
 *   input   max-width 44px, 16px, centred, transparent, secondary text colour
 *   buttons Kibble `Button size="small"` with `sx={{ p: '1x' }}` — a 4px pad on
 *           all sides around the glyph rather than the usual 8/16, which makes
 *           the round control 36px square at a 24px icon
 *   gaps    4px each side of the input (`mr="1x"` / `ml="1x"`)
 *
 * The buttons are hand-rolled rather than `Button.jsx` because they need
 * `aria-label`, `aria-controls`, and `aria-disabled`, none of which `Button`
 * accepts — the same reason `MonthLayout`'s chevrons are local.
 *
 * Bounds behaviour is production's: at `minValue` the decrement button is
 * disabled, at `maxValue` the increment button is. Note it compares with `===`,
 * so a value already outside the bounds leaves both live.
 */
export default function Stepper({
  value = 0, onIncrement, onDecrement, disabled = false, minValue, maxValue,
}) {
  const inputId = useId()
  const atMin = disabled || minValue === value
  const atMax = disabled || maxValue === value

  const btn = (isDisabled) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: 4,
    borderRadius: radius.round,
    border: `2px solid ${isDisabled ? colors.disabledBorder : colors.borderInteractive}`,
    background: isDisabled ? colors.disabledBg : colors.white,
    cursor: isDisabled ? 'default' : 'pointer',
    flexShrink: 0,
    boxSizing: 'border-box',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <button
        type="button"
        // Stepper.tsx:56-59 — the label carries the current value so a screen
        // reader hears what the press will act on.
        aria-label={`Current value ${value}, decrement`}
        aria-controls={inputId}
        aria-disabled={atMin}
        disabled={atMin}
        onClick={atMin ? undefined : onDecrement}
        style={{ ...btn(atMin), marginRight: 4 }}
      >
        <MinusIcon size={24} color={atMin ? colors.disabledText : colors.secondary} />
      </button>
      <input
        id={inputId}
        tabIndex={-1}
        type="text"
        inputMode="numeric"
        aria-roledescription="Number field"
        value={value}
        readOnly
        disabled={disabled}
        style={{
          maxWidth: 44, width: 44,
          border: 'none', background: 'transparent', appearance: 'none',
          fontFamily: typography.fontFamily,
          fontSize: 16,
          textAlign: 'center',
          color: colors.secondary,
          padding: 0,
        }}
      />
      <button
        type="button"
        aria-label={`Current value ${value}, increment`}
        aria-controls={inputId}
        aria-disabled={atMax}
        disabled={atMax}
        onClick={atMax ? undefined : onIncrement}
        style={{ ...btn(atMax), marginLeft: 4 }}
      >
        <PlusIcon size={24} color={atMax ? colors.disabledText : colors.secondary} />
      </button>
    </div>
  )
}
