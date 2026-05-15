import React, { createContext, useContext, useState } from 'react'
import { DEFAULT_FAMILY_IN_GEO, DEFAULT_SERVICE_STATES } from '../data/sitterServices'

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
const SHOW_SHORT_NOTICE_RATE_CALLOUT_KEY   = 'showShortNoticeRateCallout'
const SHOW_SERVICE_SETTINGS_HELP_TIP_KEY   = 'showServiceSettingsHelpTip'
const SHOW_REGIONAL_ALERT_CALIFORNIA_KEY   = 'showRegionalAlertCalifornia'
const SHOW_SHORT_NOTICE_RATE_BANNER_KEY    = 'showShortNoticeRateBanner'
const SHOW_HUB_FETCH_ERROR_KEY             = 'showHubFetchError'
const SHOW_MISSING_INFO_KEY                = 'showMissingInfo'

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
const readInitialShowShortNoticeRateCallout      = () => readInitialBool(SHOW_SHORT_NOTICE_RATE_CALLOUT_KEY,    false)
const readInitialShowServiceSettingsHelpTip      = () => readInitialBool(SHOW_SERVICE_SETTINGS_HELP_TIP_KEY,    false)
const readInitialShowRegionalAlertCalifornia     = () => readInitialBool(SHOW_REGIONAL_ALERT_CALIFORNIA_KEY,    false)
const readInitialShowShortNoticeRateBanner       = () => readInitialBool(SHOW_SHORT_NOTICE_RATE_BANNER_KEY,     false)
const readInitialShowHubFetchError               = () => readInitialBool(SHOW_HUB_FETCH_ERROR_KEY,              false)
const readInitialShowMissingInfo                 = () => readInitialBool(SHOW_MISSING_INFO_KEY,                 true)

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
  const [showShortNoticeRateCallout,      setShowShortNoticeRateCalloutRaw]      = useState(readInitialShowShortNoticeRateCallout)
  const [showServiceSettingsHelpTip,      setShowServiceSettingsHelpTipRaw]      = useState(readInitialShowServiceSettingsHelpTip)
  const [showRegionalAlertCalifornia,     setShowRegionalAlertCaliforniaRaw]     = useState(readInitialShowRegionalAlertCalifornia)
  const [showShortNoticeRateBanner,       setShowShortNoticeRateBannerRaw]       = useState(readInitialShowShortNoticeRateBanner)
  const [showHubFetchError,               setShowHubFetchErrorRaw]               = useState(readInitialShowHubFetchError)
  const [showMissingInfo,                 setShowMissingInfoRaw]                 = useState(readInitialShowMissingInfo)

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
  const setShowShortNoticeRateCallout     = (next) => persistJson(SHOW_SHORT_NOTICE_RATE_CALLOUT_KEY,    next, setShowShortNoticeRateCalloutRaw)
  const setShowServiceSettingsHelpTip     = (next) => persistJson(SHOW_SERVICE_SETTINGS_HELP_TIP_KEY,    next, setShowServiceSettingsHelpTipRaw)
  const setShowRegionalAlertCalifornia    = (next) => persistJson(SHOW_REGIONAL_ALERT_CALIFORNIA_KEY,    next, setShowRegionalAlertCaliforniaRaw)
  const setShowShortNoticeRateBanner      = (next) => persistJson(SHOW_SHORT_NOTICE_RATE_BANNER_KEY,     next, setShowShortNoticeRateBannerRaw)
  const setShowHubFetchError              = (next) => persistJson(SHOW_HUB_FETCH_ERROR_KEY,              next, setShowHubFetchErrorRaw)
  const setShowMissingInfo                = (next) => persistJson(SHOW_MISSING_INFO_KEY,                 next, setShowMissingInfoRaw)

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
      showShortNoticeRateCallout,     setShowShortNoticeRateCallout,
      showServiceSettingsHelpTip,     setShowServiceSettingsHelpTip,
      showRegionalAlertCalifornia,    setShowRegionalAlertCalifornia,
      showShortNoticeRateBanner,      setShowShortNoticeRateBanner,
      showHubFetchError,              setShowHubFetchError,
      showMissingInfo,                setShowMissingInfo,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
// v1 files import `useAppContext`; alias for compatibility.
export const useAppContext = useApp
