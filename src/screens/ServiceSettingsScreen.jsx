import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, radius, spacing, typography } from '../tokens'
import {
  BackIcon,
  BlockedIcon,
  BoardingIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DaycareIcon,
  DropInIcon,
  GroomingIcon,
  HouseSitIcon,
  ListIcon,
  PersonIcon,
  TrainingIcon,
  WalkingIcon,
} from '../assets/icons'
import { SITTER_PROFILE } from '../data/sitterProfile'
import {
  ACCEPTANCE_RESTRICTION,
  FAMILY_LABEL,
  FAMILY_ORDER,
  FAMILY_SIGNUP,
  SERVICE_FAMILY,
  getActiveServiceStatusLines,
  getActiveServices,
  getFamilyProfileRows,
  getInactiveServices,
  hasActiveServices,
  isFamilyInGeo,
  isMissingInfoRow,
  joinServiceLabels,
} from '../data/sitterServices'
import { HUB_COPY } from '../data/hubCopy'
import HubBanner from '../components/HubBanner'
import ResubmitButton from '../components/ResubmitButton'
import AvailabilityModal from '../components/AvailabilityModal'
import AdditionalPreferencesModal from '../components/AdditionalPreferencesModal'
import HelpLinkTip from '../components/HelpLinkTip'
import ChooseProfileSheet from '../components/ChooseProfileSheet'
import { useApp } from '../context/AppContext'
import { useMediaQuery } from '../lib/useMediaQuery'

// Service id → icon component. Each service icon hardcodes its own color so
// the rendered visual state cannot drift from the data layer.
const SERVICE_ICON_BY_ID = {
  boarding:      BoardingIcon,
  doggy_daycare: DaycareIcon,
  drop_in:       DropInIcon,
  dog_walking:   WalkingIcon,
  house_sitting: HouseSitIcon,
  dog_training:  TrainingIcon,
  grooming:      GroomingIcon,
}

// Icon shown next to each family's "Other services" sign-up row.
const FAMILY_SIGNUP_ICON = {
  [SERVICE_FAMILY.PET_SITTING]: ListIcon,
  [SERVICE_FAMILY.TRAINING]:    TrainingIcon,
  [SERVICE_FAMILY.GROOMING]:    GroomingIcon,
}

const COLOR_BY_TOKEN = {
  primary: colors.primary,
  secondary: colors.secondary,
  tertiary: colors.tertiary,
  // "Away" service status uses the yellow/price color per production hub treatment.
  price: colors.cautionText,
}

// sessionStorage keys gating the once-per-session post-submission modals.
const SS_KEY_SEEN_AVAILABILITY = 'hub_seen_availability'
const SS_KEY_SEEN_PREFERENCES  = 'hub_seen_preferences'

// ─── Section header (h1) ─────────────────────────────────────────────────────
const SectionHeader = ({ title, rightLinkLabel, onRightLink, topPadding = 24 }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingTop: topPadding,
      paddingBottom: 8,
    }}
  >
    <h1
      style={{
        fontFamily: typography.fontFamily,
        fontWeight: 600,
        fontSize: 20,
        lineHeight: 1.25,
        color: colors.primary,
        margin: 0,
      }}
    >
      {title}
    </h1>
    {rightLinkLabel && (
      <button
        type="button"
        onClick={onRightLink}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: typography.fontFamily,
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1.25,
          color: colors.link,
        }}
      >
        {rightLinkLabel}
      </button>
    )}
  </div>
)

// ─── Sub-section heading (e.g. "Services", "Profile") ────────────────────────
// When `collapsible` is true, the entire row becomes a tap target and a
// right-aligned caret renders (chevron-down when `collapsed`, chevron-up when
// expanded). When `collapsible` is false, defaults preserve the original
// non-interactive render exactly.
//
// `sublabel` (optional) renders as a plain second line under the title — same
// indent, `colors.tertiary`, no warning treatment. Used to surface a
// "Missing information" hint on collapsed sub-sections so participants know to
// expand them. Deliberately understated: not an inset, not a caution color.
const SubHeading = ({
  Icon,
  title,
  sublabel,
  topPadding = 32,
  collapsible = false,
  collapsed = false,
  onToggle,
}) => (
  <div
    onClick={collapsible ? onToggle : undefined}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      paddingTop: topPadding,
      paddingBottom: 8,
      cursor: collapsible ? 'pointer' : 'default',
    }}
  >
    <span
      style={{
        display: 'inline-flex',
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={24} color={colors.secondary} />
    </span>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
      <span
        style={{
          fontFamily: typography.fontFamily,
          fontWeight: 600,
          fontSize: 16,
          lineHeight: 1.5,
          color: colors.primary,
        }}
      >
        {title}
      </span>
      {sublabel && (
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.25,
            color: colors.tertiary,
          }}
        >
          {sublabel}
        </span>
      )}
    </div>
    {collapsible && (
      <span
        style={{
          display: 'inline-flex',
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: 'auto',
        }}
      >
        {collapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
      </span>
    )}
  </div>
)

// ─── Settings row ────────────────────────────────────────────────────────────
// Row-level dividers are intentionally absent — see plan iteration 2a. Section
// boundaries are conveyed by container-level `borderBottom` instead.
const SettingsRow = ({
  leftIcon,
  label,
  labelColor = colors.primary,
  sublabel,
  statusLines,
  rightItem,
  onPress,
}) => {
  const hasCaution = statusLines?.some(
    (line) => typeof line === 'object' && line?.tone === 'caution',
  )
  return (
  <div
    onClick={onPress}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: hasCaution ? 16 : 0,
      paddingRight: hasCaution ? 16 : 0,
      cursor: onPress ? 'pointer' : 'default',
      backgroundColor: hasCaution ? colors.yellow100 : undefined,
      borderRadius: hasCaution ? radius.primary : 0,
    }}
  >
    {leftIcon && (
      <span
        style={{
          display: 'inline-flex',
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {leftIcon}
      </span>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
      <span
        style={{
          fontFamily: typography.fontFamily,
          fontWeight: 600,
          fontSize: 16,
          lineHeight: 1.25,
          color: labelColor,
        }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.25,
            color: colors.tertiary,
          }}
        >
          {sublabel}
        </span>
      )}
      {statusLines && statusLines.map((line, i) => {
        const isCaution = typeof line === 'object' && line.tone === 'caution'
        const text = typeof line === 'string' ? line : line.text
        const colorToken = typeof line === 'object' ? line.color : undefined
        return (
          <span
            key={i}
            style={{
              fontFamily: typography.fontFamily,
              fontWeight: isCaution ? 600 : 400,
              fontSize: 14,
              lineHeight: 1.25,
              color: isCaution
                ? colors.cautionText
                : COLOR_BY_TOKEN[colorToken] ?? colors.tertiary,
            }}
          >
            {text}
          </span>
        )
      })}
    </div>
    {rightItem && (
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {rightItem}
      </div>
    )}
  </div>
  )
}

const Chevron = () => <ChevronRightIcon />

// Resolves a 2-segment dotted path (e.g. `'petSitting.testimonialsComplete'`)
// against the `SITTER_PROFILE.profile` map. Returns `false` if the path is
// missing or undefined.
const resolveCompletion = (path, profile) => {
  if (!path || !profile) return false
  const [head, tail] = path.split('.')
  return !!profile?.[head]?.[tail]
}

// Wraps a top-level section group. Adds 40px bottom padding and a 1px
// trailing border in `colors.border` (#D7DCE0), matching Figma's structure
// where the rule belongs to the section above (not a standalone divider).
// Used for: each active family group, Business, and About you. "Other
// services" and "Destructive area" render without this wrapper because
// Figma drops the rule under those sections.
const SectionGroup = ({ children, borderless = false }) => (
  <div
    style={{
      paddingBottom: 40,
      borderBottom: borderless ? 'none' : `1px solid ${colors.border}`,
    }}
  >
    {children}
  </div>
)

export default function ServiceSettingsScreen() {
  const navigate = useNavigate()
  // Tracks which primary-section families have the "Add a new service" row
  // expanded inline. Keyed by family id.
  const [expandedFamilies, setExpandedFamilies] = useState({})
  // Tracks expanded Services/Profile sub-sections per family. Keyed
  // `{ [family]: { services: true, profile: true } }`. `true` = expanded.
  // Missing key === collapsed (sub-sections default to collapsed when multiple
  // families render). Transient UI state — does not persist.
  const [expandedSubsections, setExpandedSubsections] = useState({})
  const isTwoCol = useMediaQuery('(min-width: 880px)')
  const onBack = () => navigate('/more')
  const noop = () => {}

  // Routes any clickable row that doesn't have a real destination to the
  // generic PlaceholderScreen. Keeps user-testing participants from hitting
  // dead taps — every row lands somewhere they can read + back out of.
  const goTo = (slug) => () => navigate(`/placeholder/${slug}`)

  // Local state for the multi-profile chooser sheet. Pet sitting is the only
  // family with multiple "view as" profiles (pet parent on Rover, cat parent
  // on Rover, cat parent on Cat in a Flat), so its per-family "View profile"
  // link opens the sheet. Training/grooming each have a single conceptual
  // profile and route to the placeholder instead. The top-level
  // "About you → View profile" link likewise routes to the placeholder.
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const openProfileSheet = () => setProfileSheetOpen(true)
  const closeProfileSheet = () => setProfileSheetOpen(false)

  const handleViewProfile = (family) =>
    family === SERVICE_FAMILY.PET_SITTING ? openProfileSheet : goTo('view-profile')

  const {
    serviceStates,
    familyInGeo,
    setFamilyInGeo,
    // ── Hub state variants (Phase C) ─────────────────────────────────────
    profileReviewStatus,
    backgroundCheckStatus,
    searchStatus,
    acceptanceRestrictions,
    showAvailabilityModal,
    showAdditionalPreferencesModal,
    showShortNoticeRateCallout,
    showServiceSettingsHelpTip,
    showRegionalAlertCalifornia,
    setShowRegionalAlertCalifornia,
    showShortNoticeRateBanner,
    showHubFetchError,
    setShowHubFetchError,
    showMissingInfo,
  } = useApp()

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

  const { profile, business } = SITTER_PROFILE

  const primaryFamilies = FAMILY_ORDER.filter((fam) => hasActiveServices(fam, serviceStates))
  const otherFamilies = FAMILY_ORDER.filter(
    (fam) => !hasActiveServices(fam, serviceStates) && isFamilyInGeo(fam, familyInGeo)
  )

  // Carets on Services/Profile sub-headings only render when more than one
  // primary family is active. Single-family variants stay caret-free to match
  // their standalone Figma frames.
  const subsectionsCollapsible = primaryFamilies.length > 1 && !isTwoCol

  // Sub-section missing-info detectors. Used to surface a "Missing information"
  // sublabel on the collapsible Services/Profile sub-headings so participants
  // know which collapsed section hides an incomplete row. Per-family scoped via
  // the new `MISSING_INFO_DEMO_ROWS` map — see `isMissingInfoRow(rowId, family)`.
  const hasMissingService = (family) =>
    getActiveServices(family, serviceStates).some((s) => isMissingInfoRow(s.id, family))
  const hasMissingProfile = (family, profileRows) =>
    profileRows.some((r) => isMissingInfoRow(r.id, family))

  const toggleFamilyExpansion = (family) =>
    setExpandedFamilies((prev) => ({ ...prev, [family]: !prev[family] }))

  const toggleSubsection = (family, key) =>
    setExpandedSubsections((prev) => ({
      ...prev,
      [family]: { ...prev[family], [key]: !prev[family]?.[key] },
    }))

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
          }}
        >
          <BackIcon />
        </button>
        <h1
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 600,
            fontSize: 17,
            lineHeight: 1.25,
            color: colors.primary,
            margin: 0,
          }}
        >
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
            Renders only the error banner. */}
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
        {/* ── Top-of-hub banners + Resubmit ── */}
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

          {backgroundCheckStatus === 'error' && (
            <HubBanner
              severity="error"
              title={HUB_COPY.backgroundCheckError.title}
              body={HUB_COPY.backgroundCheckError.body}
              cta={{ label: HUB_COPY.backgroundCheckError.ctaLabel, onClick: noop }}
            />
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

          {showRegionalAlertCalifornia && (
            <HubBanner
              severity="info"
              title={HUB_COPY.californiaProviderGroup.title}
              body={HUB_COPY.californiaProviderGroup.body}
              cta={{ label: HUB_COPY.californiaProviderGroup.ctaLabel, onClick: noop }}
              onDismiss={() => setShowRegionalAlertCalifornia(false)}
            />
          )}

          {showShortNoticeRateBanner && (
            <HubBanner
              severity="info"
              title={HUB_COPY.shortNoticeRateBanner.title}
              body={HUB_COPY.shortNoticeRateBanner.body}
              cta={{ label: HUB_COPY.shortNoticeRateBanner.ctaLabel, onClick: noop }}
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
            {primaryFamilies.map((family, idx) => {
              const activeServices = getActiveServices(family, serviceStates)
              const inactiveServices = getInactiveServices(family, serviceStates)
              const isExpanded = !!expandedFamilies[family]

              return (
                <SectionGroup key={family} borderless={isTwoCol}>
                  <div>
                    <SectionHeader
                      title={FAMILY_LABEL[family]}
                      rightLinkLabel="View profile"
                      onRightLink={handleViewProfile(family)}
                      topPadding={idx === 0 ? 24 : 40}
                    />

                    {/* Services sub-heading + active rows */}
                    <SubHeading
                      Icon={ListIcon}
                      title="Services"
                      sublabel={
                        subsectionsCollapsible && showMissingInfo && hasMissingService(family)
                          ? 'Missing information'
                          : undefined
                      }
                      topPadding={32}
                      collapsible={subsectionsCollapsible}
                      collapsed={!expandedSubsections[family]?.services}
                      onToggle={() => toggleSubsection(family, 'services')}
                    />
                    {(!subsectionsCollapsible || expandedSubsections[family]?.services) && (
                      <>
                        {activeServices.map((svc) => {
                          const ServiceIcon = SERVICE_ICON_BY_ID[svc.id]
                          const onRowPress =
                            svc.id === 'boarding'
                              ? () => navigate('/service-settings/boarding')
                              : goTo(svc.id.replace(/_/g, '-'))
                          const baseStatusLines = getActiveServiceStatusLines(svc, {
                            state: serviceStates[svc.id],
                            restriction:
                              acceptanceRestrictions?.[svc.id] ?? ACCEPTANCE_RESTRICTION.NONE,
                          })
                          const statusLines =
                            showMissingInfo && isMissingInfoRow(svc.id, svc.family)
                              ? [...baseStatusLines, { text: 'Missing information', tone: 'caution' }]
                              : baseStatusLines
                          return (
                            <SettingsRow
                              key={svc.id}
                              leftIcon={ServiceIcon ? <ServiceIcon /> : null}
                              label={svc.label}
                              statusLines={statusLines}
                              rightItem={<Chevron />}
                              onPress={onRowPress}
                            />
                          )
                        })}

                        {/* Short-notice rate callout — appears inside the services
                            sub-section (distinct from the top-of-hub banner). */}
                        {idx === 0 && showShortNoticeRateCallout && (
                          <div style={{ paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
                            <div
                              style={{
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.primary,
                                padding: 16,
                                background: colors.bgInfo,
                              }}
                            >
                              <p
                                style={{
                                  fontFamily: typography.fontFamily,
                                  fontWeight: 600,
                                  fontSize: 14,
                                  lineHeight: 1.25,
                                  color: colors.primary,
                                  margin: 0,
                                }}
                              >
                                {HUB_COPY.shortNoticeRateCallout.title}
                              </p>
                              <p
                                style={{
                                  fontFamily: typography.fontFamily,
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: 1.5,
                                  color: colors.primary,
                                  margin: '4px 0 0',
                                }}
                              >
                                {HUB_COPY.shortNoticeRateCallout.body}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Add a new service — expandable, reveals inactive services inline */}
                        {inactiveServices.length > 0 && (
                          <>
                            <SettingsRow
                              leftIcon={<ListIcon size={24} color={colors.secondary} />}
                              label="Add a new service"
                              sublabel={joinServiceLabels(inactiveServices)}
                              rightItem={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                              onPress={() => toggleFamilyExpansion(family)}
                            />
                            {isExpanded && inactiveServices.map((svc) => {
                              const ServiceIcon = SERVICE_ICON_BY_ID[svc.id]
                              return (
                                <SettingsRow
                                  key={svc.id}
                                  leftIcon={ServiceIcon ? <ServiceIcon color={colors.tertiary} /> : null}
                                  label={svc.label}
                                  statusLines={[{ text: 'Inactive', color: 'tertiary' }]}
                                  rightItem={<Chevron />}
                                  onPress={goTo(svc.id.replace(/_/g, '-'))}
                                />
                              )
                            })}
                          </>
                        )}
                      </>
                    )}

                    {/* Profile sub-heading + family-specific rows (Phase 3). Rows come
                        from `getFamilyProfileRows(family)` so each family renders
                        its own row set. Skip the SubHeading entirely if a family
                        has no profile rows defined. */}
                    {(() => {
                      const profileRows = getFamilyProfileRows(family)
                      if (profileRows.length === 0) return null
                      return (
                        <>
                          <SubHeading
                            Icon={PersonIcon}
                            title="Profile"
                            sublabel={
                              subsectionsCollapsible && showMissingInfo && hasMissingProfile(family, profileRows)
                                ? 'Missing information'
                                : undefined
                            }
                            topPadding={32}
                            collapsible={subsectionsCollapsible}
                            collapsed={!expandedSubsections[family]?.profile}
                            onToggle={() => toggleSubsection(family, 'profile')}
                          />
                          {(!subsectionsCollapsible || expandedSubsections[family]?.profile) && profileRows.map((row) => {
                            const isComplete = resolveCompletion(row.completionKey, profile)
                            const statusLines =
                              showMissingInfo && isMissingInfoRow(row.id, family)
                                ? [{ text: 'Missing information', tone: 'caution' }]
                                : undefined
                            const familySlug = family.replace(/_/g, '-')
                            const rowSlug = row.id.replace(/_/g, '-')
                            return (
                              <SettingsRow
                                key={row.id}
                                label={row.label}
                                sublabel={row.sublabel}
                                statusLines={statusLines}
                                rightItem={isComplete ? <CheckCircleIcon /> : <Chevron />}
                                onPress={goTo(`${familySlug}.${rowSlug}`)}
                              />
                            )
                          })}
                        </>
                      )
                    })()}
                  </div>
                </SectionGroup>
              )
            })}

            {/* ── Other services ──
                User-testing build: wrap in SectionGroup so it carries a
                trailing border on the single-column phone layout, separating
                it from the Business section that follows. In the two-column
                desktop layout Business sits in Column B, so the border is
                suppressed (`borderless={isTwoCol}`) to match Figma. */}
            {otherFamilies.length > 0 && (
              <SectionGroup borderless={isTwoCol}>
                <SectionHeader title="Other services" topPadding={40} />
                {otherFamilies.map((family) => {
                  const Icon = FAMILY_SIGNUP_ICON[family]
                  const signup = FAMILY_SIGNUP[family]
                  // Training/grooming families each route to their own sign-up
                  // placeholder; pet sitting (rare here, but covered) reuses
                  // the family slug as a fallback.
                  const signupSlug =
                    family === SERVICE_FAMILY.TRAINING ? 'training-signup'
                    : family === SERVICE_FAMILY.GROOMING ? 'grooming-signup'
                    : family.replace(/_/g, '-')
                  return (
                    <SettingsRow
                      key={family}
                      leftIcon={Icon ? <Icon color={colors.tertiary} /> : null}
                      label={signup.label}
                      sublabel={signup.sublabel}
                      rightItem={<Chevron />}
                      onPress={goTo(signupSlug)}
                    />
                  )
                })}
              </SectionGroup>
            )}
          </div>

          {/* Column B: Business + About you + Destructive area */}
          <div>
            {/* ── Business ── */}
            <SectionGroup borderless={isTwoCol}>
              <SectionHeader title="Business" topPadding={isTwoCol ? 24 : 40} />

              <SettingsRow
                label="Availability"
                sublabel="Manage the availability for your pet sitting services"
                rightItem={<Chevron />}
                onPress={goTo('availability')}
              />
              <SettingsRow
                label="Insights"
                sublabel="Check your profile and business performance"
                rightItem={<Chevron />}
                onPress={goTo('insights')}
              />
              <SettingsRow
                label="Promote your profile"
                sublabel="Share your profile link to give pet parents $20 off their first booking."
                rightItem={<Chevron />}
                onPress={goTo('promote')}
              />
              <SettingsRow
                label="Receive payments"
                sublabel="Update payment details on Stripe"
                rightItem={<Chevron />}
                onPress={goTo('payments')}
              />
              <SettingsRow
                label="Background check"
                sublabel={
                  business.backgroundCheckPassed && business.backgroundCheckPassedAt
                    ? `Passed on ${business.backgroundCheckPassedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Required to receive bookings.'
                }
                rightItem={business.backgroundCheckPassed ? <CheckCircleIcon /> : <Chevron />}
                onPress={goTo('background-check')}
              />
            </SectionGroup>

            {/* ── About you ── */}
            <SectionGroup borderless={isTwoCol}>
              <SectionHeader
                title="About you"
                rightLinkLabel="View profile"
                onRightLink={goTo('view-profile')}
                topPadding={40}
              />

              <SettingsRow
                label="Details"
                sublabel="Address, photo, email, and birthday"
                rightItem={<Chevron />}
                onPress={goTo('details')}
              />
              <SettingsRow
                label="Pets"
                sublabel="Add your pets"
                rightItem={<Chevron />}
                onPress={goTo('pets')}
              />
              <SettingsRow
                label="Phone numbers"
                sublabel="Edit your number and emergency contact"
                rightItem={<Chevron />}
                onPress={goTo('phone-numbers')}
              />
              <SettingsRow
                label="Payment methods"
                sublabel="Default method for payments on Rover"
                rightItem={<Chevron />}
                onPress={goTo('payment-methods')}
              />
            </SectionGroup>

            {/* ── Destructive area (last) — no trailing border ── */}
            <div>
              <SectionHeader title="Account actions" topPadding={40} />
              <SettingsRow
                label="Stop providing services"
                labelColor={colors.destructive}
                sublabel="Take your services down. You can sign back up later."
                rightItem={<BlockedIcon />}
                onPress={goTo('stop-providing-services')}
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
      </div>

      {/* Post-submission modal sequence (once per session). */}
      <AvailabilityModal
        open={activePostSubmissionModal === 'availability'}
        onClose={closeAvailabilityModal}
      />
      <AdditionalPreferencesModal
        open={activePostSubmissionModal === 'preferences'}
        onClose={closeAdditionalPreferencesModal}
      />

      {/* Multi-profile chooser — opened from Pet sitting → "View profile". */}
      {profileSheetOpen && <ChooseProfileSheet onDismiss={closeProfileSheet} />}
    </div>
  )
}
