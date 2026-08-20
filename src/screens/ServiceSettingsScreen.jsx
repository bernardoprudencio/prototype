import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, textStyles } from '../tokens'
import {
  BackIcon,
  BlockedIcon,
  CheckCircleIcon,
  GridPlusIcon,
  GroomingIcon,
  ListIcon,
  PawIcon,
  PersonIcon,
  TrainingIcon,
} from '../assets/icons'
import { SITTER_PROFILE } from '../data/sitterProfile'
import {
  DEFAULT_FAMILY_IN_GEO,
  DEFAULT_SERVICE_STATES,
  FAMILY_LABEL,
  FAMILY_ORDER,
  FAMILY_ROW_COPY,
  FAMILY_SIGNUP,
  PRESETS,
  SERVICE_FAMILY,
  SERVICE_STATE,
  hasActiveServices,
  isFamilyInGeo,
} from '../data/sitterServices'
import { HUB_COPY } from '../data/hubCopy'
import ChooseProfileSheet from '../components/ChooseProfileSheet'
import ServiceVariantConfigSheet from '../components/ServiceVariantConfigSheet'
import Button from '../components/Button'
import HubBanner from '../components/HubBanner'
import MigrationOnboardingBanner from '../components/MigrationOnboardingBanner'
import ResubmitButton from '../components/ResubmitButton'
import ConfirmDeactivationModal from '../components/ConfirmDeactivationModal'
import AvailabilityModal from '../components/AvailabilityModal'
import AdditionalPreferencesModal from '../components/AdditionalPreferencesModal'
import HelpLinkTip from '../components/HelpLinkTip'
import { Chevron, SectionGroup, SectionHeader, SettingsRow } from '../components/hubUI'
import { useApp } from '../context/AppContext'
import { useIsExtraWide } from '../lib/useMediaQuery'

// Icon on each family's section header, and on its "Other services" sign-up row.
const FAMILY_ICON = {
  [SERVICE_FAMILY.PET_SITTING]: PawIcon,
  [SERVICE_FAMILY.TRAINING]:    TrainingIcon,
  [SERVICE_FAMILY.GROOMING]:    GroomingIcon,
}

// sessionStorage keys gating the once-per-session post-submission modals.
const SS_KEY_SEEN_AVAILABILITY = 'hub_seen_availability'
const SS_KEY_SEEN_PREFERENCES  = 'hub_seen_preferences'

export default function ServiceSettingsScreen() {
  const navigate = useNavigate()
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [configSheetOpen, setConfigSheetOpen] = useState(false)
  const isTwoCol = useIsExtraWide()
  const onBack = () => navigate('/more')
  const openProfileSheet = () => setProfileSheetOpen(true)
  const closeProfileSheet = () => setProfileSheetOpen(false)
  const noop = () => {}

  // Only pet sitting opens ChooseProfileSheet — training/grooming each have a
  // single profile, so their "View profile" buttons are empty clicks in the
  // prototype (would navigate to that single profile in production).
  const handleViewProfile = (family) =>
    family === SERVICE_FAMILY.PET_SITTING ? openProfileSheet : noop

  const {
    serviceStates,
    setServiceStates,
    familyInGeo,
    setFamilyInGeo,
    // ── Hub state variants (Phase C) ─────────────────────────────────────
    profileReviewStatus,
    backgroundCheckStatus,
    searchStatus,
    showAvailabilityModal,
    showAdditionalPreferencesModal,
    showConfirmServiceDeactivation,
    showServiceSettingsHelpTip,
    showRegionalAlertCalifornia,
    setShowRegionalAlertCalifornia,
    showShortNoticeRateBanner,
    setShowShortNoticeRateBanner,
    showHubFetchError,
    setShowHubFetchError,
    showCiafMigrationOnboarding,
    setShowCiafMigrationOnboarding,
    showTrainingCredentialsUploadBanner,
    showGroomingProfileReviewBanner,
    groomingBannerVariant,
  } = useApp()

  // Local state for the service-deactivation confirmation modal. Tracks which
  // service id is pending so we can flip it to INACTIVE on confirm.
  const [pendingDeactivationId, setPendingDeactivationId] = useState(null)

  // Local state for the post-submission modal sequence. Mutually exclusive —
  // Availability runs first, then Preferences.
  const [activePostSubmissionModal, setActivePostSubmissionModal] = useState(null) // null | 'availability' | 'preferences'

  // Post-submission modal sequence. On mount, surface Availability (if on and
  // not yet shown this session), then Preferences (likewise).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (
      showAvailabilityModal &&
      window.sessionStorage.getItem(SS_KEY_SEEN_AVAILABILITY) !== '1'
    ) {
      setActivePostSubmissionModal('availability')
      return
    }
    if (
      showAdditionalPreferencesModal &&
      window.sessionStorage.getItem(SS_KEY_SEEN_PREFERENCES) !== '1'
    ) {
      setActivePostSubmissionModal('preferences')
    }
    // Only fires on mount; we intentionally don't re-evaluate when the user
    // toggles these flags during the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeAvailabilityModal = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SS_KEY_SEEN_AVAILABILITY, '1')
    }
    // After Availability dismisses, advance to Preferences if it's enabled
    // and unseen.
    if (
      showAdditionalPreferencesModal &&
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(SS_KEY_SEEN_PREFERENCES) !== '1'
    ) {
      setActivePostSubmissionModal('preferences')
    } else {
      setActivePostSubmissionModal(null)
    }
  }

  const closeAdditionalPreferencesModal = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SS_KEY_SEEN_PREFERENCES, '1')
    }
    setActivePostSubmissionModal(null)
  }

  // Deactivate a service: flip its state to INACTIVE in the serviceStates map.
  // The sentinel id `__all__` deactivates every service at once — used by the
  // global "Stop providing services" account-level action.
  const runDeactivation = (serviceId) => {
    if (serviceId === '__all__') {
      const next = { ...serviceStates }
      for (const id of Object.keys(next)) next[id] = SERVICE_STATE.INACTIVE
      setServiceStates(next)
      return
    }
    setServiceStates({ ...serviceStates, [serviceId]: SERVICE_STATE.INACTIVE })
  }

  // Wraps any service-deactivation action: shows the confirmation modal first
  // when the variant is on, runs immediately otherwise.
  const requestDeactivation = (serviceId) => {
    if (showConfirmServiceDeactivation) {
      setPendingDeactivationId(serviceId)
    } else {
      runDeactivation(serviceId)
    }
  }

  const confirmPendingDeactivation = () => {
    if (pendingDeactivationId) runDeactivation(pendingDeactivationId)
    setPendingDeactivationId(null)
  }

  const cancelPendingDeactivation = () => setPendingDeactivationId(null)

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    setServiceStates(preset.serviceStates)
    setFamilyInGeo(preset.familyInGeo)
  }

  const resetVariants = () => {
    setServiceStates(DEFAULT_SERVICE_STATES)
    setFamilyInGeo(DEFAULT_FAMILY_IN_GEO)
  }

  const { business } = SITTER_PROFILE

  const primaryFamilies = FAMILY_ORDER.filter((fam) => hasActiveServices(fam, serviceStates))
  const otherFamilies = FAMILY_ORDER.filter(
    (fam) => !hasActiveServices(fam, serviceStates) && isFamilyInGeo(fam, familyInGeo)
  )

  // ── Family-scoped banners ──────────────────────────────────────────────
  // In the migrated IA each attention banner renders inside its own family's
  // section rather than in a global stack at the top of the hub: Services-scoped
  // banners sit between the section header and the Services row, Profile-scoped
  // ones sit below the Profile row. `scope` on each HUB_COPY entry records which.
  const bannersFor = (family, slot) => {
    const out = []
    const at = (copy) => copy.scope?.family === family && copy.scope?.slot === slot

    if (showShortNoticeRateBanner && at(HUB_COPY.shortNoticeRateBanner)) {
      out.push(
        <HubBanner
          key="short-notice"
          severity={HUB_COPY.shortNoticeRateBanner.severity}
          title={HUB_COPY.shortNoticeRateBanner.title}
          body={HUB_COPY.shortNoticeRateBanner.body}
          cta={{ label: HUB_COPY.shortNoticeRateBanner.ctaLabel, onClick: noop }}
          onDismiss={() => setShowShortNoticeRateBanner(false)}
        />
      )
    }

    if (showRegionalAlertCalifornia && at(HUB_COPY.californiaProviderGroup)) {
      out.push(
        <HubBanner
          key="california"
          severity={HUB_COPY.californiaProviderGroup.severity}
          title={HUB_COPY.californiaProviderGroup.title}
          body={HUB_COPY.californiaProviderGroup.body}
          cta={{ label: HUB_COPY.californiaProviderGroup.ctaLabel, onClick: noop }}
          onDismiss={() => setShowRegionalAlertCalifornia(false)}
        />
      )
    }

    if (showTrainingCredentialsUploadBanner && at(HUB_COPY.trainingCredentialsUpload)) {
      out.push(
        <HubBanner
          key="training-credentials"
          severity={HUB_COPY.trainingCredentialsUpload.severity}
          title={HUB_COPY.trainingCredentialsUpload.title}
          body={HUB_COPY.trainingCredentialsUpload.body}
          cta={{ label: HUB_COPY.trainingCredentialsUpload.ctaLabel, onClick: noop }}
        />
      )
    }

    if (showGroomingProfileReviewBanner) {
      const copy =
        groomingBannerVariant === 'not_findable'
          ? HUB_COPY.groomingNotFindable
          : HUB_COPY.groomingProfileReview
      if (at(copy)) {
        out.push(
          <HubBanner
            key="grooming"
            severity={copy.severity}
            layout="paragraph"
            hideIcon
            title={copy.boldLead}
            body={copy.body}
            cta={copy.ctaLabel ? { label: copy.ctaLabel, href: copy.ctaHref, target: '_blank' } : undefined}
          />
        )
      }
    }

    return out
  }

  // A family row wears the "Review" badge when its own section has a banner
  // scoped to that slot.
  const needsReview = (family, slot) => bannersFor(family, slot).length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* ── Sticky header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 56,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: `1px solid ${colors.border}`,
          background: colors.white,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            flexShrink: 0,
          }}
        >
          <BackIcon />
        </button>
        <h1 style={{ ...textStyles.display400, color: colors.primary, margin: 0 }}>
          Service settings
        </h1>
      </div>

      {/* ── Body ── */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        {/* Hub fetch error empty state — short-circuits the rest of the hub.
            Renders only the error banner; the Configure variants control is
            kept at the bottom so the testing-mode entry point stays reachable
            even when this state is on. */}
        {showHubFetchError ? (
          <div
            style={{
              maxWidth: 1140,
              width: '100%',
              margin: '0 auto',
              paddingTop: 40,
              paddingBottom: 40,
            }}
          >
            <HubBanner
              severity="error"
              title={HUB_COPY.hubFetchError.title}
              body={HUB_COPY.hubFetchError.body}
              cta={{
                label: HUB_COPY.hubFetchError.ctaLabel,
                onClick: () => setShowHubFetchError(false),
              }}
            />
          </div>
        ) : (
        <>
        {/* ── Top-of-hub banners + Resubmit ──
            Only the genuinely account-wide states live here now; every
            family-scoped banner renders inside its own section via bannersFor. */}
        <div
          style={{
            maxWidth: 1140,
            width: '100%',
            margin: '0 auto',
            paddingTop: 16,
          }}
        >
          {profileReviewStatus === 'borderline' && (
            <div style={{ marginBottom: 12 }}>
              <ResubmitButton onClick={noop} />
            </div>
          )}

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
              onDismiss={() => setShowCiafMigrationOnboarding(false)}
            />
          )}
        </div>

        <div
          style={{
            display: isTwoCol ? 'grid' : 'block',
            gridTemplateColumns: isTwoCol ? '1fr 1fr' : undefined,
            columnGap: isTwoCol ? 80 : undefined,
            alignItems: isTwoCol ? 'start' : undefined,
            maxWidth: 1140,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {/* Column A: primary families + Other services */}
          <div>
            {primaryFamilies.map((family, idx) => (
              <SectionGroup key={family} borderless={isTwoCol}>
                <SectionHeader
                  Icon={FAMILY_ICON[family]}
                  title={FAMILY_LABEL[family]}
                  rightLinkLabel="View profile"
                  onRightLink={handleViewProfile(family)}
                  topPadding={idx === 0 ? 24 : 40}
                />

                {bannersFor(family, 'services')}

                <SettingsRow
                  label="Services"
                  sublabel={FAMILY_ROW_COPY[family]?.services}
                  needsReview={needsReview(family, 'services')}
                  rightItem={<Chevron />}
                  onPress={() => navigate(`/service-settings/services/${family}`)}
                />
                <SettingsRow
                  label="Profile"
                  sublabel={FAMILY_ROW_COPY[family]?.profile}
                  needsReview={needsReview(family, 'profile')}
                  rightItem={<Chevron />}
                  onPress={() => navigate(`/service-settings/profile/${family}`)}
                />

                {bannersFor(family, 'profile')}
              </SectionGroup>
            ))}

            {/* ── Other services ── (no trailing border in Figma) */}
            {otherFamilies.length > 0 && (
              <div>
                <SectionHeader Icon={GridPlusIcon} title="Other services" topPadding={40} />
                {otherFamilies.map((family) => {
                  const Icon = FAMILY_ICON[family]
                  const signup = FAMILY_SIGNUP[family]
                  return (
                    <SettingsRow
                      key={family}
                      leftIcon={Icon ? <Icon size={24} color={colors.tertiary} /> : null}
                      label={signup.label}
                      sublabel={signup.sublabel}
                      rightItem={<Chevron />}
                      onPress={noop}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Column B: Business + About you + Destructive area */}
          <div>
            {/* ── Business ── */}
            <SectionGroup borderless={isTwoCol}>
              <SectionHeader Icon={ListIcon} title="Business" topPadding={isTwoCol ? 24 : 40} />

              <SettingsRow
                label="Calendar"
                sublabel="Manage the availability for your pet sitting services"
                rightItem={<Chevron />}
                onPress={noop}
              />
              <SettingsRow
                label="Insights"
                sublabel="Check your profile and business performance"
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
            </SectionGroup>

            {/* ── About you ── */}
            <SectionGroup borderless={isTwoCol}>
              <SectionHeader
                Icon={PersonIcon}
                title="About you"
                rightLinkLabel="View profile"
                onRightLink={noop}
                topPadding={40}
              />

              <SettingsRow
                label="Details"
                sublabel="Address, photo, email, and birthday"
                rightItem={<Chevron />}
                onPress={noop}
              />
              <SettingsRow
                label="Pets"
                sublabel="Add your pets"
                rightItem={<Chevron />}
                onPress={noop}
              />
              <SettingsRow
                label="Phone numbers"
                sublabel="Edit your number and emergency contact"
                rightItem={<Chevron />}
                onPress={noop}
              />
            </SectionGroup>

            {/* ── Destructive area (last) — no trailing border ── */}
            <div>
              <SectionHeader title="Account actions" topPadding={40} />
              <SettingsRow
                label="Stop providing services"
                labelColor={colors.destructive}
                sublabel="Confirm you no longer want to provide services on Rover"
                rightItem={<BlockedIcon />}
                onPress={() => requestDeactivation('__all__')}
              />
            </div>
          </div>
        </div>

        {/* ── Help-link tip ──
            Only renders for approved sitters and when the variant is on
            (matches production's HUB_SERVICE_TIP_NOTIFICATION gate). */}
        {showServiceSettingsHelpTip && profileReviewStatus === 'approved' && (
          <div
            style={{
              maxWidth: 1140,
              width: '100%',
              margin: '0 auto',
              paddingTop: 24,
              paddingBottom: 8,
            }}
          >
            <HelpLinkTip
              linkLabel={HUB_COPY.serviceSettingsHelpTip.linkLabel}
              tipTitle={HUB_COPY.serviceSettingsHelpTip.tipTitle}
              tipBody={HUB_COPY.serviceSettingsHelpTip.tipBody}
            />
          </div>
        )}
        </>
        )}

        <div style={{ paddingTop: 40, paddingBottom: 40 }}>
          <Button
            variant="flat"
            size="small"
            fullWidth
            onClick={() => setConfigSheetOpen(true)}
          >
            Configure variants
          </Button>
        </div>
      </div>

      {profileSheetOpen && <ChooseProfileSheet onDismiss={closeProfileSheet} />}
      {configSheetOpen && (
        <ServiceVariantConfigSheet
          serviceStates={serviceStates}
          familyInGeo={familyInGeo}
          onChangeServiceStates={setServiceStates}
          onChangeFamilyInGeo={setFamilyInGeo}
          onApplyPreset={applyPreset}
          onReset={resetVariants}
          onDismiss={() => setConfigSheetOpen(false)}
        />
      )}

      {/* Service-deactivation confirmation. Open whenever a pending id is set. */}
      <ConfirmDeactivationModal
        open={pendingDeactivationId != null}
        onConfirm={confirmPendingDeactivation}
        onCancel={cancelPendingDeactivation}
      />

      {/* Post-submission modal sequence (once per session). */}
      <AvailabilityModal
        open={activePostSubmissionModal === 'availability'}
        onClose={closeAvailabilityModal}
      />
      <AdditionalPreferencesModal
        open={activePostSubmissionModal === 'preferences'}
        onClose={closeAdditionalPreferencesModal}
      />
    </div>
  )
}
