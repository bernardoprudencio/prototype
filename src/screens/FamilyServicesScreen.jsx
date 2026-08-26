import React from 'react'
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { colors, layout } from '../tokens'
import {
  BoardingIcon,
  DaycareIcon,
  DropInIcon,
  GroomingIcon,
  HouseSitIcon,
  TrainingIcon,
  WalkingIcon,
} from '../assets/icons'
import {
  ACCEPTANCE_RESTRICTION,
  FAMILY_LABEL,
  SERVICE_STATE,
  getActiveServiceStatusLines,
  getFamilyServices,
} from '../data/sitterServices'
import ServiceIconBadge from '../components/ServiceIconBadge'
import { Chevron, SettingsRow, SubPageHeader } from '../components/hubUI'
import FamilyPaneHeader from './FamilyPaneHeader'
import { useApp } from '../context/AppContext'

// Service id → icon component. The badge tints the icon per service state, so
// unlike the old hub rows these are rendered through an explicit `color`.
const SERVICE_ICON_BY_ID = {
  boarding:      BoardingIcon,
  doggy_daycare: DaycareIcon,
  drop_in:       DropInIcon,
  dog_walking:   WalkingIcon,
  house_sitting: HouseSitIcon,
  dog_training:  TrainingIcon,
  grooming:      GroomingIcon,
}

// Figma groups the list by state — every Active service first, then Away,
// then Awaiting Approval, then Inactive — keeping catalog order within each
// group. Figma 607:42368.
const STATE_RANK = {
  [SERVICE_STATE.ACTIVE]:   0,
  [SERVICE_STATE.AWAY]:     1,
  [SERVICE_STATE.PENDING]:  2,
  [SERVICE_STATE.INACTIVE]: 3,
}

/**
 * `/service-settings/services/:family` — every service in the family, active
 * and inactive alike, each with its state-tinted icon badge and status lines.
 * Figma 607:42368 (pet sitting), 1194:52491 (training), 1194:52281 (grooming).
 */
export default function FamilyServicesScreen() {
  const navigate = useNavigate()
  const { family } = useParams()
  const { serviceStates, acceptanceRestrictions } = useApp()
  const { isWide } = useOutletContext()

  const services = getFamilyServices(family)
  if (!FAMILY_LABEL[family] || services.length === 0) {
    return <Navigate to="/service-settings" replace />
  }

  const stateOf = (svc) => serviceStates[svc.id] ?? SERVICE_STATE.INACTIVE
  const ordered = services
    .map((svc, i) => ({ svc, i }))
    .sort((a, b) => {
      const rank = (STATE_RANK[stateOf(a.svc)] ?? 3) - (STATE_RANK[stateOf(b.svc)] ?? 3)
      return rank !== 0 ? rank : a.i - b.i
    })
    .map(({ svc }) => svc)

  const noop = () => {}

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isWide ? 'auto' : '100%',
        background: colors.white,
      }}
    >
      {isWide ? (
        <FamilyPaneHeader family={family} activeTab="services" />
      ) : (
        <SubPageHeader
          title={`${FAMILY_LABEL[family]} services`}
          onBack={() => navigate('/service-settings')}
        />
      )}

      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: isWide ? 'visible' : 'auto',
          paddingLeft: isWide ? 0 : 16,
          paddingRight: isWide ? 0 : 16,
        }}
      >
        <div style={{ maxWidth: layout.contentWidth, width: '100%', margin: '0 auto', paddingTop: 8, paddingBottom: isWide ? 0 : 40 }}>
          {ordered.map((svc) => {
            const state = stateOf(svc)
            return (
              <SettingsRow
                key={svc.id}
                leftIcon={<ServiceIconBadge Icon={SERVICE_ICON_BY_ID[svc.id]} state={state} />}
                label={svc.label}
                statusLines={getActiveServiceStatusLines(svc, {
                  state,
                  restriction: acceptanceRestrictions?.[svc.id] ?? ACCEPTANCE_RESTRICTION.NONE,
                })}
                rightItem={<Chevron />}
                onPress={
                  svc.id === 'boarding' ? () => navigate('/service-settings/boarding') : noop
                }
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
