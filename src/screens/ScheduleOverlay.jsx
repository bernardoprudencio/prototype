import React, { useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { colors, shadows, textStyles } from '../tokens'
import { BackIcon } from '../assets/icons'
import { Button } from '../components'
import RelationshipManagement from './relationship/RelationshipManagement'
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
  const [showToast, setShowToast] = useState(false)
  const toastTimerRef = useRef(null)

  const handleScheduleConfirmed = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setShowToast(true)
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3500)
  }

  const units = ownerUnits[ownerId] ?? ctx?.units ?? []
  const unitLabel = UNIT_LABELS[units[0]?.serviceId] ?? 'service'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white, position: 'relative' }}>
      <div style={{ borderBottom: `1px solid ${colors.border}`, boxShadow: shadows.headerShadow, padding: '12px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 62, padding: '8px 0' }}>
          <div onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
            <BackIcon />
          </div>
          <div style={{ flex: 1, marginLeft: 8, minWidth: 0 }}>
            <p style={{ ...textStyles.text200Semibold, color: colors.primary, margin: 0 }}>Manage schedule</p>
            <p style={{ ...textStyles.text100, color: colors.primary, margin: 0 }}>{ctx?.ownerName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 12, paddingBottom: 14 }}>
          <Button variant="primary" style={{ flexShrink: 0 }} onClick={() => scheduleRef.current?.openAdd()}>Add a {unitLabel}</Button>
          <Button variant="default" style={{ flexShrink: 0 }} onClick={() => scheduleRef.current?.openManage()}>Manage rules</Button>
        </div>
      </div>
      <RelationshipManagement
        ref={scheduleRef}
        initialPets={ctx?.pets}
        initialUnits={units}
        ownerFirstName={ctx?.ownerFirstName}
        isIncompleteResolved={!!resolvedCards[`${ownerId}-incomplete`]}
        onScheduleConfirmed={handleScheduleConfirmed}
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
      {showToast && (
        <div style={{
          position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 50,
          background: '#F1FDF6', borderRadius: 4,
          boxShadow: '0px 2px 12px -1px rgba(27,31,35,0.24)',
          display: 'flex', alignItems: 'center', gap: 12, padding: 16,
          animation: 'slideUp 0.25s ease-out',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24ZM12 22.5C17.799 22.5 22.5 17.799 22.5 12C22.5 6.20101 17.799 1.5 12 1.5C6.20101 1.5 1.5 6.20101 1.5 12C1.5 17.799 6.20101 22.5 12 22.5ZM16.6555 7.04272C16.9081 6.7144 17.379 6.65298 17.7073 6.90553C18.0356 7.15808 18.097 7.62897 17.8445 7.95728L10.3445 17.7073C10.0684 18.0661 9.5398 18.1005 9.21967 17.7803L6.21967 14.7803C5.92678 14.4874 5.92678 14.0126 6.21967 13.7197C6.51256 13.4268 6.98744 13.4268 7.28033 13.7197L9.67633 16.1157L16.6555 7.04272Z" fill="#1B6C42"/>
          </svg>
          <p style={{ flex: 1, margin: 0, fontSize: 14, fontWeight: 600, color: '#1F2124', fontFamily: 'Averta, sans-serif', lineHeight: 1.25 }}>
            Success! Schedule was updated.
          </p>
          <div onClick={() => setShowToast(false)} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 7.29209L13.1464 2.14619C13.3417 1.95095 13.6583 1.95095 13.8536 2.14619C14.0488 2.34143 14.0488 2.65798 13.8536 2.85322L8.70711 7.99912L13.8536 13.145C14.0488 13.3403 14.0488 13.6568 13.8536 13.8521C13.6583 14.0473 13.3417 14.0473 13.1464 13.8521L8 8.70616L2.85355 13.8521C2.65829 14.0473 2.34171 14.0473 2.14645 13.8521C1.95118 13.6568 1.95118 13.3403 2.14645 13.145L7.29289 7.99912L2.14645 2.85322C1.95118 2.65798 1.95118 2.34143 2.14645 2.14619C2.34171 1.95095 2.65829 1.95095 2.85355 2.14619L8 7.29209Z" fill="#404347"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
