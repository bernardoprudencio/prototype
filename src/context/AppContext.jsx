import React, { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [liveEvents, setLiveEvents] = useState({})
  const [ownerUnits, setOwnerUnits] = useState({})
  const [resolvedCards, setResolvedCards] = useState({})

  const addLiveEvent = (ownerKey, event) =>
    setLiveEvents(prev => ({ ...prev, [ownerKey]: [...(prev[ownerKey] ?? []), event] }))

  return (
    <AppContext.Provider value={{ liveEvents, ownerUnits, resolvedCards, addLiveEvent, setOwnerUnits, setResolvedCards }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
