import React from 'react'

export default function PetAvatar({ size = 48, images = [], style = {} }) {
  const count = images.length || 1
  return (
    <div style={{
      display: 'flex', position: 'relative',
      width: count > 1 ? size + 16 : size, height: size,
      flexShrink: 0, ...style,
    }}>
      {images.map((src, i) => (
        <div key={i} style={{
          width: size, height: size, borderRadius: '50%',
          border: '2px solid white',
          position: count > 1 ? 'absolute' : 'relative',
          left: count > 1 ? i * 16 : 0,
          zIndex: 5 - i, overflow: 'hidden', background: '#E8D5B7',
        }}>
          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ))}
    </div>
  )
}
