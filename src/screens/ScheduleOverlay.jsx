import React, { useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { colors, typography, shadows } from '../tokens'
import { BackIcon } from '../assets/icons'
import { Button } from '../components'
import RelationshipScreen from './relationship/RelationshipScreen'
import { useAppContext } from '../context/AppContext'
import { formatActionTimestamp } from '../hooks/useDate'

const UNIT_LABELS = {
  dog_walking:   'walk',
  drop_in:       'visit',
  doggy_daycare: 'day',
  boarding:      'night',
  house_sitting: 'night',
}

export default function ScheduleOverlay() {
  const { ownerId } = useParams()
  const navigate = useNavigate()
  const { state: ctx } = useLocation()
  const { ownerUnits, setOwnerUnits, resolvedCards, setResolvedCards, addLiveEvent } = useAppContext()
  const scheduleRef = useRef(null)

  const units = ownerUnits[ownerId] ?? ctx?.units ?? []
  const unitLabel = UNIT_LABELS[units[0]?.serviceId] ?? 'service'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      <div style={{ borderBottom: `1px solid ${colors.border}`, boxShadow: shadows.headerShadow, padding: '12px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 62, padding: '8px 0' }}>
          <div onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
            <BackIcon />
          </div>
          <div style={{ flex: 1, marginLeft: 8, minWidth: 0 }}>
            <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: colors.primary, margin: 0 }}>Manage schedule</p>
            <p style={{ fontFamily: typography.fontFamily, fontSize: 14, lineHeight: 1.25, color: colors.primary, margin: 0 }}>{ctx?.ownerName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 12, paddingBottom: 14 }}>
          <Button variant="primary" style={{ flexShrink: 0 }} onClick={() => scheduleRef.current?.openAdd()}>Add a {unitLabel}</Button>
          <Button variant="default" style={{ flexShrink: 0 }} onClick={() => scheduleRef.current?.openManage()}>Manage rules</Button>
        </div>
      </div>
      <RelationshipScreen
        ref={scheduleRef}
        initialPets={ctx?.pets}
        initialUnits={units}
        ownerFirstName={ctx?.ownerFirstName}
        isIncompleteResolved={!!resolvedCards[`${ownerId}-incomplete`]}
        onScheduleChange={(text, committedUnits) => {
          if (committedUnits) setOwnerUnits(prev => ({ ...prev, [ownerId]: committedUnits }))
          addLiveEvent(ownerId, {
            id: Date.now(),
            type: 'scheduleChange',
            text: text.replace('{ts}', formatActionTimestamp()),
          })
        }}
        onReviewComplete={(resolution, card) => {
          const ts = formatActionTimestamp()
          const cardId = `${ownerId}-incomplete`
          setResolvedCards(prev => ({ ...prev, [cardId]: { resolution, timestamp: ts } }))
          addLiveEvent(ownerId, { id: Date.now(), type: 'resolution', resolution, timestamp: ts, card })
        }}
      />
    </div>
  )
}
