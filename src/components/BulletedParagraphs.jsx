import React from 'react'
import { colors, typography } from '../tokens'

// Numbered bullet list with a vertical connector between circles.
// Mirrors @rover/kibble/patterns/BulletedParagraphs.
export default function BulletedParagraphs({ children }) {
  const items = React.Children.toArray(children)
  const accent = colors.link

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((child, index) => {
        const isLast = index === items.length - 1
        const selected = !!child.props?.selected
        return (
          <div key={index} style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 24, height: 24, flexShrink: 0,
                borderRadius: '50%',
                border: `2px solid ${accent}`,
                background: selected ? accent : colors.white,
                color: selected ? colors.white : accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: typography.displayFamily,
                fontWeight: 600, fontSize: 14, lineHeight: 1,
                marginTop: 4,
                zIndex: 1,
              }}>
                {index + 1}
              </div>
              {!isLast && (
                <div style={{
                  width: 2, flex: '1 1 0',
                  background: accent,
                  marginBottom: -4,
                }} />
              )}
            </div>

            <div style={{
              flex: 1,
              paddingTop: 4,
              paddingBottom: isLast ? 0 : 12,
              paddingLeft: 20,
            }}>
              {child}
            </div>
          </div>
        )
      })}
    </div>
  )
}

BulletedParagraphs.Item = function Item({ children }) {
  return <>{children}</>
}
