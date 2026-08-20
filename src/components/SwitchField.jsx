import React, { useId, useState } from 'react'
import Switch from './Switch'
import { colors, textStyles, spacing, radius } from '../tokens'

// Kibble resolves label typography through `forms/fields/sharedTypography.tsx`.
// SwitchField picks the PrimaryLabel variant from `useBoldPrimaryLabel`
// (SwitchField.tsx:151): false -> "option-label", true -> "default".
//
//   option-label  renders a Paragraph with fontWeight regular
//                 (sharedTypography.tsx:79-81, 94-96)
//   default       renders a Text with fontWeight semibold
//                 (sharedTypography.tsx:63, 98-100)
//
// `primaryLabelSize` then overrides the size on either (sharedTypography.tsx:
// 118-120). Paragraph 100/200/300 = 14/16/20 at 400; Text 100/200/300 = 14/16/20
// at 600 (theme.ts:566-577) — our paragraph*/text*Semibold styles already match.
const LABEL_SIZES = {
  regular: {
    100: textStyles.paragraph100,
    200: textStyles.paragraph200,
    300: textStyles.paragraph300,
  },
  bold: {
    100: textStyles.text100Semibold,
    200: textStyles.text200Semibold,
    300: textStyles.text300Semibold,
  },
}

/**
 * SwitchField — port of Kibble's `forms/fields/SwitchField/SwitchField.tsx`.
 *
 * Owns the row so feature components do not rebuild it. Values are the real
 * ones from `SwitchField.tsx:76-170`:
 *   row      flexDirection row, justifyContent space-between, alignItems center,
 *            py="2x" (8), borderRadius "secondary" (4), NO horizontal padding
 *            and NO gap                                            (L82-91)
 *   pl       0 when controlSide="right" (the default, L29), 12 when left  (L79)
 *   hover    background #F4F5F6 = colors.bgSecondary                (L93)
 *   click    the WHOLE row is the target: querySelector('input').click()  (L62,
 *            L84); the <label> gets preventDefault so it cannot double-toggle
 *            (L155)
 *   order    label 0 / control 1 for controlSide "right", reversed for "left"
 *                                                                   (L77-78)
 *   labels   primary mb="1x" (4), secondary Paragraph 100 at textColor
 *            "tertiary" mb="1x", omitted entirely when falsy
 *                                     (sharedTypography.tsx:175, 192-214)
 *
 * Deliberate divergences, both flagged rather than silently absorbed:
 *   - Focus ring. Kibble uses `&:has(input:focus-visible) { outline: 2px solid
 *     blue }` (L132-134) — a literal `blue`, not a token. Substituted with
 *     `colors.link`. Inline styles cannot express :focus-visible, so the ring is
 *     driven by focus state gated on `matches(':focus-visible')`.
 *   - `labelAccessory`. Kibble's `primaryLabel` is typed `string`
 *     (sharedTypography.tsx:11-21) and there is no Tooltip in Kibble at all, so
 *     an info affordance beside the label has no supported path. Production
 *     composes it outside the field (`SectionTitle.tsx:20-26` with
 *     `PriceLedger/components/AlertInfoButton.tsx`) or falls back to the legacy
 *     OnOffSwitch, whose label DOES take a node
 *     (`LockedRatesComponent.tsx:28-58`). This slot is the prototype's stand-in.
 *   - `divider`. Kibble's SwitchField renders no separator; `Divider` is a
 *     separate pattern. Offered here as an opt-in, default false.
 *
 * Props:
 *   primaryLabel      string
 *   primaryLabelSize  100 | 200 | 300         (default 100)
 *   useBoldPrimaryLabel bool                  — semibold label, default false
 *   secondaryLabel    string                  — helper text, wired to aria-describedby
 *   labelAccessory    ReactNode               — prototype extension, see above
 *   controlSide       'right' | 'left'        (default 'right')
 *   divider           bool                    — prototype extension, default false
 *   disabled          bool
 *   checked           bool
 *   onChange          (nextChecked) => void
 *   id                string                  — generated when omitted
 */
export default function SwitchField({
  primaryLabel,
  primaryLabelSize = 100,
  useBoldPrimaryLabel = false,
  secondaryLabel,
  labelAccessory,
  controlSide = 'right',
  divider = false,
  disabled = false,
  checked = false,
  onChange,
  id,
}) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const uid = useId()
  const inputId = id || `switchfield-${uid}`
  const secondaryId = secondaryLabel ? `${inputId}-secondary` : undefined

  const controlRight = controlSide === 'right'
  const sizes = LABEL_SIZES[useBoldPrimaryLabel ? 'bold' : 'regular']
  const labelStyle = sizes[primaryLabelSize] || sizes[100]

  const handleRowClick = e => {
    if (disabled) return
    // The accessory owns its own click (it opens the tooltip); it must not
    // toggle the switch.
    if (e.target.closest?.('[data-switchfield-accessory]')) return
    e.currentTarget.querySelector('input')?.click()
  }

  return (
    <div
      onClick={handleRowClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={e => setFocused(!!e.target.matches?.(':focus-visible'))}
      onBlur={() => setFocused(false)}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        paddingLeft: controlRight ? 0 : spacing.md,
        borderRadius: radius.secondary,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: hovered && !disabled ? colors.bgSecondary : 'transparent',
        // Kibble: `outline: 2px solid blue`, SwitchField.tsx:133 — no token
        // exists for that literal, so colors.link stands in.
        outline: focused ? `2px solid ${colors.link}` : 'none',
        ...(divider ? { borderTop: `1px solid ${colors.border}` } : null),
      }}
    >
      <div style={{
        order: controlRight ? 0 : 1,
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <label
          htmlFor={inputId}
          // Without this the native label activation fires on top of the row
          // handler and the switch toggles twice. SwitchField.tsx:155.
          onClick={e => e.preventDefault()}
          style={{
            ...labelStyle,
            color: disabled ? colors.disabledText : colors.primary,
            marginBottom: spacing.xs,
            cursor: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <span>{primaryLabel}</span>
          {labelAccessory}
        </label>

        {secondaryLabel && (
          <span id={secondaryId} style={{
            ...textStyles.paragraph100,
            color: colors.tertiary,
            marginBottom: spacing.xs,
          }}>
            {secondaryLabel}
          </span>
        )}
      </div>

      <div style={{ order: controlRight ? 1 : 0, display: 'flex', alignItems: 'center' }}>
        <Switch
          id={inputId}
          checked={checked}
          disabled={disabled}
          hovered={hovered}
          ariaDescribedBy={secondaryId}
          onChange={onChange}
        />
      </div>
    </div>
  )
}
