import React from 'react'
import { colors } from '../tokens'

/**
 * OnOffSwitch — token-styled equivalent of Kibble's `OnOffSwitch`, which is what
 * production uses for the locked-rates control on the modify-booking screen.
 *
 * Props:
 *   checked    bool
 *   onChange   (nextChecked) => void
 *   disabled   bool
 *   ariaLabel  string
 */
export default function OnOffSwitch({ checked = false, onChange, disabled = false, ariaLabel }) {
  const W = 48, H = 28, PAD = 3
  const knob = H - PAD * 2

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      style={{
        width: W, height: H, flexShrink: 0,
        borderRadius: H / 2,
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        background: disabled
          ? colors.border
          : checked ? colors.success : colors.borderInteractive,
        transition: 'background 150ms ease',
        position: 'relative',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{
        position: 'absolute',
        top: PAD,
        left: checked ? W - PAD - knob : PAD,
        width: knob, height: knob,
        borderRadius: '50%',
        background: colors.white,
        boxShadow: '0 1px 3px rgba(27,31,35,0.24)',
        transition: 'left 150ms ease',
      }} />
    </button>
  )
}
