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
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
// v1 files import `useAppContext`; alias for compatibility.
export const useAppContext = useApp
