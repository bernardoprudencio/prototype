import React from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import { colors, typography } from '../tokens'
import { ChevronRightIcon } from '../assets/icons'

// "Choose a profile to view as" sheet — opened from the "View profile" link
// in the Pet sitting section of ServiceSettingsScreen.
//
// Figma: UX2-2136 node 386:16426. Row taps are no-ops for the prototype —
// they just dismiss the sheet, matching the rest of ServiceSettingsScreen's
// scope.
const PROFILE_OPTIONS = [
  { id: 'pet-parent',  primary: 'Pet parent',  secondary: 'on Rover' },
  { id: 'cat-parent',  primary: 'Cat parent',  secondary: 'on Rover' },
  { id: 'cat-parents', primary: 'Cat parents', secondary: 'on Cat in a Flat' },
]

const ProfileRow = ({ option, onPress }) => (
  <div
    onClick={onPress}
    style={{
      display: 'flex',
      alignItems: 'center',
      minHeight: 56,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 12,
      cursor: 'pointer',
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
      <span
        style={{
          fontFamily: typography.fontFamily,
          fontWeight: 600,
          fontSize: 16,
          lineHeight: 1.25,
          color: colors.primary,
        }}
      >
        {option.primary}
      </span>
      <span
        style={{
          fontFamily: typography.fontFamily,
          fontWeight: 400,
          fontSize: 14,
          lineHeight: 1.25,
          color: colors.tertiary,
        }}
      >
        {option.secondary}
      </span>
    </div>
    <ChevronRightIcon />
  </div>
)

export default function ChooseProfileSheet({ onDismiss }) {
  return (
    <BottomSheet onDismiss={onDismiss}>
      {/* Header — extra 8px of top padding gets the gap to ~32px from the top of
          the sheet (BottomSheet already contributes 8 + handle 5 + 16 = 29px). */}
      <div style={{ paddingTop: 8 }}>
        <div
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.25,
            color: colors.tertiary,
            paddingBottom: 4,
          }}
        >
          Pet sitting
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: typography.fontFamily,
            fontWeight: 600,
            fontSize: 20,
            lineHeight: 1.25,
            color: colors.primary,
            paddingBottom: 4,
          }}
        >
          Choose a profile to view as
        </h2>
      </div>

      <div style={{ paddingTop: 24, paddingBottom: 24 }}>
        {PROFILE_OPTIONS.map((opt) => (
          <ProfileRow key={opt.id} option={opt} onPress={onDismiss} />
        ))}
      </div>

      <Button variant="default" size="small" fullWidth onClick={onDismiss}>
        Close
      </Button>
    </BottomSheet>
  )
}
