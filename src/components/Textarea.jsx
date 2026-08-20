import { colors, radius, spacing, textStyles } from '../tokens'

/**
 * Textarea — labelled multi-line input, the prototype's stand-in for Kibble's
 * `Textarea` (production usage: ModifyBookedStayAPIForm.tsx:180-191 — label,
 * placeholder, inline validation error).
 *
 * Border, radius and type match CalInput / Select so the three read as one
 * family of form controls.
 *
 * Props:
 *   label       string
 *   value       string
 *   onChange    (value) => void
 *   placeholder string
 *   error       string   — inline validation message, shown below the field
 *   rows        number
 *   id          string   — required for the label association
 */
export default function Textarea({
  label, value, onChange, placeholder, error, rows = 4, id = 'textarea',
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      {label && (
        <label htmlFor={id} style={{ ...textStyles.text100Semibold, color: colors.primary }}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange?.(e.target.value)}
        style={{
          ...textStyles.text200,
          width: '100%', boxSizing: 'border-box', resize: 'vertical',
          padding: spacing.md,
          border: `2px solid ${error ? colors.borderError : colors.borderInteractive}`,
          borderRadius: radius.secondary,
          background: colors.white,
          color: colors.primary,
        }}
      />
      {error && (
        <p style={{ ...textStyles.text100, color: colors.destructive, margin: 0 }}>{error}</p>
      )}
    </div>
  )
}
