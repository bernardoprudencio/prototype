import { colors, textStyles } from '../tokens'
import { DropdownIcon } from '../assets/icons'

/**
 * DisabledInput — read-only display that visually matches the CalInput / end-date fields.
 *
 * Props:
 *   value   string   the text to display
 *   icon    ReactNode  optional icon on the right (defaults to DropdownIcon)
 */
export default function DisabledInput({ value, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', minHeight: 48,
      padding: '12px 8px 12px 12px',
      border: `2px solid #C9CFD4`,
      borderRadius: 4,
      background: colors.bgSecondary,
      boxSizing: 'border-box',
      gap: 8,
    }}>
      <span style={{ ...textStyles.text200, flex: 1, color: colors.disabledText }}>{value}</span>
      {icon !== undefined ? icon : <DropdownIcon />}
    </div>
  )
}
