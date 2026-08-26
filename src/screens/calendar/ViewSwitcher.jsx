import React from 'react'
import { HEADER } from '../../data/calendarCopy'
import { LAYOUT_VARIANT } from '../../lib/useCalendarLayout'
import Chip from '../../components/Chip'

/**
 * The wide header's view switcher — port of the `FilterChipGroup` block in
 * `components/CalendarHeader.tsx:96-114`.
 *
 * The POC's chip group is configured `canSelectMultiple={false}`,
 * `isDeselectable={false}`, `selectedIcon={null}` — a radio group wearing chip
 * clothes. `Chip` covers that with `selected` and no `checkmark`, which is the
 * `selectedIcon={null}` half; the "exactly one, never zero" half is this
 * component refusing to re-fire for the already-selected variant.
 *
 * `showLabel={false}` in the POC means the group label is for assistive tech
 * only, so it lands on a `role="radiogroup"` wrapper here rather than a visible
 * `<legend>`. `Chip` renders a `<div>`, not an `<input type="radio">`, so the
 * roles are declared explicitly — that is also why the container carries no
 * `<fieldset>` and the POC's margin-zeroing hack (`:93-95`) has no analogue.
 */
export default function ViewSwitcher({ variant, onChange }) {
  const options = [
    { value: LAYOUT_VARIANT.THREE_DAY, label: HEADER.viewThreeDay },
    { value: LAYOUT_VARIANT.MONTH, label: HEADER.viewMonthly },
  ]

  return (
    <div role="radiogroup" aria-label={HEADER.viewLabel} style={{ display: 'flex', gap: 8 }}>
      {options.map((opt) => {
        const selected = variant === opt.value
        return (
          <div key={opt.value} role="radio" aria-checked={selected} aria-label={opt.label}>
            <Chip
              label={opt.label}
              size="small"
              selected={selected}
              // `isDeselectable={false}`: clicking the live chip must not clear
              // the group, so the handler is simply not wired for it.
              onClick={selected ? undefined : () => onChange(opt.value)}
            />
          </div>
        )
      })}
    </div>
  )
}
