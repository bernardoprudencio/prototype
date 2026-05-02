import React, { useState } from 'react'
import { colors, typography, radius } from '../tokens'

// Inline SVGs to keep the component self-contained
const CloseSmIcon = ({ hover }) => (
  <svg width="16" height="16" viewBox="0 0 32 32" fill={hover ? colors.primary : colors.secondary}>
    <path d="M17.414 16l7.293-7.293a1 1 0 0 0-1.414-1.414L16 14.586 8.707 7.293a1 1 0 0 0-1.414 1.414L14.586 16l-7.293 7.293a1 1 0 0 0 1.414 1.414L16 17.414l7.293 7.293a1 1 0 0 0 1.414-1.414L17.414 16z"/>
  </svg>
)

const CheckSmIcon = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" fill={colors.link} style={{ flexShrink: 0 }}>
    <path d="M26.191 4.412a1 1 0 1 1 1.618 1.176l-16 22a1 1 0 0 1-1.516.12l-6-6a1 1 0 1 1 1.414-1.415l5.173 5.172L26.19 4.412z"/>
  </svg>
)

/**
 * Chip — Kibble Chip pattern.
 *
 * Props:
 *   label      {string}   Text shown inside the chip.
 *   selected   {boolean}  Whether the chip is in an active/selected state.
 *   onClick    {fn}       Called when the chip body is clicked/pressed.
 *   onRemove   {fn}       If provided, shows an × button that calls this on press.
 *   checkmark  {boolean}  If true, shows a checkmark icon when selected (radio-style).
 *   size       {'default'|'small'}  Default is regular (48 touch target).
 *                                  'small' is compact for filter rows.
 */
export default function Chip({ label, selected, onClick, onRemove, checkmark, size = 'default', style }) {
  const [xHover, setXHover] = useState(false)
  const isSmall = size === 'small'

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: isSmall ? 32 : 48 }}>
      <div
        onMouseDown={onClick}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isSmall ? 4 : 8,
          background: selected ? colors.blueLight : colors.white,
          border: `2px solid ${selected ? colors.link : colors.borderInteractive}`,
          borderRadius: radius.primary,
          padding: isSmall ? '4px 10px' : '8px 12px',
          minWidth: isSmall ? 0 : 88,
          cursor: onClick ? 'pointer' : 'default',
          userSelect: 'none', transition: 'border-color 0.1s, background 0.1s',
          ...style,
        }}
      >
        {checkmark && selected && <CheckSmIcon />}
        <span style={{
          fontFamily: typography.fontFamily, fontWeight: 600,
          fontSize: isSmall ? 13 : 14,
          lineHeight: isSmall ? '18px' : '20px',
          color: selected ? colors.primary : colors.secondary, whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
        {onRemove && (
          <button
            onMouseDown={e => { e.stopPropagation(); onRemove() }}
            onMouseEnter={() => setXHover(true)}
            onMouseLeave={() => setXHover(false)}
            style={{
              background: xHover ? colors.bgTertiary : 'none', border: 'none',
              padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center',
              flexShrink: 0, borderRadius: 4, transition: 'background 0.1s',
            }}
          >
            <CloseSmIcon hover={xHover} />
          </button>
        )}
      </div>
    </div>
  )
}
