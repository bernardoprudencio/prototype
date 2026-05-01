import React, { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [resolvedCards, setResolvedCards]         = useState({})  // { [cardId]: { resolution, timestamp } }
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

  return (
    <AppContext.Provider value={{
      resolvedCards, setResolvedCards,
      ownerTemplates, setOwnerTemplates,
      ownerWeeks, setOwnerWeeks,
      ownerSameSchedule, setOwnerSameSchedule,
      ownerCurrentWeeks, setOwnerCurrentWeeks,
      scheduleChanges, setOwnerScheduleChanges,
      templateChanges, addOwnerTemplateChange,
      currentWeekChanges, addOwnerCurrentWeekChange,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
