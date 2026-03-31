import React from 'react'
import { colors, typography } from '../tokens'

export default function Row({ label, sublabel, sublabel2, leftItem, rightItem, onClick, firstRow = false }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
        paddingTop: firstRow ? 16 : 8,
        paddingBottom: 8,
        width: '100%',
        cursor: onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: leftItem ? 8 : 0 }}>
        {leftItem && <div style={{ flexShrink: 0 }}>{leftItem}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: sublabel ? 4 : 0, flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16,
            lineHeight: 1.5, color: colors.primary, margin: 0,
          }}>{label}</p>
          {sublabel && (
            <p style={{
              fontFamily: typography.fontFamily, fontSize: 14,
              lineHeight: 1.25, color: colors.tertiary, margin: 0,
            }}>{sublabel}</p>
          )}
          {sublabel2 && (
            <p style={{
              fontFamily: typography.fontFamily, fontSize: 14,
              lineHeight: 1.25, color: colors.tertiary, margin: 0,
            }}>{sublabel2}</p>
          )}
        </div>
      </div>
      {rightItem && (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingLeft: 8 }}>
          {rightItem}
        </div>
      )}
    </div>
  )
}
