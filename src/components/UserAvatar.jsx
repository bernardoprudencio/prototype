import React from 'react'
import avatarImg from '../assets/avatar.png'

export default function UserAvatar({ size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '1px solid white', overflow: 'hidden', flexShrink: 0,
    }}>
      <img src={avatarImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  )
}
