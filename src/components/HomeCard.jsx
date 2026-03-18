import React from 'react'
import { colors, typography, shadows } from '../tokens'
import { MapIcon, PawIcon } from '../assets/icons'
import PetAvatar from './PetAvatar'
import Button from './Button'

export default function HomeCard({ time, service, address, petNames, petImages, buttonLabel, disabled = false, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: colors.white, borderRadius: 8, boxShadow: shadows.low,
      padding: '12px 20px', cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: colors.primary, margin: 0 }}>{time}</p>
          <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.25, color: colors.secondary, margin: 0 }}>{service}</p>
        </div>
        <PetAvatar size={48} images={petImages} />
      </div>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
          <span style={{ flexShrink: 0 }}><MapIcon /></span>
          <span style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.primary }}>{address}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
          <span style={{ flexShrink: 0 }}><PawIcon /></span>
          <span style={{ fontFamily: typography.fontFamily, fontSize: 14, color: colors.primary }}>{petNames}</span>
        </div>
        <div style={{ padding: '8px 0' }}>
          <Button variant="default" disabled={disabled} fullWidth>{buttonLabel}</Button>
        </div>
      </div>
    </div>
  )
}
