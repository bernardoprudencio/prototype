import { useState } from 'react'
import { R, fontFamily } from './theme'
import { textStyles } from '../../tokens'
import { computeScheduleDiff, shortRuleLabel, expandUnit, isPaidOcc, getPaidThruSunday } from '../../lib/scheduleHelpers'
import { parseDate, fmtDate, fmtDateLong, fmtTime } from '../../lib/dateUtils'
import { PROTO_TODAY } from '../../data/owners'
import { SERVICES } from '../../data/services'
import BottomSheet from '../../components/BottomSheet'
import Button from '../../components/Button'
import Row from '../../components/Row'
import PetAvatar from '../../components/PetAvatar'

const UNIT_LABEL = id => ({ dog_walking: 'walk', drop_in: 'visit', doggy_daycare: 'day', boarding: 'night', house_sitting: 'night' })[id] ?? id
const SVC_LABEL  = id => SERVICES.find(s => s.id === id)?.label ?? id

function computeWeekBilling(savedUnits, draftUnits, petsArr) {
  const paidThru = getPaidThruSunday()
  const todayMid = new Date(PROTO_TODAY); todayMid.setHours(0, 0, 0, 0)

  const weekOccs = units =>
    units.flatMap(u =>
      expandUnit(u)
        .filter(o => !o.skipped && isPaidOcc(o.start, paidThru) && o.start >= todayMid)
        .map(o => ({ unit: u, occ: o }))
    )

  const savedOccs = weekOccs(savedUnits)
  const draftOccs = weekOccs(draftUnits)

  const savedTotal = savedOccs.reduce((s, { unit: u }) => s + (u.cost || 0), 0)
  const draftTotal = draftOccs.reduce((s, { unit: u }) => s + (u.cost || 0), 0)

  // Build line items from draft; fall back to saved when all were removed
  const sourceOccs = draftOccs.length > 0 ? draftOccs : savedOccs
  const seen = new Set()
  const lineItems = []
  for (const { unit: u } of sourceOccs) {
    if (seen.has(u.id)) continue
    seen.add(u.id)
    const count    = sourceOccs.filter(o => o.unit.id === u.id).length
    const petNames = petsArr.filter(p => u.petIds.includes(p.id)).map(p => p.name).join(' & ') || 'Pets'
    lineItems.push({ unit: u, count: draftOccs.length > 0 ? count : 0, petNames, total: draftOccs.length > 0 ? count * (u.cost || 0) : 0 })
  }

  const net = draftTotal - savedTotal
  return { savedTotal, draftTotal, net, lineItems, hasActivity: savedOccs.length !== draftOccs.length || net !== 0 }
}

function chargeSuffix(amount) {
  return amount > 0 ? ` · Amount due: $${amount.toFixed(2)}` : ''
}
function refundSuffix(amount) {
  return amount > 0 ? ` · Refund: $${amount.toFixed(2)}` : ''
}

export default function SummarySheet({ savedUnits, draftUnits, pets, onConfirm, onBack }) {
  const [view, setView] = useState('review')
  const diff = computeScheduleDiff(savedUnits, draftUnits)
  const { added, removed, modified, skipped, overridden, refundTotal, chargeTotal, netAmount, totalCount } = diff

  const ul = UNIT_LABEL

  const isEmpty = totalCount === 0

  const handleConfirm = () => {
    const items = [
      ...added.map(({ unit: u }) => ({
        date: parseDate(u.startDate),
        line: u._parentTime
          ? `Changed ${ul(u.serviceId)} rule to ${fmtTime(u.startTime)} — ${shortRuleLabel(u)} starting ${fmtDate(parseDate(u.startDate))}`
          : u.frequency === 'once'
            ? `Added ${ul(u.serviceId)} on ${fmtDate(parseDate(u.startDate))}`
            : `Added ${ul(u.serviceId)} rule — ${shortRuleLabel(u)} at ${fmtTime(u.startTime)} starting ${fmtDate(parseDate(u.startDate))}`,
      })),
      ...removed.map(({ unit: u }) => ({
        date: parseDate(u.startDate),
        line: u.frequency === 'once'
          ? `Removed ${ul(u.serviceId)} on ${fmtDate(parseDate(u.startDate))}`
          : `Removed ${ul(u.serviceId)} rule — ${shortRuleLabel(u)} at ${fmtTime(u.startTime)} starting ${fmtDate(parseDate(u.startDate))}`,
      })),
      ...modified.map(({ saved, draft }) => {
        const isEnded = !saved.repeatEndDate && !!draft.repeatEndDate
        return {
          date: draft.repeatEndDate ? parseDate(draft.repeatEndDate) : parseDate(draft.startDate),
          line: isEnded
            ? `Ended ${ul(draft.serviceId)} rule — ${shortRuleLabel(draft)} at ${fmtTime(draft.startTime)}, ends ${fmtDate(parseDate(draft.repeatEndDate))}`
            : `Updated ${ul(draft.serviceId)} rule — ${shortRuleLabel(draft)} at ${fmtTime(draft.startTime)}${draft.repeatEndDate ? `, ends ${fmtDate(parseDate(draft.repeatEndDate))}` : ''}`,
        }
      }),
      ...skipped.map(({ unit, dk }) => ({
        date: parseDate(dk),
        line: `Removed ${ul(unit.serviceId)} on ${fmtDate(parseDate(dk))}`,
      })),
      ...overridden.map(({ unit, dk, newTime }) => ({
        date: parseDate(dk),
        line: `Updated ${ul(unit.serviceId)} on ${fmtDateLong(parseDate(dk))} — new time ${fmtTime(newTime)}`,
      })),
    ]
    items.sort((a, b) => a.date - b.date)
    const bulletLines   = items.map(i => `• ${i.line}`).join('\n')
    const financialLine = netAmount > 0 ? `\n$${netAmount.toFixed(2)} charged`
                        : netAmount < 0 ? `\n$${Math.abs(netAmount).toFixed(2)} refunded`
                        : ''
    onConfirm(`Schedule updated at {ts}:\n${bulletLines}${financialLine}`)
  }

  const handlePrimaryAction = () => {
    if (view === 'review') { setView('confirm'); return }
    handleConfirm()
  }

  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 24 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...textStyles.heading300, color: R.navy, margin: 0 }}>
          {view === 'confirm' ? 'Confirm changes' : 'Review changes'}
        </p>
        <p style={{ ...textStyles.text100, color: R.gray, margin: '4px 0 0' }}>
          {isEmpty ? 'No changes to save' : `${totalCount} change${totalCount !== 1 ? 's' : ''}`}
        </p>
      </div>
      <PetAvatar size={48} images={pets.map(p => p.img)} />
    </div>
  )

  if (isEmpty) {
    return (
      <BottomSheet variant="full" onDismiss={onBack} header={header}>
        <p style={{ ...textStyles.paragraph100, color: R.gray, margin: '0 0 24px' }}>No changes to save.</p>
        <Button variant="default" size="small" fullWidth onClick={onBack}>Close</Button>
      </BottomSheet>
    )
  }

  if (view === 'confirm') {
    const { savedTotal, draftTotal, net, lineItems, hasActivity } = computeWeekBilling(savedUnits, draftUnits, pets)
    const fmt = n => `$${n.toFixed(2)}`
    const divider = { borderTop: `1px solid ${R.separator}` }

    return (
      <BottomSheet variant="full" onDismiss={() => setView('review')} header={header}>
        {hasActivity ? (
          <div style={{ background: R.bg, borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <p style={{ ...textStyles.heading200, color: R.navy, margin: '0 0 12px' }}>Current week summary</p>

            {lineItems.map((item, i) => (
              <div key={`${item.unit.id}-${i}`} style={{ padding: '12px 0', ...(i > 0 ? divider : {}) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <p style={{ ...textStyles.text100Semibold, color: R.navy, margin: 0 }}>{item.petNames}</p>
                  <p style={{ ...textStyles.text100Semibold, color: R.navy, margin: 0 }}>{fmt(item.total)}</p>
                </div>
                <p style={{ ...textStyles.paragraph100, color: R.gray, margin: 0 }}>{SVC_LABEL(item.unit.serviceId)}</p>
                <p style={{ ...textStyles.paragraph100, color: R.gray, margin: 0 }}>
                  {fmt(item.unit.cost || 0)} per {UNIT_LABEL(item.unit.serviceId)} × {item.count} {item.count === 1 ? UNIT_LABEL(item.unit.serviceId) : UNIT_LABEL(item.unit.serviceId) + 's'}
                </p>
              </div>
            ))}

            <div style={{ padding: '12px 0', ...divider }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ ...textStyles.text100Semibold, color: R.navy, margin: 0 }}>Subtotal</p>
                <p style={{ ...textStyles.text100Semibold, color: R.navy, margin: 0 }}>{fmt(draftTotal)}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ ...textStyles.paragraph100, color: R.gray, margin: 0 }}>Previous total</p>
                <p style={{ ...textStyles.paragraph100, color: R.gray, margin: 0 }}>{fmt(savedTotal)}</p>
              </div>
            </div>

            <div style={{ padding: '12px 0', ...divider }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ ...textStyles.heading200, color: R.navy, margin: 0 }}>
                  {net < 0 ? 'Refund amount' : 'Amount due'}
                </p>
                <p style={{ ...textStyles.heading200, color: R.navy, margin: 0 }}>
                  {net < 0 ? `– ${fmt(Math.abs(net))}` : fmt(net)}
                </p>
              </div>
              <p style={{ ...textStyles.paragraph100, color: R.gray, margin: 0 }}>
                {net > 0
                  ? `Submitting these changes will charge the owner ${fmt(net)} to their original payment method.`
                  : net < 0
                    ? `Submitting these changes will refund the owner ${fmt(Math.abs(net))} to their original payment method.`
                    : 'No change in price.'}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ ...textStyles.paragraph100, color: R.gray, margin: '0 0 24px' }}>
            All modifications will go into place. We'll let the other party know of the changes.
          </p>
        )}

        <Button variant="primary" size="small" fullWidth onClick={handleConfirm}>Confirm changes</Button>
        <div style={{ marginTop: 12 }}>
          <Button variant="default" size="small" fullWidth onClick={() => setView('review')}>Go back</Button>
        </div>
      </BottomSheet>
    )
  }

  // view === 'review' — all items sorted by effective date
  const reviewItems = [
    ...added.map(({ unit: u, chargeAmount }) => {
      const startDate = parseDate(u.startDate)
      if (u._parentTime) {
        // "Edit all future" time change — new unit forked from existing rule
        return {
          key: `add-${u.id}`,
          date: startDate,
          label: `${fmtTime(u._parentTime)} ${ul(u.serviceId)} moved to ${fmtTime(u.startTime)}`,
          sublabel: `Starting ${fmtDateLong(startDate)}, ${shortRuleLabel(u).replace(/^Repeats/, 'repeats')}`,
        }
      }
      if (u.frequency === 'once') {
        return {
          key: `add-${u.id}`,
          date: startDate,
          label: `Added ${fmtTime(u.startTime)} ${ul(u.serviceId)}`,
          sublabel: `${fmtDateLong(startDate)}${chargeSuffix(chargeAmount)}`,
        }
      }
      return {
        key: `add-${u.id}`,
        date: startDate,
        label: `Added ${fmtTime(u.startTime)} rule`,
        sublabel: `Starting ${fmtDateLong(startDate)}, ${shortRuleLabel(u).replace(/^Repeats/, 'repeats')}${chargeSuffix(chargeAmount)}`,
      }
    }),
    ...removed.map(({ unit: u, refundAmount }) => {
      const startDate = parseDate(u.startDate)
      if (u.frequency === 'once') {
        return {
          key: `rem-${u.id}`,
          date: startDate,
          label: `Removed ${fmtTime(u.startTime)} ${ul(u.serviceId)}`,
          sublabel: `${fmtDateLong(startDate)}${refundSuffix(refundAmount)}`,
        }
      }
      const allOccs = expandUnit(u)
      const lastOcc = allOccs.length > 0 ? allOccs[allOccs.length - 1] : null
      const endDate = lastOcc ? lastOcc.start : startDate
      return {
        key: `rem-${u.id}`,
        date: startDate,
        label: `Removed ${fmtTime(u.startTime)} rule`,
        sublabel: `${shortRuleLabel(u)}, ends ${fmtDateLong(endDate)}${refundSuffix(refundAmount)}`,
      }
    }),
    ...modified.map(({ saved, draft }) => {
      const isEnded = !saved.repeatEndDate && !!draft.repeatEndDate
      return {
        key: `mod-${draft.id}`,
        date: draft.repeatEndDate ? parseDate(draft.repeatEndDate) : parseDate(draft.startDate),
        label: isEnded ? `Removed ${fmtTime(draft.startTime)} rule` : `Updated ${fmtTime(draft.startTime)} rule`,
        sublabel: isEnded
          ? `${shortRuleLabel(draft)}, ends ${fmtDateLong(parseDate(draft.repeatEndDate))}`
          : `${shortRuleLabel(draft)}${draft.repeatEndDate ? `, ends ${fmtDate(parseDate(draft.repeatEndDate))}` : ''}`,
      }
    }),
    ...skipped.map(({ unit, dk, refundAmount }) => ({
      key: `skip-${unit.id}-${dk}`,
      date: parseDate(dk),
      label: `Removed ${fmtTime(unit.startTime)} ${ul(unit.serviceId)}`,
      sublabel: `${fmtDateLong(parseDate(dk))}${refundSuffix(refundAmount)}`,
    })),
    ...overridden.map(({ unit, dk, newTime }) => ({
      key: `ovr-${unit.id}-${dk}`,
      date: parseDate(dk),
      label: `${fmtTime(unit.startTime)} ${ul(unit.serviceId)} moved to ${fmtTime(newTime)}`,
      sublabel: fmtDateLong(parseDate(dk)),
    })),
  ].sort((a, b) => a.date - b.date)

  return (
    <BottomSheet variant="full" onDismiss={onBack} header={header}>
      {reviewItems.map(item => (
        <Row key={item.key} label={item.label} sublabel={item.sublabel} />
      ))}
      <div style={{ marginTop: 24 }}>
        <Button variant="primary" size="small" fullWidth onClick={handlePrimaryAction}>Confirm changes</Button>
        <div style={{ marginTop: 12 }}>
          <Button variant="default" size="small" fullWidth onClick={onBack}>Go back</Button>
        </div>
      </div>
    </BottomSheet>
  )
}
