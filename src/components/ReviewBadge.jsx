import React from 'react'
import { palette, colors, radius, textStyles } from '../tokens'
import { HUB_COPY } from '../data/hubCopy'

/**
 * Yellow attention badge rendered on hub and sub-page rows whose section has
 * an outstanding action. Figma 4233:17354 — surface `colors.yellow100`,
 * text `palette.yellow[700]`, `Text/text_100_semibold`, radius secondary.
 *
 * `Pill` hardcodes 700 weight and a success-green default, so this is a
 * sibling rather than another `Pill` variant.
 */
export default function ReviewBadge({ label = HUB_COPY.reviewBadge.label }) {
  return (
    <span
      style={{
        ...textStyles.text100Semibold,
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: radius.secondary,
        background: colors.yellow100,
        color: palette.yellow[700],
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
