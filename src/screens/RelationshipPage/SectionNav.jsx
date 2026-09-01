import React from 'react'
import { colors, radius, shadows } from '../../tokens'
import { Row } from '../../components'
import { ChevronRightIcon } from '../../assets/icons'
import { SECTIONS } from './sections'

/**
 * SectionNav — the desktop master column's nav card (Figma 192:15290).
 * One row per section; the selected row is the one whose detail pane shows on
 * the right. `Row`'s `selected` prop paints the fill on the row's own box, so a
 * selected row keeps the geometry of its siblings and the fill stays inside the
 * card's 16px padding — no negative margins.
 *
 * Props:
 *   sections  [{ key, label, sublabel, icon }] — defaults to the bare SECTIONS
 *             model; pass the `buildSections(...)` output to get sublabels
 *   selected  string — section key
 *   onSelect  (key) => void
 */
export default function SectionNav({ sections = SECTIONS, selected, onSelect }) {
  return (
    <nav style={{
      background: colors.white,
      borderRadius: radius.primary,
      boxShadow: shadows.low,
      padding: 16,
    }}>
      {sections.map(section => {
        const Icon = section.icon
        const isSelected = section.key === selected
        return (
          <Row
            key={section.key}
            // The card's own 16px padding is the top inset, so no row asks for
            // the extra `firstRow` padding.
            firstRow={false}
            selected={isSelected}
            leftItem={Icon
              ? <Icon size={24} color={isSelected ? colors.primary : colors.secondary} />
              : undefined}
            label={section.label}
            sublabel={section.sublabel}
            rightItem={<ChevronRightIcon />}
            onClick={() => onSelect?.(section.key)}
          />
        )
      })}
    </nav>
  )
}
