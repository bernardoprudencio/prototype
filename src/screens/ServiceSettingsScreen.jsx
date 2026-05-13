import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, typography } from '../tokens'
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
  DEFAULT_FAMILY_IN_GEO,
  DEFAULT_SERVICE_STATES,
  FAMILY_LABEL,
  FAMILY_ORDER,
  FAMILY_SIGNUP,
  PRESETS,
  SERVICE_FAMILY,
  getActiveServiceStatusLines,
  getActiveServices,
  getFamilyProfileRows,
  getInactiveServices,
  hasActiveServices,
  isFamilyInGeo,
  joinServiceLabels,
} from '../data/sitterServices'
import ChooseProfileSheet from '../components/ChooseProfileSheet'
import ServiceVariantConfigSheet from '../components/ServiceVariantConfigSheet'
import Button from '../components/Button'
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
}

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
const SubHeading = ({
  Icon,
  title,
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
}) => (
  <div
    onClick={onPress}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      paddingTop: 16,
      paddingBottom: 16,
      cursor: onPress ? 'pointer' : 'default',
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
      {statusLines && statusLines.map((line, i) => (
        <span
          key={i}
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.25,
            color: COLOR_BY_TOKEN[line.color] ?? colors.tertiary,
          }}
        >
          {line.text}
        </span>
      ))}
    </div>
    {rightItem && (
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {rightItem}
      </div>
    )}
  </div>
)

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
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [configSheetOpen, setConfigSheetOpen] = useState(false)
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
  } = useApp()

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

  const { profile, business } = SITTER_PROFILE

  const primaryFamilies = FAMILY_ORDER.filter((fam) => hasActiveServices(fam, serviceStates))
  const otherFamilies = FAMILY_ORDER.filter(
    (fam) => !hasActiveServices(fam, serviceStates) && isFamilyInGeo(fam, familyInGeo)
  )

  // Carets on Services/Profile sub-headings only render when more than one
  // primary family is active. Single-family variants stay caret-free to match
  // their standalone Figma frames.
  const subsectionsCollapsible = primaryFamilies.length > 1 && !isTwoCol

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
                              : noop
                          return (
                            <SettingsRow
                              key={svc.id}
                              leftIcon={ServiceIcon ? <ServiceIcon /> : null}
                              label={svc.label}
                              statusLines={getActiveServiceStatusLines(svc)}
                              rightItem={<Chevron />}
                              onPress={onRowPress}
                            />
                          )
                        })}

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
                                  onPress={noop}
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
                            topPadding={32}
                            collapsible={subsectionsCollapsible}
                            collapsed={!expandedSubsections[family]?.profile}
                            onToggle={() => toggleSubsection(family, 'profile')}
                          />
                          {(!subsectionsCollapsible || expandedSubsections[family]?.profile) && profileRows.map((row) => {
                            const isComplete = resolveCompletion(row.completionKey, profile)
                            return (
                              <SettingsRow
                                key={row.id}
                                label={row.label}
                                sublabel={row.sublabel}
                                rightItem={isComplete ? <CheckCircleIcon /> : <Chevron />}
                                onPress={noop}
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

            {/* ── Other services ── (no trailing border in Figma) */}
            {otherFamilies.length > 0 && (
              <div>
                <SectionHeader title="Other services" topPadding={40} />
                {otherFamilies.map((family) => {
                  const Icon = FAMILY_SIGNUP_ICON[family]
                  const signup = FAMILY_SIGNUP[family]
                  return (
                    <SettingsRow
                      key={family}
                      leftIcon={Icon ? <Icon color={colors.tertiary} /> : null}
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
              <SectionHeader title="Business" topPadding={isTwoCol ? 24 : 40} />

              <SettingsRow
                label="Availability"
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
                sublabel="Share your profile link to give pet parents $20 off their first booking."
                rightItem={<Chevron />}
                onPress={noop}
              />
              <SettingsRow
                label="Receive payments"
                sublabel="Update payment details on Stripe"
                rightItem={<Chevron />}
                onPress={noop}
              />
              <SettingsRow
                label="Background check"
                sublabel={
                  business.backgroundCheckPassed && business.backgroundCheckPassedAt
                    ? `Passed on ${business.backgroundCheckPassedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Required to receive bookings.'
                }
                rightItem={business.backgroundCheckPassed ? <CheckCircleIcon /> : <Chevron />}
                onPress={noop}
              />
            </SectionGroup>

            {/* ── About you ── */}
            <SectionGroup borderless={isTwoCol}>
              <SectionHeader
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
              <SettingsRow
                label="Payment methods"
                sublabel="Default method for payments on Rover"
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
                sublabel="Take your services down. You can sign back up later."
                rightItem={<BlockedIcon />}
                onPress={noop}
              />
            </div>
          </div>
        </div>

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
    </div>
  )
}
