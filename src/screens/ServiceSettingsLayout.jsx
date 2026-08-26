import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { colors, layout } from '../tokens'
import {
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
import ConfirmDeactivationModal from '../components/ConfirmDeactivationModal'
import AvailabilityModal from '../components/AvailabilityModal'
import AdditionalPreferencesModal from '../components/AdditionalPreferencesModal'
import HelpLinkTip from '../components/HelpLinkTip'
import { HubSideNav } from '../components/hubUI'
import { AccountWideBanners } from './hubSections'
import { useApp } from '../context/AppContext'
import { useIsWide } from '../lib/useMediaQuery'

// Icon on each family's sidebar row / mobile section header, and on its
// "Other services" sign-up row.
export const FAMILY_ICON = {
  [SERVICE_FAMILY.PET_SITTING]: PawIcon,
  [SERVICE_FAMILY.TRAINING]:    TrainingIcon,
  [SERVICE_FAMILY.GROOMING]:    GroomingIcon,
}

// sessionStorage keys gating the once-per-session post-submission modals.
const SS_KEY_SEEN_AVAILABILITY = 'hub_seen_availability'
const SS_KEY_SEEN_PREFERENCES  = 'hub_seen_preferences'

/**
 * Layout route for `/service-settings/*`. It owns every piece of state the hub
 * and its panes share — variant flags, deactivation, the post-submission modal
 * sequence, the family-scoped banner selector — and hands them to the panes
 * through the outlet context.
 *
 * Below 769px it is transparent: it renders the outlet and nothing else, so the
 * mobile IA (index → drill-down sub-pages) is unchanged. At 769px and up it
 * becomes the master-detail layout from Figma 608:55002 / 1548:5507: a sidebar
 * of nav items on the left, the selected pane on the right, and Services |
 * Profile as tabs inside the family panes rather than separate pages.
 */
export default function ServiceSettingsLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isWide = useIsWide()
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [configSheetOpen, setConfigSheetOpen] = useState(false)
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
  // On mobile each attention banner renders inside its own family's section
  // rather than in a global stack at the top of the hub: Services-scoped banners
  // sit between the section header and the Services row, Profile-scoped ones sit
  // below the Profile row. `scope` on each HUB_COPY entry records which. At wide
  // width the family pane stacks both slots between its title and its tab bar
  // (Figma 4233:29652).
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

  // ── Sidebar model ──────────────────────────────────────────────────────
  // One item per active family, then "Other services" (only while a family is
  // inactive but in geo — Figma 613:41571 vs 613:41119), then Business and
  // About you. The Review badge is per nav item rather than per slot: Figma
  // 4233:41097 badges Pet sitting and Business while Training is selected, and
  // no frame ever badges a tab.
  const navItems = [
    ...primaryFamilies.map((family) => ({
      key: family,
      label: FAMILY_LABEL[family],
      Icon: FAMILY_ICON[family],
      to: `/service-settings/services/${family}`,
      badge: needsReview(family, 'services') || needsReview(family, 'profile'),
      prefixes: [
        `/service-settings/services/${family}`,
        `/service-settings/profile/${family}`,
      ],
    })),
    ...(otherFamilies.length > 0
      ? [{
          key: 'other',
          label: HUB_COPY.sideNav.otherServices,
          Icon: GridPlusIcon,
          to: '/service-settings/other',
          prefixes: ['/service-settings/other'],
        }]
      : []),
    {
      key: 'business',
      label: 'Business',
      Icon: ListIcon,
      to: '/service-settings/business',
      badge: backgroundCheckStatus === 'error',
      prefixes: ['/service-settings/business'],
    },
    {
      key: 'about',
      label: 'About you',
      Icon: PersonIcon,
      to: '/service-settings/about',
      prefixes: ['/service-settings/about'],
    },
  ]

  const activeItem = navItems.find((item) =>
    item.prefixes.some((prefix) => location.pathname.startsWith(prefix))
  )

  // A pane can outlive its nav item — deactivating the last service in a family
  // (or applying a preset that does) drops that family from the sidebar while
  // its URL is still current. Fall back to the first item so the visible pane is
  // always the selected one.
  const orphanedPane =
    isWide && !activeItem && location.pathname !== '/service-settings'

  const configureVariants = (
    <div style={{ paddingTop: 40, paddingBottom: 40 }}>
      <Button variant="flat" size="small" fullWidth onClick={() => setConfigSheetOpen(true)}>
        Configure variants
      </Button>
    </div>
  )

  const helpLinkTip =
    showServiceSettingsHelpTip && profileReviewStatus === 'approved' ? (
      <div style={{ paddingTop: 24, paddingBottom: 8 }}>
        <HelpLinkTip
          linkLabel={HUB_COPY.serviceSettingsHelpTip.linkLabel}
          tipTitle={HUB_COPY.serviceSettingsHelpTip.tipTitle}
          tipBody={HUB_COPY.serviceSettingsHelpTip.tipBody}
        />
      </div>
    ) : null

  // Context shared with every pane. `firstNavTo` is what the index redirects to
  // at wide width, so the URL always names a real pane.
  const outletContext = {
    isWide,
    firstNavTo: navItems[0].to,
    bannersFor,
    needsReview,
    primaryFamilies,
    otherFamilies,
    business,
    profileReviewStatus,
    backgroundCheckStatus,
    searchStatus,
    showCiafMigrationOnboarding,
    setShowCiafMigrationOnboarding,
    showHubFetchError,
    setShowHubFetchError,
    handleViewProfile,
    requestDeactivation,
    openConfigSheet: () => setConfigSheetOpen(true),
    noop,
  }

  const sheets = (
    <>
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
    </>
  )

  // ── Narrow: the shipped mobile IA, untouched ────────────────────────────
  if (!isWide) {
    return (
      <>
        <Outlet context={outletContext} />
        {sheets}
      </>
    )
  }

  // ── Wide: sidebar | rule | pane ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      <div
        className="hide-scrollbar"
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        {/* Account-wide banners span the full viewport width, above the split
            (Figma 4303:43590). */}
        <AccountWideBanners
          searchStatus={searchStatus}
          showCiafMigrationOnboarding={showCiafMigrationOnboarding}
          onDismissCiaf={() => setShowCiafMigrationOnboarding(false)}
          noop={noop}
        />

        {showHubFetchError ? (
          <div style={{ maxWidth: layout.contentWidth, margin: '0 auto', padding: '40px 16px' }}>
            <HubBanner
              severity="error"
              title={HUB_COPY.hubFetchError.title}
              body={HUB_COPY.hubFetchError.body}
              cta={{
                label: HUB_COPY.hubFetchError.ctaLabel,
                onClick: () => setShowHubFetchError(false),
              }}
            />
            {configureVariants}
          </div>
        ) : orphanedPane ? (
          <Navigate to={navItems[0].to} replace />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              // Grows to the viewport so the rule between the panes runs full
              // height even when the pane is short.
              flex: 1,
              maxWidth: layout.contentWidth,
              width: '100%',
              margin: '0 auto',
              paddingTop: 24,
            }}
          >
            {/* Sidebar. 375px content box at desktop (608:55002); the tablet
                frame (1548:5507) narrows it to 280 rather than wrapping, which
                is what the percentage plus the two clamps give us. */}
            <div
              style={{
                width: '33%',
                maxWidth: 375,
                minWidth: 280,
                flexShrink: 0,
                paddingLeft: 16,
              }}
            >
              <HubSideNav
                title={HUB_COPY.sideNav.title}
                items={navItems}
                activeKey={activeItem?.key}
                onSelect={(item) => navigate(item.to)}
                onStopProviding={() => requestDeactivation('__all__')}
              />
            </div>

            {/* Full-height rule between the panes. */}
            <div style={{ width: 1, background: colors.border, flexShrink: 0 }} />

            <div style={{ flex: 1, minWidth: 0, paddingLeft: 48, paddingRight: 20 }}>
              <Outlet context={outletContext} />
              {helpLinkTip}
              {configureVariants}
            </div>
          </div>
        )}
      </div>

      {sheets}
    </div>
  )
}
