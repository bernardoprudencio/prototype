import { colors, radius, spacing, textStyles } from '../tokens'
import { DropdownIcon } from '../assets/icons'

/**
 * Select — labelled dropdown, the prototype's stand-in for Kibble's `Select`
 * (production usage: ModifyBookingForm.tsx:686-704, a label + placeholder +
 * `{ title, value }[]` options + `onChange(value)`).
 *
 * A native <select> rather than a custom popover: the option list is short,
 * keyboard and screen-reader behaviour comes free, and on iOS/Android it opens
 * the platform picker — which is what the embedded webview does in production.
 * `appearance: none` plus the shared DropdownIcon keeps it visually identical to
 * CalInput / DisabledInput, which own this control's look in this codebase.
 *
 * Props:
 *   label        string     — rendered above the control, associated via htmlFor
 *   value        string     — '' shows the placeholder
 *   onChange     (value) => void
 *   options      { value, label }[]
 *   placeholder  string     — a disabled first option, as Kibble does
 *   id           string     — required for the label association
 *   disabled     bool       — greys the control and blocks interaction
 *   ariaLabel    string     — for callers that render their own visible label
 */
export default function Select({ label, value, onChange, options = [], placeholder, id = 'select', disabled = false, ariaLabel }) {
  const isPlaceholder = !value

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      {label && (
        <label htmlFor={id} style={{ ...textStyles.text100Semibold, color: colors.primary }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          id={id}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={e => onChange?.(e.target.value)}
          style={{
            ...textStyles.text200,
            appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
            width: '100%', minHeight: 48, boxSizing: 'border-box',
            padding: `${spacing.md}px ${spacing.xl + spacing.sm}px ${spacing.md}px ${spacing.md}px`,
            border: `2px solid ${colors.borderInteractive}`,
            borderRadius: radius.secondary,
            background: colors.white,
            color: (isPlaceholder || disabled) ? colors.disabledText : colors.primary,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span style={{
          position: 'absolute', right: spacing.md,
          display: 'flex', alignItems: 'center', pointerEvents: 'none',
        }}>
          <DropdownIcon />
        </span>
      </div>
    </div>
  )
}
