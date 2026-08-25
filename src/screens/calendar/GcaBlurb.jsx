import React from 'react'
import { radius, textStyles } from '../../tokens'
import { CAL_COLORS } from './calendarTheme'
import { GCA } from '../../data/calendarCopy'
import Button from '../../components/Button'
import { CautionIcon, SuccessIcon } from '../../assets/icons'

/**
 * Port of `layouts/v1/V1GcaBlurb.tsx` — the guaranteed-calendar-accuracy nudge
 * that sits above the selection summary in the rail.
 *
 * Faithful branches (`:33-49`):
 *   - returns `null` when `daysSinceLastUpdate === 0` — a calendar confirmed
 *     today has nothing to say
 *   - title: not needing attention → "Your calendar is up to date"; otherwise
 *     the day count, or the "Never updated" string when the count is null
 *   - subtitle switches on the same flag
 *   - the "Confirm my calendar" CTA renders *only* while `needsAttention`
 *
 * The Kibble `AlertCaution` / `AlertSuccess` icons at 24px map onto the
 * prototype's `CautionIcon` / `SuccessIcon`, which already carry the caution and
 * success fills at that size.
 */
export default function GcaBlurb({ gca, onConfirm, isConfirming = false }) {
  if (!gca || gca.daysSinceLastUpdate === 0) return null

  const needsAttention = Boolean(gca.needsAttention)

  const title = !needsAttention
    ? GCA.upToDateTitle
    : gca.daysSinceLastUpdate != null
      ? GCA.daysSince(gca.daysSinceLastUpdate)
      : GCA.neverUpdated

  const body = needsAttention ? GCA.needsAttentionBody : GCA.upToDateBody

  return (
    <div style={{
      borderRadius: radius.primary,
      padding: 12,
      background: CAL_COLORS.blurbBg,
      border: '0.5px solid rgba(0, 0, 0, 0.06)',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {needsAttention ? <CautionIcon /> : <SuccessIcon />}
        <div style={{ minWidth: 0 }}>
          <div style={{ ...textStyles.text100Semibold, color: CAL_COLORS.textPrimary }}>
            {title}
          </div>
          <div style={{ ...textStyles.paragraph100, color: CAL_COLORS.textSecondary, marginTop: 4 }}>
            {body}
          </div>
        </div>
      </div>

      {needsAttention && (
        <div style={{ marginTop: 12 }}>
          <Button variant="primary" size="small" fullWidth onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? GCA.confirming : GCA.confirmCta}
          </Button>
        </div>
      )}
    </div>
  )
}
