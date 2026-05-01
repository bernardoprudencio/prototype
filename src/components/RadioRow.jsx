import { typography, textStyles } from '../tokens'

const fontFamily = typography.fontFamily

/**
 * RadioRow — a tappable row with a radio button on the right.
 *
 * Props:
 *   label     string   row label
 *   sublabel  string   optional secondary label shown below the label
 *   value     any      the value this row represents
 *   selected  any      the currently selected value (compared with ===)
 *   onSelect  fn(value) called when tapped
 */
export default function RadioRow({ label, sublabel, value, selected, onSelect }) {
  const active = selected === value
  return (
    <div
      onClick={() => onSelect(value)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 56, paddingTop: 8, paddingBottom: 8, cursor: 'pointer' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily, fontWeight: 400, fontSize: 16, color: '#1F2124', margin: 0, lineHeight: 1.5 }}>{label}</p>
        {sublabel && <p style={{ ...textStyles.text100, color: '#6B7075', margin: 0, marginTop: 2 }}>{sublabel}</p>}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: `2px solid ${active ? '#2E67D1' : '#C9CFD4'}`,
        background: '#fff', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2E67D1' }} />}
      </div>
    </div>
  )
}
