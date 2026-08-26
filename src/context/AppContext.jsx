import React, { createContext, useContext, useState } from 'react'
import { DEFAULT_FAMILY_IN_GEO, DEFAULT_SERVICE_STATES } from '../data/sitterServices'
import { mergeAvailabilityPatches } from '../lib/calendarUtils'
import { lockedSeedFor } from '../data/lockableRates'

const AppContext = createContext(null)

const SCHEDULE_MODE_KEY = 'scheduleMode'
const readInitialMode = () => {
  if (typeof window === 'undefined') return 'modification'
  return window.localStorage.getItem(SCHEDULE_MODE_KEY) ?? 'modification'
}

const SERVICE_STATES_KEY = 'serviceStates'
const FAMILY_IN_GEO_KEY = 'familyInGeo'

const readInitialServiceStates = () => {
  if (typeof window === 'undefined') return DEFAULT_SERVICE_STATES
  const raw = window.localStorage.getItem(SERVICE_STATES_KEY)
  if (!raw) return DEFAULT_SERVICE_STATES
  try { return JSON.parse(raw) } catch { return DEFAULT_SERVICE_STATES }
}

const readInitialFamilyInGeo = () => {
  if (typeof window === 'undefined') return DEFAULT_FAMILY_IN_GEO
  const raw = window.localStorage.getItem(FAMILY_IN_GEO_KEY)
  if (!raw) return DEFAULT_FAMILY_IN_GEO
  try { return JSON.parse(raw) } catch { return DEFAULT_FAMILY_IN_GEO }
}

// ── Hub state variants ──────────────────────────────────────────────────
// Storage keys + default-reading helpers for the provider-profile
// management hub variants exposed via the Testing Mode sheet.
const PROFILE_REVIEW_STATUS_KEY            = 'profileReviewStatus'
const BACKGROUND_CHECK_STATUS_KEY          = 'backgroundCheckStatus'
const SEARCH_STATUS_KEY                    = 'searchStatus'
const ACCEPTANCE_RESTRICTIONS_KEY          = 'acceptanceRestrictions'
const SHOW_AVAILABILITY_MODAL_KEY          = 'showAvailabilityModal'
const SHOW_ADDITIONAL_PREFERENCES_MODAL_KEY = 'showAdditionalPreferencesModal'
const SHOW_CONFIRM_SERVICE_DEACTIVATION_KEY = 'showConfirmServiceDeactivation'
const SHOW_SERVICE_SETTINGS_HELP_TIP_KEY   = 'showServiceSettingsHelpTip'
const SHOW_REGIONAL_ALERT_CALIFORNIA_KEY   = 'showRegionalAlertCalifornia'
const SHOW_SHORT_NOTICE_RATE_BANNER_KEY    = 'showShortNoticeRateBanner'
const SHOW_HUB_FETCH_ERROR_KEY             = 'showHubFetchError'
const SHOW_CIAF_MIGRATION_ONBOARDING_KEY        = 'showCiafMigrationOnboarding'
const SHOW_TRAINING_CREDENTIALS_UPLOAD_KEY      = 'showTrainingCredentialsUploadBanner'
const SHOW_GROOMING_PROFILE_REVIEW_KEY          = 'showGroomingProfileReviewBanner'
// Which grooming attention banner renders when the flag above is on:
//   'review'       — "Your groomer profile is under review."
//   'not_findable' — "Pet parents can't find your grooming services yet."
const GROOMING_BANNER_VARIANT_KEY               = 'groomingBannerVariant'
const SHOW_LOCKED_RATES_KEY                     = 'showLockedRates'
const CALENDAR_SAVE_FAILS_KEY                   = 'calendarSaveFails'
// Which locked-rates experience renders:
//   'granular' — the POC proposal (per-rate amounts, one modal, review step)
//   'current'  — today's binary lock switch + confirmation sheet
// This branch exists to user-test the proposal, so 'granular' is the default and
// 'current' is the comparison flip.
const RATES_MODE_KEY                            = 'ratesMode'
// Named after production's gate `is_rollout_alt_monetisation`
// (roverdotcom/web :: RelationshipProgressScreenView, views.py:1011-1013).
const ALT_MONETIZATION_ROLLOUT_KEY              = 'altMonetizationRollout'

const readInitialEnum = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

const readInitialBool = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (raw == null) return fallback
  try { return JSON.parse(raw) } catch { return fallback }
}

const readInitialAcceptanceRestrictions = () => {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(ACCEPTANCE_RESTRICTIONS_KEY)
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

const readInitialProfileReviewStatus      = () => readInitialEnum(PROFILE_REVIEW_STATUS_KEY,   'approved')
const readInitialBackgroundCheckStatus    = () => readInitialEnum(BACKGROUND_CHECK_STATUS_KEY, 'verified')
const readInitialSearchStatus             = () => readInitialEnum(SEARCH_STATUS_KEY,           'active')

const readInitialShowAvailabilityModal           = () => readInitialBool(SHOW_AVAILABILITY_MODAL_KEY,           false)
const readInitialShowAdditionalPreferencesModal  = () => readInitialBool(SHOW_ADDITIONAL_PREFERENCES_MODAL_KEY, false)
const readInitialShowConfirmServiceDeactivation  = () => readInitialBool(SHOW_CONFIRM_SERVICE_DEACTIVATION_KEY, true)
const readInitialShowServiceSettingsHelpTip      = () => readInitialBool(SHOW_SERVICE_SETTINGS_HELP_TIP_KEY,    false)
const readInitialShowRegionalAlertCalifornia     = () => readInitialBool(SHOW_REGIONAL_ALERT_CALIFORNIA_KEY,    false)
const readInitialShowShortNoticeRateBanner       = () => readInitialBool(SHOW_SHORT_NOTICE_RATE_BANNER_KEY,     false)
const readInitialShowHubFetchError               = () => readInitialBool(SHOW_HUB_FETCH_ERROR_KEY,              false)
const readInitialShowCiafMigrationOnboarding     = () => readInitialBool(SHOW_CIAF_MIGRATION_ONBOARDING_KEY,    false)
const readInitialShowTrainingCredentialsUpload   = () => readInitialBool(SHOW_TRAINING_CREDENTIALS_UPLOAD_KEY,  false)
const readInitialShowGroomingProfileReview       = () => readInitialBool(SHOW_GROOMING_PROFILE_REVIEW_KEY,      false)
const readInitialGroomingBannerVariant           = () => readInitialEnum(GROOMING_BANNER_VARIANT_KEY, 'review')
const readInitialShowLockedRates                 = () => readInitialBool(SHOW_LOCKED_RATES_KEY,                 true)
const readInitialCalendarSaveFails               = () => readInitialBool(CALENDAR_SAVE_FAILS_KEY,               false)
const readInitialRatesMode                       = () => readInitialEnum(RATES_MODE_KEY, 'granular')
const readInitialAltMonetizationRollout          = () => readInitialBool(ALT_MONETIZATION_ROLLOUT_KEY,          false)

export function AppProvider({ children }) {
  // ── Shared ────────────────────────────────────────────────────────────────
  const [resolvedCards, setResolvedCards]         = useState({})  // { [cardId]: { resolution, timestamp } }

  // ── Mode A: modification flow (current) ───────────────────────────────────
  const [ownerTemplates, setOwnerTemplates]       = useState({})  // { [ownerId]: [{day, time}] }
  const [ownerWeeks, setOwnerWeeks]               = useState({})  // { [ownerId]: weeks[] }
  const [ownerSameSchedule, setOwnerSameSchedule] = useState({})  // { [ownerId]: bool }
  const [ownerCurrentWeeks, setOwnerCurrentWeeks] = useState({})  // { [ownerId]: days[] }

  // Per-owner change logs that drive ConversationScreen chat bubbles.
  const [scheduleChanges, setScheduleChangesRaw]       = useState({}) // { [ownerId]: change[] }   — replaces
  const [templateChanges, setTemplateChangesRaw]       = useState({}) // { [ownerId]: diff[][] }   — appends
  const [currentWeekChanges, setCurrentWeekChangesRaw] = useState({}) // { [ownerId]: diff[][] }   — appends

  const setOwnerScheduleChanges = (ownerId, changes) =>
    setScheduleChangesRaw(prev => ({ ...prev, [ownerId]: changes }))

  const addOwnerTemplateChange = (ownerId, changes) =>
    setTemplateChangesRaw(prev => ({ ...prev, [ownerId]: [...(prev[ownerId] ?? []), changes] }))

  const addOwnerCurrentWeekChange = (ownerId, diff) =>
    setCurrentWeekChangesRaw(prev => ({ ...prev, [ownerId]: [...(prev[ownerId] ?? []), diff] }))

  // ── Mode B: agenda flow (v1) ──────────────────────────────────────────────
  const [liveEvents, setLiveEvents] = useState({}) // { [ownerId]: event[] }
  const [ownerUnits, setOwnerUnits] = useState({}) // { [ownerId]: unit[] }

  const addLiveEvent = (ownerKey, event) =>
    setLiveEvents(prev => ({ ...prev, [ownerKey]: [...(prev[ownerKey] ?? []), event] }))

  // ── Schedule mode switch (Testing mode) ───────────────────────────────────
  const [scheduleMode, setScheduleModeRaw] = useState(readInitialMode)

  const setScheduleMode = (mode) => {
    setScheduleModeRaw(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SCHEDULE_MODE_KEY, mode)
    }
    // Clear working copies of the mode being left so stale state doesn't leak.
    if (mode === 'agenda') {
      setOwnerWeeks({})
      setOwnerCurrentWeeks({})
    } else {
      setOwnerUnits({})
    }
  }

  // ── Service variant config (dev-only, persisted) ──────────────────────────
  const [serviceStates, setServiceStatesRaw] = useState(readInitialServiceStates)
  const [familyInGeo, setFamilyInGeoRaw]     = useState(readInitialFamilyInGeo)

  const setServiceStates = (next) => {
    setServiceStatesRaw(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SERVICE_STATES_KEY, JSON.stringify(next))
    }
  }

  const setFamilyInGeo = (next) => {
    setFamilyInGeoRaw(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FAMILY_IN_GEO_KEY, JSON.stringify(next))
    }
  }

  // ── Hub state variants ──────────────────────────────────────────────────
  // Mirrors the localStorage read-on-mount + setter-writes-through pattern
  // used by `serviceStates` / `familyInGeo` above.
  const [profileReviewStatus,   setProfileReviewStatusRaw]   = useState(readInitialProfileReviewStatus)
  const [backgroundCheckStatus, setBackgroundCheckStatusRaw] = useState(readInitialBackgroundCheckStatus)
  const [searchStatus,          setSearchStatusRaw]          = useState(readInitialSearchStatus)

  const [acceptanceRestrictions, setAcceptanceRestrictionsRaw] = useState(readInitialAcceptanceRestrictions)

  const [showAvailabilityModal,           setShowAvailabilityModalRaw]           = useState(readInitialShowAvailabilityModal)
  const [showAdditionalPreferencesModal,  setShowAdditionalPreferencesModalRaw]  = useState(readInitialShowAdditionalPreferencesModal)
  const [showConfirmServiceDeactivation,  setShowConfirmServiceDeactivationRaw]  = useState(readInitialShowConfirmServiceDeactivation)
  const [showServiceSettingsHelpTip,      setShowServiceSettingsHelpTipRaw]      = useState(readInitialShowServiceSettingsHelpTip)
  const [showRegionalAlertCalifornia,     setShowRegionalAlertCaliforniaRaw]     = useState(readInitialShowRegionalAlertCalifornia)
  const [showShortNoticeRateBanner,       setShowShortNoticeRateBannerRaw]       = useState(readInitialShowShortNoticeRateBanner)
  const [showHubFetchError,               setShowHubFetchErrorRaw]               = useState(readInitialShowHubFetchError)
  const [showCiafMigrationOnboarding,        setShowCiafMigrationOnboardingRaw]        = useState(readInitialShowCiafMigrationOnboarding)
  const [showTrainingCredentialsUploadBanner, setShowTrainingCredentialsUploadBannerRaw] = useState(readInitialShowTrainingCredentialsUpload)
  const [showGroomingProfileReviewBanner,     setShowGroomingProfileReviewBannerRaw]     = useState(readInitialShowGroomingProfileReview)
  const [groomingBannerVariant,               setGroomingBannerVariantRaw]               = useState(readInitialGroomingBannerVariant)
  const [showLockedRates,                     setShowLockedRatesRaw]                     = useState(readInitialShowLockedRates)
  // Calendar availability saves are synchronous here, so they can only fail on
  // purpose. This flag is the switch that makes the POC's rollback path
  // reachable — `runOptimisticMutation` restores the pre-edit snapshot and
  // announces the failure assertively. Off by default so user testing never
  // hits an invented error.
  const [calendarSaveFails,                   setCalendarSaveFailsRaw]                   = useState(readInitialCalendarSaveFails)
  // Gates the graduated take rate / relationship-based-fees experiment: tier
  // pills, the tier progress tracker, the alt-monetization dashboard widget and
  // the tier-derived earnings shares. Off by default because the baseline
  // non-rollout experience is now the prototype's default — testers opt into
  // the variant.
  const [altMonetizationRollout,              setAltMonetizationRolloutRaw]              = useState(readInitialAltMonetizationRollout)

  // Locked-rates state per (owner x service). Production keys LockedServiceAddOn
  // rows on (service, requester, add_on_type), but the API write is full-set
  // replacement — lock POSTs the whole rate list, unlock POSTs an empty one — so
  // a single boolean per owner+service faithfully covers every reachable state.
  // Undefined means "not yet touched this session": read the seed from
  // client.lockedServices instead (see isRatesLocked below).
  const [lockedRatesByOwner, setLockedRatesByOwner] = useState({})  // { [`${ownerId}:${serviceKey}`]: bool }

  const [ratesMode, setRatesModeRaw] = useState(readInitialRatesMode)

  // The granular proposal's state: the same (owner x service) key, but carrying
  // the per-rate amounts the sitter set and when the lock was taken. Undefined
  // means untouched this session — read `lockedSeedFor` instead.
  const [lockedAmountsByOwner, setLockedAmountsByOwner] = useState({})  // { [key]: { locked, amounts, lockedAt } }

  // Calendar availability edits, overlaying the derived fixtures in
  // `calendarData.js`. Month-keyed like the POC's optimistic patch map
  // (`useNewCalendarData.ts:133-137`); session-only, following `ownerUnits`
  // rather than the persisted dev flags, because these are the sitter's own
  // edits and not a variant to demo.
  const [calendarAvailability, setCalendarAvailability] = useState({})  // { 'YYYY-MM': { [iso]: { [calendarId]: spacesAvailable } } }

  // `patchAvailability` (useNewCalendarData.ts:337-352) — fold a CalendarUpdate[]
  // into the store. Used for both the optimistic apply and its inverse.
  const patchCalendarAvailability = (updates) => {
    if (!updates || updates.length === 0) return
    setCalendarAvailability(prev => mergeAvailabilityPatches(prev, updates))
  }

  // Sitter-wide availability settings edits — the committed state behind
  // `AvailabilitySettingsPanel`, keyed by production's `serviceSlug` and holding
  // only the keys that actually changed, exactly as the POC's per-service PATCH
  // body does (`diffFromServer`, AvailabilitySettingsPanel.tsx:101-111). Session
  // -only, like `calendarAvailability` above.
  const [calendarServiceSettings, setCalendarServiceSettings] = useState({})  // { [serviceSlug]: partial }

  // The POC splices each PATCH response into its react-query list cache
  // (`:589-601`); here that cache is this map, and one call commits one
  // service's diff.
  const commitCalendarServiceSettings = (slug, patch) => {
    if (!slug || !patch || Object.keys(patch).length === 0) return
    setCalendarServiceSettings(prev => ({ ...prev, [slug]: { ...prev[slug], ...patch } }))
  }

  const persistEnum = (key, next, raw) => {
    raw(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, next)
    }
  }

  const persistJson = (key, next, raw) => {
    raw(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(next))
    }
  }

  const setProfileReviewStatus   = (next) => persistEnum(PROFILE_REVIEW_STATUS_KEY,   next, setProfileReviewStatusRaw)
  const setBackgroundCheckStatus = (next) => persistEnum(BACKGROUND_CHECK_STATUS_KEY, next, setBackgroundCheckStatusRaw)
  const setSearchStatus          = (next) => persistEnum(SEARCH_STATUS_KEY,           next, setSearchStatusRaw)

  const setAcceptanceRestrictions = (next) => persistJson(ACCEPTANCE_RESTRICTIONS_KEY, next, setAcceptanceRestrictionsRaw)

  const setShowAvailabilityModal          = (next) => persistJson(SHOW_AVAILABILITY_MODAL_KEY,           next, setShowAvailabilityModalRaw)
  const setShowAdditionalPreferencesModal = (next) => persistJson(SHOW_ADDITIONAL_PREFERENCES_MODAL_KEY, next, setShowAdditionalPreferencesModalRaw)
  const setShowConfirmServiceDeactivation = (next) => persistJson(SHOW_CONFIRM_SERVICE_DEACTIVATION_KEY, next, setShowConfirmServiceDeactivationRaw)
  const setShowServiceSettingsHelpTip     = (next) => persistJson(SHOW_SERVICE_SETTINGS_HELP_TIP_KEY,    next, setShowServiceSettingsHelpTipRaw)
  const setShowRegionalAlertCalifornia    = (next) => persistJson(SHOW_REGIONAL_ALERT_CALIFORNIA_KEY,    next, setShowRegionalAlertCaliforniaRaw)
  const setShowShortNoticeRateBanner      = (next) => persistJson(SHOW_SHORT_NOTICE_RATE_BANNER_KEY,     next, setShowShortNoticeRateBannerRaw)
  const setShowHubFetchError              = (next) => persistJson(SHOW_HUB_FETCH_ERROR_KEY,              next, setShowHubFetchErrorRaw)
  const setShowCiafMigrationOnboarding        = (next) => persistJson(SHOW_CIAF_MIGRATION_ONBOARDING_KEY,        next, setShowCiafMigrationOnboardingRaw)
  const setShowTrainingCredentialsUploadBanner = (next) => persistJson(SHOW_TRAINING_CREDENTIALS_UPLOAD_KEY,     next, setShowTrainingCredentialsUploadBannerRaw)
  const setShowGroomingProfileReviewBanner    = (next) => persistJson(SHOW_GROOMING_PROFILE_REVIEW_KEY,         next, setShowGroomingProfileReviewBannerRaw)
  const setGroomingBannerVariant              = (next) => persistEnum(GROOMING_BANNER_VARIANT_KEY,              next, setGroomingBannerVariantRaw)
  const setShowLockedRates                    = (next) => persistJson(SHOW_LOCKED_RATES_KEY,                    next, setShowLockedRatesRaw)
  const setCalendarSaveFails                  = (next) => persistJson(CALENDAR_SAVE_FAILS_KEY,                  next, setCalendarSaveFailsRaw)
  const setRatesMode                          = (next) => persistEnum(RATES_MODE_KEY,                          next, setRatesModeRaw)
  const setAltMonetizationRollout             = (next) => persistJson(ALT_MONETIZATION_ROLLOUT_KEY,             next, setAltMonetizationRolloutRaw)

  // Keyed on (client x service), as production keys LockedServiceAddOn rows.
  // Falls back to the client's declared seed list until the sitter toggles it.
  const isRatesLocked = (client, serviceKey) => {
    if (!client || !serviceKey) return false
    const key = `${client.id}:${serviceKey}`
    return lockedRatesByOwner[key] ?? Boolean(client.lockedServices?.includes(serviceKey))
  }

  const setRatesLocked = (client, serviceKey, locked) => {
    if (!client || !serviceKey) return
    const key = `${client.id}:${serviceKey}`
    setLockedRatesByOwner(prev => ({ ...prev, [key]: locked }))
  }

  // ── Granular locked rates ─────────────────────────────────────────────────
  // Session edits layered over the derived seed, so a client the sitter has not
  // touched still reads its authored state and one that has been saved reads
  // back exactly what was written.
  const getRatesState = (client, serviceKey) => {
    const seed = lockedSeedFor(client, serviceKey)
    if (!seed) return null
    const override = lockedAmountsByOwner[`${client.id}:${serviceKey}`]
    if (!override) return seed
    return { ...seed, ...override, amounts: { ...seed.amounts, ...override.amounts } }
  }

  // One save writes the whole set, as production's full-set replacement does.
  // `lockedAt` moves to now on every lock or amount change and clears on unlock.
  const commitRatesState = (client, serviceKey, { locked, amounts }) => {
    if (!client || !serviceKey) return
    const key = `${client.id}:${serviceKey}`
    setLockedAmountsByOwner(prev => ({
      ...prev,
      [key]: { locked, amounts: { ...amounts }, lockedAt: locked ? new Date() : null },
    }))
    // Keep the binary flag in step so flipping to `current` mode is coherent.
    setLockedRatesByOwner(prev => ({ ...prev, [key]: locked }))
  }

  return (
    <AppContext.Provider value={{
      // shared
      resolvedCards, setResolvedCards,
      // mode A
      ownerTemplates, setOwnerTemplates,
      ownerWeeks, setOwnerWeeks,
      ownerSameSchedule, setOwnerSameSchedule,
      ownerCurrentWeeks, setOwnerCurrentWeeks,
      scheduleChanges, setOwnerScheduleChanges,
      templateChanges, addOwnerTemplateChange,
      currentWeekChanges, addOwnerCurrentWeekChange,
      // mode B
      liveEvents, addLiveEvent,
      ownerUnits, setOwnerUnits,
      // mode switch
      scheduleMode, setScheduleMode,
      // service variant config
      serviceStates, setServiceStates,
      familyInGeo, setFamilyInGeo,
      // hub state variants
      profileReviewStatus,           setProfileReviewStatus,
      backgroundCheckStatus,         setBackgroundCheckStatus,
      searchStatus,                  setSearchStatus,
      acceptanceRestrictions,        setAcceptanceRestrictions,
      showAvailabilityModal,          setShowAvailabilityModal,
      showAdditionalPreferencesModal, setShowAdditionalPreferencesModal,
      showConfirmServiceDeactivation, setShowConfirmServiceDeactivation,
      showServiceSettingsHelpTip,     setShowServiceSettingsHelpTip,
      showRegionalAlertCalifornia,    setShowRegionalAlertCalifornia,
      showShortNoticeRateBanner,      setShowShortNoticeRateBanner,
      showHubFetchError,              setShowHubFetchError,
      showCiafMigrationOnboarding,        setShowCiafMigrationOnboarding,
      showTrainingCredentialsUploadBanner, setShowTrainingCredentialsUploadBanner,
      showGroomingProfileReviewBanner,    setShowGroomingProfileReviewBanner,
      groomingBannerVariant,              setGroomingBannerVariant,
      showLockedRates,                    setShowLockedRates,
      isRatesLocked,                      setRatesLocked,
      ratesMode,                          setRatesMode,
      getRatesState,                      commitRatesState,
      altMonetizationRollout,             setAltMonetizationRollout,
      // calendar
      calendarAvailability, patchCalendarAvailability,
      calendarServiceSettings, commitCalendarServiceSettings,
      calendarSaveFails,   setCalendarSaveFails,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
// v1 files import `useAppContext`; alias for compatibility.
export const useAppContext = useApp
