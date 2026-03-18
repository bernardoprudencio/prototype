import { useState } from 'react'

function formatTime() {
  const d = new Date()
  let h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

export function useLoadTime() {
  const [loadTime] = useState(() => formatTime())
  return loadTime
}
