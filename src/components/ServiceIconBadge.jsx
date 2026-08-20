import React from 'react'
import { palette } from '../tokens'
import { serviceBadgeTone } from '../data/sitterServices'

/**
 * Circular, state-tinted service icon used on the family services sub-page
 * (`FamilyServicesScreen`). Tones come from `serviceBadgeTone(state)`, which
 * carries the Figma 582:56416 values as `[paletteFamily, shade]` pairs.
 *
 * `Icon` is one of the service icons in `src/assets/icons.jsx`; they all take
 * a `color` prop and render at 24px.
 */
export default function ServiceIconBadge({ Icon, state, size = 32 }) {
  const tone = serviceBadgeTone(state)
  const bg = palette[tone.bg[0]][tone.bg[1]]
  const fg = palette[tone.fg[0]][tone.fg[1]]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        flexShrink: 0,
      }}
    >
      {Icon ? <Icon color={fg} /> : null}
    </span>
  )
}
