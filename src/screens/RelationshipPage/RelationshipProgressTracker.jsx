import React, { useState } from 'react'
import { colors, typography, radius } from '../../tokens'
import { Button } from '../../components'
import TierStatus from './TierStatus'
import ProgressBar from './ProgressBar'
import InfoBox from './InfoBox'
import AlternativeMonetizationInterstitial from './AlternativeMonetizationInterstitial'

export default function RelationshipProgressTracker({ heading, tiers, callout, earnings, ownerAvatarUrl }) {
  const [interstitialOpen, setInterstitialOpen] = useState(false)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 16,
      padding: '16px',
      background: colors.white,
      borderRadius: radius.primary,
    }}>
      {/* Heading — Heading size 200 (16px / 700) per RelationshipHeading.tsx */}
      <div style={{
        fontFamily: typography.fontFamily,
        fontWeight: 700, fontSize: 16, lineHeight: '20px',
        color: colors.primary,
      }}>
        {heading}
      </div>

      <div style={{ paddingTop: 12 }}>
        <TierStatus tiers={tiers} ownerAvatarUrl={ownerAvatarUrl} />
      </div>

      <ProgressBar tiers={tiers} earnings={earnings} />

      <InfoBox callout={callout} />

      <Button variant="default" size="small" fullWidth onClick={() => setInterstitialOpen(true)}>
        Learn More
      </Button>

      <AlternativeMonetizationInterstitial
        open={interstitialOpen}
        onClose={() => setInterstitialOpen(false)}
      />
    </div>
  )
}
