import React from 'react'
import { colors, textStyles } from '../../tokens'
import { ServiceRateRow } from '../../components'
import {
  LockIcon, BoardingIcon, HouseSitIcon, WalkingIcon, DropInIcon, DaycareIcon,
} from '../../assets/icons'
import { SERVICE_STATE_KEY } from '../../data/lockableRates'
import { SERVICE_STATE } from '../../data/sitterServices'
import { useApp } from '../../context/AppContext'
import {
  RATES_SECTION_HEADING, GROUP_BOOKED, GROUP_NOT_BOOKED, NO_SERVICES,
} from '../../data/granularRatesCopy'

// The rates-side service key → this prototype's service icon. Keyed on the
// booking/rates namespace (`drop_in_visits` / `dog_daycare`), which is what
// lockableRates.js and the rows above it speak; the schedule namespace only
// enters through SERVICE_STATE_KEY below. See CLAUDE.md, "Two service-key
// namespaces". The icons are intrinsically 24×24 — the POC's ServiceLogo size,
// and the size ServiceRateRow's leading slot expects.
const SERVICE_ICON = {
  boarding:       BoardingIcon,
  house_sitting:  HouseSitIcon,
  dog_walking:    WalkingIcon,
  drop_in_visits: DropInIcon,
  dog_daycare:    DaycareIcon,
}

/**
 * RatesPanel — the granular rates sheet's body: the catalogue split into
 * booked / not booked, each row opening the shared ManageRatesSheet.
 * Lifted out of RelationshipPage so the desktop detail pane and the mobile
 * accordion render the identical content.
 *
 * The panel draws no card of its own: the caller owns the white box, because
 * the two widths wrap it differently (a detail pane vs. an accordion body).
 *
 * An empty group renders nothing at all rather than a heading over nothing, so
 * a client with no bookings reads as one list instead of two.
 *
 * Props:
 *   bookedServices     [{ key, name, locked, lockedAt }]
 *   notBookedServices  same shape
 *   onOpenSheet        (serviceKey) => void
 *   showHeading        bool — render the lock + "Rates" heading row. False on
 *                      mobile, where the accordion header already says Rates.
 */
export default function RatesPanel({
  bookedServices = [], notBookedServices = [], onOpenSheet, showHeading = false,
}) {
  // The provider's own per-service state, so a service that is still listed
  // (it has custom rates) but no longer offered reads as "Inactive service".
  // `serviceStates` is keyed on the schedule/service-settings namespace, hence
  // the crossing through SERVICE_STATE_KEY.
  const { serviceStates } = useApp()
  const isInactive = (serviceKey) =>
    serviceStates?.[SERVICE_STATE_KEY[serviceKey]] === SERVICE_STATE.INACTIVE

  // Inactive services sink to the bottom of their own group. A service the
  // provider no longer offers is still listed (it carries custom rates), but it
  // is not something they can be booked for, so it must never sit above one
  // that is. The partition is stable — active and inactive both keep the order
  // the caller passed — so the only thing that moves is the inactive tail.
  const inactiveLast = (services) => [
    ...services.filter(s => !isInactive(s.key)),
    ...services.filter(s => isInactive(s.key)),
  ]

  const isEmpty = bookedServices.length === 0 && notBookedServices.length === 0

  const renderRow = (service) => {
    const Icon = SERVICE_ICON[service.key]
    const inactive = isInactive(service.key)
    return (
      <div key={service.key} role="listitem">
        <ServiceRateRow
          serviceName={service.name}
          isLocked={service.locked}
          lockedAt={service.lockedAt}
          isInactive={inactive}
          // The icon carries the state too: a service the provider stopped
          // offering greys out with its name (icons.jsx encodes state in `color`).
          icon={Icon ? <Icon color={inactive ? colors.disabledText : undefined} /> : null}
          onPress={() => onOpenSheet?.(service.key)}
        />
      </div>
    )
  }

  return (
    <>
      {showHeading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <LockIcon size={24} color={colors.primary} />
          <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0 }}>
            {RATES_SECTION_HEADING}
          </h2>
        </div>
      )}

      {isEmpty ? (
        <p style={{ ...textStyles.paragraph100, color: colors.secondary, margin: '0 0 8px' }}>
          {NO_SERVICES}
        </p>
      ) : (
        [
          { heading: GROUP_BOOKED,     services: inactiveLast(bookedServices) },
          { heading: GROUP_NOT_BOOKED, services: inactiveLast(notBookedServices) },
        ].map(group => group.services.length > 0 && (
          <div key={group.heading} style={{ paddingBottom: 8 }}>
            <h3 style={{ ...textStyles.heading100, color: colors.secondary, margin: '8px 0 0' }}>
              {group.heading}
            </h3>
            <div role="list">
              {group.services.map(renderRow)}
            </div>
          </div>
        ))
      )}
    </>
  )
}
