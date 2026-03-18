import React from 'react'

export default function UserAvatar({ size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
      border: '1px solid white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="5" fill="#64748B"/>
        <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="#64748B"/>
      </svg>
    </div>
  )
}
