import React from 'react'
import { colors, radius, shadows } from '../../tokens'
import { Row, Button } from '../../components'
import { ChevronDownIcon, ChevronUpIcon } from '../../assets/icons'
import { SECTIONS } from './sections'

/**
 * The mobile half of the two-section IA (Figma 192:15414): a horizontally
 * scrolling chip row that jumps to a section, and one accordion card per
 * section below it.
 *
 * The chips do not select — they scroll. Tapping one opens its card and brings
 * it into view, which is why the card takes a forwarded ref: the caller owns
 * the open state and the `scrollIntoView` call, so both chip taps and header
 * taps run through the same one place.
 */

/**
 * SectionAccordion — one collapsible card.
 *
 * Props:
 *   section   { key, label, sublabel, icon }
 *   open      bool
 *   onToggle  () => void
 *   children  the section body, rendered under the header while open
 *   ref       forwarded to the card, for scrollIntoView
 */
const SectionAccordion = React.forwardRef(function SectionAccordion(
  { section, open = false, onToggle, children }, ref,
) {
  const Icon = section?.icon
  return (
    <section
      ref={ref}
      style={{
        background: colors.white,
        borderRadius: radius.primary,
        boxShadow: shadows.low,
        // The header row carries its own vertical padding (Row's 8/8 over a
        // 56px min-height), so the card insets horizontally only.
        padding: '0 16px',
      }}
    >
      <Row
        firstRow
        leftItem={Icon ? <Icon size={24} color={colors.primary} /> : undefined}
        label={section?.label}
        sublabel={section?.sublabel}
        rightItem={open ? <ChevronUpIcon /> : <ChevronDownIcon />}
        onClick={onToggle}
      />
      {open && <div style={{ paddingBottom: 8 }}>{children}</div>}
    </section>
  )
})

export default SectionAccordion

/**
 * SectionChipRow — the scrolling chip row above the cards.
 *
 * Props:
 *   sections  [{ key, label }] — defaults to the bare SECTIONS model
 *   onSelect  (key) => void
 */
export function SectionChipRow({ sections = SECTIONS, onSelect }) {
  return (
    <div
      className="hide-scrollbar"
      style={{
        display: 'flex', gap: 8,
        overflowX: 'auto',
        // Chips never wrap: the row scrolls, per the frame's single scrollable
        // row — it is not a two-line wrap at narrow widths.
        flexWrap: 'nowrap',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {sections.map(section => (
        <div key={section.key} style={{ flexShrink: 0 }}>
          <Button variant="default" size="small" onClick={() => onSelect?.(section.key)}>
            {section.label}
          </Button>
        </div>
      ))}
    </div>
  )
}
