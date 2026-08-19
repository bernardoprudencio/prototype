import React from 'react'
import BottomSheet from './BottomSheet'
import LockRatesToggleRow from './LockRatesToggleRow'
import LockRatesSheet from './LockRatesSheet'
import Snackbar from './Snackbar'
import { colors, textStyles, typography } from '../tokens'
import { useLockedRates } from '../lib/useLockedRates'
import { toggleLabel, ledgerRowSitter } from '../data/lockedRatesCopy'

const tx = (size, weight, color) => ({
  fontFamily: typography.fontFamily, fontSize: size, fontWeight: weight, color, margin: 0,
})

const nightsBetween = (startIso, endIso) => {
  if (!startIso || !endIso) return 1
  const [ys, ms, ds] = startIso.split('-').map(Number)
  const [ye, me, de] = endIso.split('-').map(Number)
  const diff = (Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86400000
  return Math.max(1, diff)
}

/**
 * BookingDetailsSheet — the stay-detail price ledger, and the surface where
 * production actually exposes the lock control to sitters (the server-driven
 * `ToggleOption` in conversations/api/mappers/details/price_ledger.py, and the
 * legacy stay detail page's lockedratesview.js).
 *
 * The line items intentionally do NOT re-price when rates are unlocked:
 * production persists prices onto the BookingAddOn rows when the booking is
 * created, so unlocking only affects future quotes. That distinction is the
 * thing most worth watching in a user test.
 *
 * Props:
 *   client   contacts.js client record
 *   booking  relationshipData booking record
 *   onClose  () => void
 */
export default function BookingDetailsSheet({ client, booking, onClose }) {
  const lr = useLockedRates(client)

  const nights = nightsBetween(booking?.startDate, booking?.endDate)
  const nightLabel = `${nights} ${nights === 1 ? 'night' : 'nights'}`

  // Rate lines for this booking: the first pet bills at the standard rate, each
  // additional pet at the additional-dog rate — the same shape as the
  // BookingAddOn rows behind production's ledger.
  const rates = lr.config?.rates ?? []
  const standard = rates.find(r => r.slug === 'standard-rate')
  const additional = rates.find(r => r.slug === 'additional-dog')
  const pets = client?.pets ?? []

  const lines = pets.map((pet, i) => {
    const rate = i === 0 ? standard : additional
    const perNight = rate?.lockedPrice ?? 0
    return {
      key: pet.id,
      label: pet.name,
      rateType: rate?.label ?? '',
      perNight,
      total: perNight * nights,
    }
  }).filter(l => l.perNight > 0)

  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const fmt = (n) => `$${n.toFixed(2)}`
  const divider = { borderTop: `1px solid ${colors.border}` }

  const header = (
    <div style={{ paddingBottom: 16 }}>
      <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0 }}>Booking details</h2>
      <p style={{ ...textStyles.text100, color: colors.secondary, margin: 0, marginTop: 2 }}>
        {booking ? `${booking.serviceName} · ${booking.dates}` : ''}
      </p>
    </div>
  )

  return (
    <>
      <BottomSheet variant="full" onDismiss={onClose} header={header}>
        <p style={{ ...tx(20, 600, colors.primary), lineHeight: 1.25, marginBottom: 8 }}>Summary</p>

        {lines.map((line, i) => (
          <div key={line.key} style={{ padding: '16px 0', ...(i > 0 ? divider : {}) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <p style={{ ...tx(14, 600, colors.primary) }}>{line.label}</p>
              <p style={{ ...tx(14, 600, colors.primary) }}>{fmt(line.total)}</p>
            </div>
            <p style={{ ...tx(14, 400, colors.secondary) }}>{line.rateType}</p>
            <p style={{ ...tx(14, 400, colors.secondary) }}>${line.perNight} per night × {nightLabel}</p>
          </div>
        ))}

        <div style={{ padding: '16px 0', ...divider }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ ...tx(14, 700, colors.primary) }}>Subtotal</p>
            <p style={{ ...tx(14, 700, colors.primary) }}>{fmt(subtotal)}</p>
          </div>
        </div>

        {lr.available && (
          <div style={{ padding: '4px 0', ...divider }}>
            <LockRatesToggleRow
              label={toggleLabel(lr.ownerFirstName)}
              ownerFirstName={lr.ownerFirstName}
              checked={lr.locked}
              onRequestChange={lr.requestChange}
            />
            {lr.locked && (
              <p style={{ ...tx(14, 400, colors.secondary), paddingBottom: 12 }}>
                {ledgerRowSitter(lr.ownerFirstName)}
              </p>
            )}
          </div>
        )}
      </BottomSheet>

      {lr.sheetMode && (
        <LockRatesSheet
          mode={lr.sheetMode}
          ownerFirstName={lr.ownerFirstName}
          serviceName={lr.config.serviceName}
          rates={lr.config.rates}
          onConfirm={lr.confirm}
          onClose={lr.closeSheet}
        />
      )}

      <Snackbar message={lr.snackbar} onDone={lr.dismissSnackbar} />
    </>
  )
}
