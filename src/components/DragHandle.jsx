import React from 'react'
import { colors } from '../tokens'

export default function DragHandle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
      <div style={{
        width: 36, height: 4,
        borderRadius: 2,
        background: colors.borderInteractive,
      }} />
    </div>
  )
}
