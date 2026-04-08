import { useState } from 'react'
import { R, fontFamily } from './theme'
import { computeScheduleDiff, shortRuleLabel } from '../../lib/scheduleHelpers'
import { parseDate, fmtDate, fmtTime } from '../../lib/dateUtils'
import BottomSheet from '../../components/BottomSheet'
import Button from '../../components/Button'
import Row from '../../components/Row'
import PetAvatar from '../../components/PetAvatar'

const UNIT_LABEL = id => ({ dog_walking: 'walk', drop_in: 'visit', doggy_daycare: 'day', boarding: 'night', house_sitting: 'night' })[id] ?? id

function financeLabel(amount, type) {
  if (!amount || amount <= 0) return ''
  return ` · $${amount.toFixed(2)} ${type}`
}

export default function SummarySheet({ savedUnits, draftUnits, pets, onConfirm, onBack }) {
  const [view, setView] = useState('review')
  const diff = computeScheduleDiff(savedUnits, draftUnits)
  const { added, removed, modified, skipped, refundTotal, chargeTotal, netAmount, totalCount } = diff

  const ul = UNIT_LABEL

  const isEmpty = totalCount === 0

  const handleConfirm = () => {
    const items = [
      ...added.map(({ unit: u }) => ({
        date: parseDate(u.startDate),
        line: u.frequency === 'once'
          ? `Added ${ul(u.serviceId)} on ${fmtDate(parseDate(u.startDate))}`
          : `Added ${ul(u.serviceId)} template — ${shortRuleLabel(u)} at ${fmtTime(u.startTime)} starting ${fmtDate(parseDate(u.startDate))}`,
      })),
      ...removed.map(({ unit: u }) => ({
        date: parseDate(u.startDate),
        line: u.frequency === 'once'
          ? `Removed ${ul(u.serviceId)} on ${fmtDate(parseDate(u.startDate))}`
          : `Removed ${ul(u.serviceId)} template — ${shortRuleLabel(u)} at ${fmtTime(u.startTime)} starting ${fmtDate(parseDate(u.startDate))}`,
      })),
      ...modified.map(({ draft }) => ({
        date: draft.repeatEndDate ? parseDate(draft.repeatEndDate) : parseDate(draft.startDate),
        line: `Updated ${ul(draft.serviceId)} template — ${shortRuleLabel(draft)} at ${fmtTime(draft.startTime)}${draft.repeatEndDate ? `, ends ${fmtDate(parseDate(draft.repeatEndDate))}` : ''}`,
      })),
      ...skipped.map(({ unit, dk }) => ({
        date: parseDate(dk),
        line: `Skipped ${ul(unit.serviceId)} on ${fmtDate(parseDate(dk))}`,
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
    if (netAmount !== 0 && view === 'review') { setView('confirm'); return }
    handleConfirm()
  }

  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 24 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily, fontWeight: 600, fontSize: 20, color: R.navy, margin: 0, lineHeight: 1.25 }}>
          {view === 'confirm' ? 'Confirm changes' : 'Review changes'}
        </p>
        <p style={{ fontFamily, fontWeight: 400, fontSize: 14, color: R.gray, margin: '4px 0 0', lineHeight: 1.25 }}>
          {isEmpty ? 'No changes to save' : `${totalCount} change${totalCount !== 1 ? 's' : ''}`}
        </p>
      </div>
      <PetAvatar size={48} images={pets.map(p => p.img)} />
    </div>
  )

  if (isEmpty) {
    return (
      <BottomSheet variant="full" onDismiss={onBack} header={header}>
        <p style={{ fontFamily, fontSize: 14, color: R.gray, margin: '0 0 24px', lineHeight: 1.5 }}>No changes to save.</p>
        <Button variant="default" size="small" fullWidth onClick={onBack}>Close</Button>
      </BottomSheet>
    )
  }

  if (view === 'confirm') {
    return (
      <BottomSheet variant="full" onDismiss={() => setView('review')} header={header}>
        <p style={{ fontFamily, fontSize: 14, color: R.navy, lineHeight: 1.5, margin: '0 0 16px' }}>
          Are you sure you want to confirm these changes?
        </p>
        {refundTotal > 0 && (
          <Row label="Refund" sublabel={`$${refundTotal.toFixed(2)} will be returned to the client`} />
        )}
        {chargeTotal > 0 && (
          <Row label="Charge" sublabel={`$${chargeTotal.toFixed(2)} will be charged to the client`} />
        )}
        {refundTotal > 0 && chargeTotal > 0 && (
          <Row
            label={netAmount >= 0 ? 'Net charge' : 'Net refund'}
            sublabel={`$${Math.abs(netAmount).toFixed(2)}`}
          />
        )}
        <div style={{ marginTop: 24 }}>
          <Button variant="primary" size="small" fullWidth onClick={handleConfirm}>Yes, confirm</Button>
          <div style={{ marginTop: 12 }}>
            <Button variant="default" size="small" fullWidth onClick={() => setView('review')}>Go back</Button>
          </div>
        </div>
      </BottomSheet>
    )
  }

  // view === 'review' — all items sorted by effective date
  const reviewItems = [
    ...added.map(({ unit: u, chargeAmount }) => ({
      key: `add-${u.id}`,
      date: parseDate(u.startDate),
      label: u.frequency === 'once' ? `Added ${ul(u.serviceId)}` : `Added ${ul(u.serviceId)} template`,
      sublabel: u.frequency === 'once'
        ? `${fmtDate(parseDate(u.startDate))}${financeLabel(chargeAmount, 'charged')}`
        : `${shortRuleLabel(u)} at ${fmtTime(u.startTime)} starting ${fmtDate(parseDate(u.startDate))}${financeLabel(chargeAmount, 'charged')}`,
    })),
    ...removed.map(({ unit: u, refundAmount }) => ({
      key: `rem-${u.id}`,
      date: parseDate(u.startDate),
      label: u.frequency === 'once' ? `Removed ${ul(u.serviceId)}` : `Removed ${ul(u.serviceId)} template`,
      sublabel: u.frequency === 'once'
        ? `${fmtDate(parseDate(u.startDate))}${financeLabel(refundAmount, 'refund')}`
        : `${shortRuleLabel(u)} at ${fmtTime(u.startTime)} starting ${fmtDate(parseDate(u.startDate))}${financeLabel(refundAmount, 'refund')}`,
    })),
    ...modified.map(({ draft }) => ({
      key: `mod-${draft.id}`,
      date: draft.repeatEndDate ? parseDate(draft.repeatEndDate) : parseDate(draft.startDate),
      label: `Updated ${ul(draft.serviceId)} template`,
      sublabel: `${shortRuleLabel(draft)} at ${fmtTime(draft.startTime)}${draft.repeatEndDate ? `, ends ${fmtDate(parseDate(draft.repeatEndDate))}` : ''}`,
    })),
    ...skipped.map(({ unit, dk, refundAmount }) => ({
      key: `skip-${unit.id}-${dk}`,
      date: parseDate(dk),
      label: `Skipped ${ul(unit.serviceId)}`,
      sublabel: `${fmtDate(parseDate(dk))}${financeLabel(refundAmount, 'refund')}`,
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
