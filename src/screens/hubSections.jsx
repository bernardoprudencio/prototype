import React from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import { colors, palette } from '../tokens'
import {
  BlockedIcon,
  CheckCircleIcon,
  GroomingIcon,
  PawIcon,
  TrainingIcon,
} from '../assets/icons'
import { FAMILY_SIGNUP, SERVICE_FAMILY } from '../data/sitterServices'
import { HUB_COPY } from '../data/hubCopy'
import HubBanner from '../components/HubBanner'
import MigrationOnboardingBanner from '../components/MigrationOnboardingBanner'
import { Chevron, PaneTitle, SettingsRow } from '../components/hubUI'

// Row lists shared by the mobile hub index and the wide layout's right pane.
// Only the heading differs between the two — mobile renders `SectionHeader`
// (20px semibold + icon), wide renders `PaneTitle` (Bogart display) — so the
// caller owns it and these components are heading-less.

// Sign-up row icon, same map ServiceSettingsScreen uses for section headers.
const FAMILY_ICON = {
  [SERVICE_FAMILY.PET_SITTING]: PawIcon,
  [SERVICE_FAMILY.TRAINING]:    TrainingIcon,
  [SERVICE_FAMILY.GROOMING]:    GroomingIcon,
}

/**
 * Business rows. The Insights label is width-dependent: production's web layout
 * spells out that the destination is app-only (Figma 643:10693), the mobile hub
 * does not. The verification-error banner stays directly under its row at both
 * widths (Figma 4233:39861).
 */
export const BusinessRows = ({ isWide, business, backgroundCheckStatus, noop }) => (
  <>
    <SettingsRow
      label="Calendar"
      sublabel="Manage the availability for your pet sitting services"
      rightItem={<Chevron />}
      onPress={noop}
    />
    <SettingsRow
      label={isWide ? HUB_COPY.insightsRow.labelWide : HUB_COPY.insightsRow.label}
      sublabel={HUB_COPY.insightsRow.sublabel}
      rightItem={<Chevron />}
      onPress={noop}
    />
    <SettingsRow
      label="Promote your profile"
      sublabel="Your profile link offers pet owners a $20 off their first booking with Rover."
      rightItem={<Chevron />}
      onPress={noop}
    />
    <SettingsRow
      label="Payments"
      sublabel="View and configure your payment details"
      rightItem={<Chevron />}
      onPress={noop}
    />
    <SettingsRow
      label="Verification"
      sublabel="Help keep the Rover community safe"
      needsReview={backgroundCheckStatus === 'error'}
      rightItem={
        backgroundCheckStatus === 'verified' && business.backgroundCheckPassed
          ? <CheckCircleIcon />
          : <Chevron />
      }
      onPress={noop}
    />
    {backgroundCheckStatus === 'error' && (
      <HubBanner
        severity={HUB_COPY.verificationError.severity}
        layout="paragraph"
        title={HUB_COPY.verificationError.title}
        body={HUB_COPY.verificationError.body}
        cta={{ label: HUB_COPY.verificationError.ctaLabel, onClick: noop }}
        bodyTail={HUB_COPY.verificationError.bodyTail}
      />
    )}
  </>
)

export const AboutYouRows = ({ noop }) => (
  <>
    <SettingsRow
      label="Details"
      sublabel="Address, photo, email, and birthday"
      rightItem={<Chevron />}
      onPress={noop}
    />
    <SettingsRow label="Pets" sublabel="Add your pets" rightItem={<Chevron />} onPress={noop} />
    <SettingsRow
      label="Phone numbers"
      sublabel="Edit your number and emergency contact"
      rightItem={<Chevron />}
      onPress={noop}
    />
  </>
)

/**
 * "Other services" sign-up rows. The icon is orange at both widths per Figma
 * 2383:8929 — the shipped mobile grey was a carry-over from the pre-migration
 * hub.
 */
export const OtherServicesRows = ({ families, noop }) => (
  <>
    {families.map((family) => {
      const Icon = FAMILY_ICON[family]
      const signup = FAMILY_SIGNUP[family]
      return (
        <SettingsRow
          key={family}
          leftIcon={Icon ? <Icon size={24} color={palette.orange[700]} /> : null}
          label={signup.label}
          sublabel={signup.sublabel}
          rightItem={<Chevron />}
          onPress={noop}
        />
      )
    })}
  </>
)

export const AccountActionsRows = ({ onStopProviding }) => (
  <SettingsRow
    label={HUB_COPY.accountActions.stopProviding.label}
    labelColor={colors.destructive}
    sublabel={HUB_COPY.accountActions.stopProviding.sublabel}
    rightItem={<BlockedIcon />}
    onPress={onStopProviding}
  />
)

/**
 * Genuinely account-wide banners. Rendered above the two panes at wide width
 * (Figma 4303:43590 puts the global banner full width, above everything) and at
 * the top of the mobile index. Family-scoped banners never come through here —
 * they render inside their own family's section / pane.
 */
export const AccountWideBanners = ({
  searchStatus,
  showCiafMigrationOnboarding,
  onDismissCiaf,
  noop,
}) => (
  <>
    {searchStatus === 'away_manual' && (
      <HubBanner
        severity="info"
        title={HUB_COPY.awayManual.title}
        body={HUB_COPY.awayManual.body}
        cta={{ label: HUB_COPY.awayManual.ctaLabel, onClick: noop }}
      />
    )}

    {searchStatus === 'away_auto' && (
      <HubBanner
        severity="info"
        title={HUB_COPY.awayAuto.title}
        body={HUB_COPY.awayAuto.body}
        cta={{ label: HUB_COPY.awayAuto.ctaLabel, onClick: noop }}
      />
    )}

    {showCiafMigrationOnboarding && (
      <MigrationOnboardingBanner
        copy={HUB_COPY.ciafMigrationOnboarding}
        onDismiss={onDismissCiaf}
      />
    )}
  </>
)

// ── Wide-only panes ──────────────────────────────────────────────────────────
// `/service-settings/business`, `/service-settings/about` and
// `/service-settings/other` are wide-width addresses only: Figma has no mobile
// sub-page for them, and the mobile index keeps rendering these sections inline,
// so below 769px they bounce back to the index.

export const BusinessPane = () => {
  const { isWide, business, backgroundCheckStatus, noop } = useOutletContext()
  if (!isWide) return <Navigate to="/service-settings" replace />
  return (
    <>
      <PaneTitle title="Business" />
      <BusinessRows
        isWide
        business={business}
        backgroundCheckStatus={backgroundCheckStatus}
        noop={noop}
      />
    </>
  )
}

export const AboutYouPane = () => {
  const { isWide, noop } = useOutletContext()
  if (!isWide) return <Navigate to="/service-settings" replace />
  return (
    <>
      {/* No "View profile" link on this pane at wide — Figma 643:11006. */}
      <PaneTitle title="About you" />
      <AboutYouRows noop={noop} />
    </>
  )
}

export const OtherServicesPane = () => {
  const { isWide, otherFamilies, noop } = useOutletContext()
  if (!isWide) return <Navigate to="/service-settings" replace />
  // The nav item only exists while a family is inactive-but-in-geo; if the last
  // one activates while this pane is open there is nothing left to show.
  if (otherFamilies.length === 0) return <Navigate to="/service-settings" replace />
  return (
    <>
      <PaneTitle title={HUB_COPY.sideNav.otherServices} />
      <OtherServicesRows families={otherFamilies} noop={noop} />
    </>
  )
}
