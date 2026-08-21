import React from 'react'
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { colors, textStyles } from '../tokens'
import { BackIcon, GridPlusIcon, ListIcon, PersonIcon } from '../assets/icons'
import { FAMILY_LABEL, FAMILY_ROW_COPY } from '../data/sitterServices'
import { HUB_COPY } from '../data/hubCopy'
import Button from '../components/Button'
import HubBanner from '../components/HubBanner'
import ResubmitButton from '../components/ResubmitButton'
import HelpLinkTip from '../components/HelpLinkTip'
import { Chevron, SectionGroup, SectionHeader, SettingsRow } from '../components/hubUI'
import {
  AboutYouRows,
  AccountActionsRows,
  AccountWideBanners,
  BusinessRows,
  OtherServicesRows,
} from './hubSections'
import { FAMILY_ICON } from './ServiceSettingsLayout'
import { useApp } from '../context/AppContext'

/**
 * `/service-settings` — the mobile hub index: two rows per active family
 * drilling into the per-family sub-pages, then Other services, Business, About
 * you and Account actions.
 *
 * At 769px and up this address has no content of its own: the layout renders a
 * sidebar whose first item is the landing pane, so we redirect there and let the
 * URL name the visible pane.
 */
export default function ServiceSettingsScreen() {
  const navigate = useNavigate()
  const {
    isWide,
    firstNavTo,
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
    openConfigSheet,
    noop,
  } = useOutletContext()
  const { showServiceSettingsHelpTip } = useApp()

  if (isWide) return <Navigate to={firstNavTo} replace />

  const onBack = () => navigate('/more')

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
          {HUB_COPY.sideNav.title}
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
          <div style={{ paddingTop: 40, paddingBottom: 40 }}>
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
            Only the genuinely account-wide states live here; every
            family-scoped banner renders inside its own section via bannersFor. */}
        <div style={{ paddingTop: 16 }}>
          {profileReviewStatus === 'borderline' && (
            <div style={{ marginBottom: 12 }}>
              <ResubmitButton onClick={noop} />
            </div>
          )}

          <AccountWideBanners
            searchStatus={searchStatus}
            showCiafMigrationOnboarding={showCiafMigrationOnboarding}
            onDismissCiaf={() => setShowCiafMigrationOnboarding(false)}
            noop={noop}
          />
        </div>

        {primaryFamilies.map((family, idx) => (
          <SectionGroup key={family}>
            <SectionHeader
              Icon={FAMILY_ICON[family]}
              title={FAMILY_LABEL[family]}
              rightLinkLabel="View profile"
              onRightLink={handleViewProfile(family)}
              topPadding={idx === 0 ? 24 : 40}
            />

            {bannersFor(family, 'services')}

            <SettingsRow
              label={HUB_COPY.familyTabs.services}
              sublabel={FAMILY_ROW_COPY[family]?.services}
              needsReview={needsReview(family, 'services')}
              rightItem={<Chevron />}
              onPress={() => navigate(`/service-settings/services/${family}`)}
            />
            <SettingsRow
              label={HUB_COPY.familyTabs.profile}
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
            <SectionHeader
              Icon={GridPlusIcon}
              title={HUB_COPY.sideNav.otherServices}
              topPadding={40}
            />
            <OtherServicesRows families={otherFamilies} noop={noop} />
          </div>
        )}

        {/* ── Business ── */}
        <SectionGroup>
          <SectionHeader Icon={ListIcon} title="Business" topPadding={40} />
          <BusinessRows
            isWide={false}
            business={business}
            backgroundCheckStatus={backgroundCheckStatus}
            noop={noop}
          />
        </SectionGroup>

        {/* ── About you ── */}
        <SectionGroup>
          <SectionHeader
            Icon={PersonIcon}
            title="About you"
            rightLinkLabel="View profile"
            onRightLink={noop}
            topPadding={40}
          />
          <AboutYouRows noop={noop} />
        </SectionGroup>

        {/* ── Destructive area (last) — no trailing border ── */}
        <div>
          <SectionHeader title={HUB_COPY.accountActions.heading} topPadding={40} />
          <AccountActionsRows onStopProviding={() => requestDeactivation('__all__')} />
        </div>

        {/* ── Help-link tip ──
            Only renders for approved sitters and when the variant is on
            (matches production's HUB_SERVICE_TIP_NOTIFICATION gate). */}
        {showServiceSettingsHelpTip && profileReviewStatus === 'approved' && (
          <div style={{ paddingTop: 24, paddingBottom: 8 }}>
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
          <Button variant="flat" size="small" fullWidth onClick={openConfigSheet}>
            Configure variants
          </Button>
        </div>
      </div>
    </div>
  )
}
