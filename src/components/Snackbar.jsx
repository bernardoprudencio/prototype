import React, { useEffect } from 'react'
import { colors, textStyles, radius } from '../tokens'

/**
 * Snackbar — transient bottom toast, matching the confirmation snackbars the
 * native apps show after locking or unlocking rates.
 *
 * Props:
 *   message   string
 *   onDone    () => void   — called once the display duration elapses
 *   duration  ms (default 3000)
 */
export default function Snackbar({ message, onDone, duration = 3000 }) {
  useEffect(() => {
    if (!message) return undefined
    const t = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(t)
  }, [message, duration, onDone])

  if (!message) return null

  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 24,
      zIndex: 400,
      background: colors.primary,
      color: colors.white,
      borderRadius: radius.primary,
      padding: '14px 16px',
      boxShadow: '0px 2px 12px rgba(27,31,35,0.24)',
      animation: 'slideUp 200ms ease',
      ...textStyles.text200,
    }}>
      {message}
    </div>
  )
}
