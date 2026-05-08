import React, { useState, useEffect } from 'react'
import { colors } from '../tokens'

const TRANSITION_MS = 200

export default function SlideOverlay({ children, zIndex = 10 }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)))
  }, [])

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex,
      background: colors.white,
      transition: `transform ${TRANSITION_MS}ms ease, opacity ${TRANSITION_MS}ms ease`,
      transform: active ? 'translateX(0)' : 'translateX(100%)',
      opacity: active ? 1 : 0,
    }}>
      {children}
    </div>
  )
}
