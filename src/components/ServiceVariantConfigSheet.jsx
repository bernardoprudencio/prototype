import React, { useEffect, useRef, useState } from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import Chip from './Chip'
import { colors, typography } from '../tokens'
import {
  ACCEPTANCE_RESTRICTION,
  FAMILY_LABEL,
  FAMILY_ORDER,
  PRESET_LABEL,
  PRESET_ORDER,
  SERVICE_FAMILY,
  SERVICE_STATE,
  getFamilyServices,
  isFamilyInGeo,
} from '../data/sitterServices'
import { useApp } from '../context/AppContext'

const Header = () => (
  <div style={{ paddingTop: 8, paddingBottom: 16 }}>
    <h2
      style={{
        margin: 0,
        fontFamily: typography.fontFamily,
        fontWeight: 600,
        fontSize: 20,
        lineHeight: 1.25,
        color: colors.primary,
      }}
    >
      Configure variants
    </h2>
    <div
      style={{
        marginTop: 4,
        fontFamily: typography.fontFamily,
        fontWeight: 400,
        fontSize: 14,
        lineHeight: 1.25,
        color: colors.tertiary,
      }}
    >
      Dev only — not in spec
    </div>
  </div>
)

const SectionLabel = ({ children, topPadding = 24 }) => (
  <div
    style={{
      paddingTop: topPadding,
      paddingBottom: 8,
      fontFamily: typography.fontFamily,
      fontWeight: 600,
      fontSize: 16,
      lineHeight: 1.25,
      color: colors.primary,
    }}
  >
    {children}
  </div>
)

const SubLabel = ({ children, topPadding = 16 }) => (
  <div
    style={{
      paddingTop: topPadding,
      paddingBottom: 4,
      fontFamily: typography.fontFamily,
      fontWeight: 600,
      fontSize: 14,
      lineHeight: 1.25,
      color: colors.tertiary,
    }}
  >
    {children}
  </div>
)

const HelperNote = ({ children }) => (
  <div
    style={{
      paddingTop: 2,
      paddingBottom: 6,
      fontFamily: typography.fontFamily,
      fontWeight: 400,
      fontSize: 12,
      lineHeight: 1.4,
      color: colors.tertiary,
    }}
  >
    {children}
  </div>
)

const ConfigRow = ({ label, children, disabled, note, wrapOptions }) => (
  <div
    style={{
      paddingTop: 6,
      paddingBottom: 6,
      opacity: disabled ? 0.4 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        // When the option set wraps (4+ chips), stack the label above the chips
        // so neither overlaps inside the sheet's content width.
        flexDirection: wrapOptions ? 'column' : 'row',
        alignItems: wrapOptions ? 'stretch' : 'center',
      }}
    >
      <span
        style={{
          fontFamily: typography.fontFamily,
          fontWeight: 400,
          fontSize: 14,
          lineHeight: 1.25,
          color: colors.primary,
          flex: 1,
          minWidth: 0,
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexShrink: 0,
          flexWrap: wrapOptions ? 'wrap' : 'nowrap',
        }}
      >
        {children}
      </div>
    </div>
    {note && <HelperNote>{note}</HelperNote>}
  </div>
)

// Renders an array of {id, label} options as the existing small Chip toggle
// group. Used for both 2-option booleans and 3/4-option enums to keep one
// visual language across the sheet.
const OptionToggle = ({ value, onChange, options, disabled }) => (
  <>
    {options.map((opt) => (
      <Chip
        key={opt.id}
        label={opt.label}
        selected={value === opt.id}
        checkmark
        size="small"
        disabled={disabled}
        onClick={() => onChange(opt.id)}
      />
    ))}
  </>
)

const BOOL_OPTIONS = [
  { id: 'off', label: 'Off' },
  { id: 'on', label: 'On' },
]
const boolToId = (v) => (v ? 'on' : 'off')
const idToBool = (id) => id === 'on'

const PROFILE_REVIEW_OPTIONS = [
  { id: 'pending',    label: 'Pending'    },
  { id: 'borderline', label: 'Borderline' },
  { id: 'approved',   label: 'Approved'   },
]
const BACKGROUND_CHECK_OPTIONS = [
  { id: 'pending',  label: 'Pending'  },
  { id: 'verified', label: 'Verified' },
  { id: 'error',    label: 'Error'    },
]
const SEARCH_STATUS_OPTIONS = [
  { id: 'active',      label: 'Active'        },
  { id: 'away_manual', label: 'Away (manual)' },
  { id: 'away_auto',   label: 'Away (auto)'   },
]
const SERVICE_STATE_OPTIONS = [
  { id: SERVICE_STATE.ACTIVE,   label: 'Active'   },
  { id: SERVICE_STATE.AWAY,     label: 'Away'     },
  { id: SERVICE_STATE.INACTIVE, label: 'Inactive' },
]
const ACCEPTANCE_OPTIONS = [
  { id: ACCEPTANCE_RESTRICTION.NONE,           label: 'All'            },
  { id: ACCEPTANCE_RESTRICTION.REPEAT_ONLY,    label: 'Repeat only'    },
  { id: ACCEPTANCE_RESTRICTION.RECURRING_ONLY, label: 'Recurring only' },
  { id: ACCEPTANCE_RESTRICTION.ONE_TIME_ONLY,  label: 'One-time only'  },
]

export default function ServiceVariantConfigSheet({
  serviceStates,
  familyInGeo,
  onChangeServiceStates,
  onChangeFamilyInGeo,
  onApplyPreset,
  onReset,
  onDismiss,
}) {
  const [lastAppliedPreset, setLastAppliedPreset] = useState(null)
  const flashTimeoutRef = useRef(null)

  // Hub-state values come from app context so this sheet centralizes every
  // service-settings-related variant in one place without threading 14+ props
  // through ServiceSettingsScreen.
  const {
    profileReviewStatus,           setProfileReviewStatus,
    backgroundCheckStatus,         setBackgroundCheckStatus,
    searchStatus,                  setSearchStatus,
    acceptanceRestrictions,        setAcceptanceRestrictions,
    showAvailabilityModal,          setShowAvailabilityModal,
    showAdditionalPreferencesModal, setShowAdditionalPreferencesModal,
    showConfirmServiceDeactivation, setShowConfirmServiceDeactivation,
    showShortNoticeRateCallout,     setShowShortNoticeRateCallout,
    showServiceSettingsHelpTip,     setShowServiceSettingsHelpTip,
    showRegionalAlertCalifornia,    setShowRegionalAlertCalifornia,
    showShortNoticeRateBanner,      setShowShortNoticeRateBanner,
    showHubFetchError,              setShowHubFetchError,
    showMissingInfo,                setShowMissingInfo,
  } = useApp()

  useEffect(
    () => () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current)
      }
    },
    [],
  )

  const setServiceState = (id, state) =>
    onChangeServiceStates({ ...serviceStates, [id]: state })

  const setRestriction = (id, value) =>
    setAcceptanceRestrictions({ ...acceptanceRestrictions, [id]: value })

  const setFamilyGeo = (family, value) =>
    onChangeFamilyInGeo({ ...familyInGeo, [family]: value })

  const toggleFamilyGeo = (family, inGeo) => {
    setFamilyGeo(family, inGeo)
    if (!inGeo) {
      const services = getFamilyServices(family)
      const nextStates = { ...serviceStates }
      services.forEach((svc) => {
        nextStates[svc.id] = SERVICE_STATE.INACTIVE
      })
      onChangeServiceStates(nextStates)
    }
  }

  const handlePresetTap = (key) => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current)
    }
    setLastAppliedPreset(key)
    onApplyPreset(key)
    flashTimeoutRef.current = setTimeout(() => {
      setLastAppliedPreset(null)
      flashTimeoutRef.current = null
    }, 300)
  }

  const searchStatusDisabled = profileReviewStatus !== 'approved'

  return (
    <BottomSheet variant="full" onDismiss={onDismiss} header={<Header />}>
      {/* ── Hub state — post-submission ───────────────────────────────────
          Page-level state for the hub. Lives above per-service config so
          it reads top-down: hub status → catalog → service detail. */}
      <SectionLabel topPadding={8}>Hub state — post-submission</SectionLabel>

      <ConfigRow label="Profile review status" wrapOptions>
        <OptionToggle
          value={profileReviewStatus}
          onChange={setProfileReviewStatus}
          options={PROFILE_REVIEW_OPTIONS}
        />
      </ConfigRow>

      <ConfigRow label="Background check" wrapOptions>
        <OptionToggle
          value={backgroundCheckStatus}
          onChange={setBackgroundCheckStatus}
          options={BACKGROUND_CHECK_OPTIONS}
        />
      </ConfigRow>

      <ConfigRow
        label="Search status"
        disabled={searchStatusDisabled}
        note={searchStatusDisabled ? 'Only relevant when profile is approved' : undefined}
        wrapOptions
      >
        <OptionToggle
          value={searchStatus}
          onChange={setSearchStatus}
          options={SEARCH_STATUS_OPTIONS}
          disabled={searchStatusDisabled}
        />
      </ConfigRow>

      <SubLabel>Modals & callouts</SubLabel>

      <ConfigRow label="Post-submission Availability modal">
        <OptionToggle
          value={boolToId(showAvailabilityModal)}
          onChange={(id) => setShowAvailabilityModal(idToBool(id))}
          options={BOOL_OPTIONS}
        />
      </ConfigRow>

      <ConfigRow
        label="Post-submission Preferences modal"
        note="Shows after Availability modal if both are enabled"
      >
        <OptionToggle
          value={boolToId(showAdditionalPreferencesModal)}
          onChange={(id) => setShowAdditionalPreferencesModal(idToBool(id))}
          options={BOOL_OPTIONS}
        />
      </ConfigRow>

      <ConfigRow label="Deactivation confirmation modal">
        <OptionToggle
          value={boolToId(showConfirmServiceDeactivation)}
          onChange={(id) => setShowConfirmServiceDeactivation(idToBool(id))}
          options={BOOL_OPTIONS}
        />
      </ConfigRow>

      <ConfigRow
        label="Missing information line"
        note="Adds a 'Missing information' line to rows with unset optional settings (post-submission only)."
      >
        <OptionToggle
          value={boolToId(showMissingInfo)}
          onChange={(id) => setShowMissingInfo(idToBool(id))}
          options={BOOL_OPTIONS}
        />
      </ConfigRow>

      <ConfigRow label="Short-notice rate callout">
        <OptionToggle
          value={boolToId(showShortNoticeRateCallout)}
          onChange={(id) => setShowShortNoticeRateCallout(idToBool(id))}
          options={BOOL_OPTIONS}
        />
      </ConfigRow>

      <ConfigRow
        label="Service settings help tip"
        note="Only shows when profile is approved"
      >
        <OptionToggle
          value={boolToId(showServiceSettingsHelpTip)}
          onChange={(id) => setShowServiceSettingsHelpTip(idToBool(id))}
          options={BOOL_OPTIONS}
        />
      </ConfigRow>

      <ConfigRow label="California regional alert">
        <OptionToggle
          value={boolToId(showRegionalAlertCalifornia)}
          onChange={(id) => setShowRegionalAlertCalifornia(idToBool(id))}
          options={BOOL_OPTIONS}
        />
      </ConfigRow>

      <ConfigRow label="Short-notice rate banner">
        <OptionToggle
          value={boolToId(showShortNoticeRateBanner)}
          onChange={(id) => setShowShortNoticeRateBanner(idToBool(id))}
          options={BOOL_OPTIONS}
        />
      </ConfigRow>

      <ConfigRow label="Hub fetch error state">
        <OptionToggle
          value={boolToId(showHubFetchError)}
          onChange={(id) => setShowHubFetchError(idToBool(id))}
          options={BOOL_OPTIONS}
        />
      </ConfigRow>

      {/* Geo availability */}
      <SectionLabel>Geo availability</SectionLabel>
      {FAMILY_ORDER.filter((f) => f !== SERVICE_FAMILY.PET_SITTING).map((family) => {
        const inGeo = !!familyInGeo[family]
        return (
          <ConfigRow key={family} label={FAMILY_LABEL[family]}>
            <Chip
              label="In geo"
              selected={inGeo}
              checkmark
              size="small"
              onClick={() => toggleFamilyGeo(family, true)}
            />
            <Chip
              label="Not in geo"
              selected={!inGeo}
              checkmark
              size="small"
              onClick={() => toggleFamilyGeo(family, false)}
            />
          </ConfigRow>
        )
      })}

      {/* Quick presets */}
      <SectionLabel>Quick presets</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {PRESET_ORDER.map((key) => (
          <Chip
            key={key}
            label={PRESET_LABEL[key]}
            size="small"
            selected={lastAppliedPreset === key}
            onClick={() => handlePresetTap(key)}
          />
        ))}
      </div>

      {/* Per-service state */}
      <SectionLabel>Per-service state</SectionLabel>
      {FAMILY_ORDER.map((family) => {
        const services = getFamilyServices(family)
        const familyInGeoNow = isFamilyInGeo(family, familyInGeo)
        return (
          <div key={family}>
            <SubLabel>{FAMILY_LABEL[family]}</SubLabel>
            {services.map((svc) => {
              const state = serviceStates[svc.id] ?? SERVICE_STATE.INACTIVE
              const restriction =
                acceptanceRestrictions?.[svc.id] ?? ACCEPTANCE_RESTRICTION.NONE
              const restrictionDisabled =
                !familyInGeoNow || state === SERVICE_STATE.INACTIVE
              return (
                <React.Fragment key={svc.id}>
                  <ConfigRow label={svc.label} wrapOptions>
                    <OptionToggle
                      value={state}
                      onChange={(next) => setServiceState(svc.id, next)}
                      options={SERVICE_STATE_OPTIONS}
                      disabled={!familyInGeoNow}
                    />
                  </ConfigRow>
                  <ConfigRow
                    label="Accepting new customers"
                    disabled={restrictionDisabled}
                    note={
                      restrictionDisabled && familyInGeoNow
                        ? 'Only relevant when service is active or away'
                        : undefined
                    }
                    wrapOptions
                  >
                    <OptionToggle
                      value={restriction}
                      onChange={(next) => setRestriction(svc.id, next)}
                      options={ACCEPTANCE_OPTIONS}
                      disabled={restrictionDisabled}
                    />
                  </ConfigRow>
                </React.Fragment>
              )
            })}
          </div>
        )
      })}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 24,
          paddingBottom: 8,
        }}
      >
        <Button variant="flat" size="small" onClick={onReset}>
          Reset to default
        </Button>
        <Button variant="default" size="small" onClick={onDismiss}>
          Done
        </Button>
      </div>
    </BottomSheet>
  )
}
