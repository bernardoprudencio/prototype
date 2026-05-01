import React from 'react'
import TierBox from './TierBox'

const formatCAD = (amount) => new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
}).format(amount)

export default function TierStatus({ tiers, ownerAvatarUrl }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'row', alignItems: 'flex-end',
      gap: 8, padding: '0 4px',
    }}>
      {tiers.map((tier, index) => {
        const isLast = index === tiers.length - 1
        const hasPlus = tier.threshold.amount.endsWith('+')
        const raw = hasPlus ? tier.threshold.amount.slice(0, -1) : tier.threshold.amount
        const formatted = formatCAD(parseFloat(raw))
        const thresholdText = isLast || hasPlus ? `${formatted}+` : `Up to ${formatted}`
        const earnText = `Earn ${Math.round(parseFloat(tier.roverFeePercentage) * 100)}%`

        return (
          <TierBox
            key={tier.tierName}
            label={tier.tierName}
            status={tier.status}
            thresholdText={thresholdText}
            earnText={earnText}
            ownerAvatarUrl={ownerAvatarUrl}
            tierIndex={index}
          />
        )
      })}
    </div>
  )
}
