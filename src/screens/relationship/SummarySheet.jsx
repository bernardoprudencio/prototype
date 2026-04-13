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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function fmtDays(days) {
  const names = days.map(d => DAY_NAMES[d])
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

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
  const { savedTotal, draftTotal, net, lineItems, hasActivity } = computeWeekBilling(savedUnits, draftUnits, pets)

  // --- Approach A: group "remove from date forward" into semantic rows ---
  // Handles chained removals (e.g. remove Mon, then Wed from same rule) by building
  // a forward chain: modified root → continuation A → continuation B → ...
  // Each link in the chain becomes one "Removed X walk" row.
  const consumedAddedIds    = new Set()
  const consumedModifiedIds = new Set()
  const consumedSkipKeys    = new Set()
  const continuationGroups  = []

  const addedByUnitId = new Map(added.map(a => [a.unit.id, a]))

  for (const { unit: rootCont } of added) {
    if (!rootCont._continuation) continue
    if (consumedAddedIds.has(rootCont.id)) continue

    // Only start a chain from a unit whose parent is in modified (the original saved rule)
    const rootParentMod = modified.find(({ saved, draft }) =>
      !consumedModifiedIds.has(draft.id) &&
      !saved.repeatEndDate &&
      draft.repeatEndDate === rootCont.startDate &&
      draft.startTime === rootCont.startTime &&
      draft.serviceId === rootCont.serviceId
    )
    if (!rootParentMod) continue

    // Build forward chain: rootCont → next (if rootCont is also truncated) → ...
    const chain = [{ contUnit: rootCont, parentWeekDays: rootParentMod.saved.weekDays || [] }]
    let current = rootCont
    while (current.repeatEndDate) {
      const next = added.find(({ unit: au }) =>
        au._continuation &&
        !consumedAddedIds.has(au.id) &&
        au.id !== current.id &&
        au.startDate === current.repeatEndDate &&
        au.startTime === current.startTime &&
        au.serviceId === current.serviceId
      )
      if (!next) break
      chain.push({ contUnit: next.unit, parentWeekDays: current.weekDays || [] })
      current = next.unit
    }

    consumedModifiedIds.add(rootParentMod.draft.id)

    // Consume all units in the chain (including no-op transitions)
    chain.forEach(({ contUnit }) => consumedAddedIds.add(contUnit.id))

    // If the terminal node has a repeatEndDate but no continuation was found,
    // endRuleFromDate() was called — the remaining days also end.
    const terminalNode = chain[chain.length - 1].contUnit
    const isTerminated = !!terminalNode.repeatEndDate

    // Effective continuation days: the terminal node's weekDays (empty if terminated)
    const effectiveContDays = isTerminated ? [] : (terminalNode.weekDays || [])

    // Annotate each link with removedDays, then filter out no-op links (removedDays=[]).
    // This handles the case where two consecutive continuation units share the same weekDays
    // because the user moved the removal date earlier — those transitions produce no new removal.
    const meaningfulLinks = chain
      .map((link, i) => ({
        ...link,
        removedDays: link.parentWeekDays.filter(d => !(link.contUnit.weekDays || []).includes(d)),
        originalIndex: i,
      }))
      .filter(link => link.removedDays.length > 0)

    const paidThru = getPaidThruSunday()
    const todayMid = new Date(PROTO_TODAY); todayMid.setHours(0, 0, 0, 0)

    for (let i = 0; i < meaningfulLinks.length; i++) {
      const { contUnit, removedDays, originalIndex } = meaningfulLinks[i]
      const isLastMeaningful = i === meaningfulLinks.length - 1
      const pivotDate = parseDate(contUnit.startDate)

      // Refund: first link uses skipped entries (from saved rule); subsequent links
      // compute from the parent unit's occurrences on the removed days in the paid window.
      let refundAmount = 0
      if (originalIndex === 0) {
        const matchedSkips = skipped.filter(({ unit: su, dk }) =>
          !consumedSkipKeys.has(`${su.id}-${dk}`) &&
          dk === contUnit.startDate &&
          su.startTime === contUnit.startTime &&
          su.serviceId === contUnit.serviceId
        )
        refundAmount = matchedSkips.reduce((s, sk) => s + (sk.refundAmount || 0), 0)
        matchedSkips.forEach(({ unit: su, dk }) => consumedSkipKeys.add(`${su.id}-${dk}`))
      } else {
        const parentCont    = chain[originalIndex - 1].contUnit
        const removedInPaid = expandUnit(parentCont).filter(o =>
          !o.skipped &&
          removedDays.includes(o.start.getDay()) &&
          o.start >= pivotDate &&
          isPaidOcc(o.start, paidThru) &&
          o.start >= todayMid
        )
        refundAmount = removedInPaid.length * (parentCont.cost || 0)
      }

      continuationGroups.push({
        key: `cont-${contUnit.id}`,
        date: pivotDate,
        label: `Removed ${fmtTime(contUnit.startTime)} ${ul(contUnit.serviceId)}`,
        sublabel: `From ${fmtDateLong(pivotDate)} onward${refundSuffix(refundAmount)}`,
        contLabel: isLastMeaningful && !isTerminated && effectiveContDays.length > 0
          ? `${fmtDays(effectiveContDays)} ${ul(contUnit.serviceId)} continues as scheduled`
          : null,
      })
    }

    // If terminated (endRuleFromDate on a single-day rule), add one more row for the final removal
    if (isTerminated && terminalNode.weekDays && terminalNode.weekDays.length > 0) {
      const termPivotDate = parseDate(terminalNode.repeatEndDate)
      continuationGroups.push({
        key: `cont-${terminalNode.id}-end`,
        date: termPivotDate,
        label: `Removed ${fmtTime(terminalNode.startTime)} ${ul(terminalNode.serviceId)}`,
        sublabel: `From ${fmtDateLong(termPivotDate)} onward`,
        contLabel: null,
      })
    }
  }

  // Semantic change count: each continuation group = 1 change; remaining individual items = 1 each
  const remainingCount = (added.length - consumedAddedIds.size)
    + removed.length
    + (modified.length - consumedModifiedIds.size)
    + (skipped.length - consumedSkipKeys.size)
    + overridden.length
  const displayCount = continuationGroups.length + remainingCount

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
    if (view === 'review') {
      if (hasActivity) { setView('confirm'); return }
      handleConfirm()
      return
    }
    handleConfirm()
  }

  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 24 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...textStyles.heading300, color: R.navy, margin: 0 }}>
          {view === 'confirm' ? 'Review charges and refunds' : 'Review changes'}
        </p>
        <p style={{ ...textStyles.text100, color: R.gray, margin: '4px 0 0' }}>
          {isEmpty ? 'No changes to save' : `${displayCount} change${displayCount !== 1 ? 's' : ''}`}
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
    const fmt = n => `$${n.toFixed(2)}`
    const divider = { borderTop: `1px solid ${R.separator}` }

    return (
      <BottomSheet variant="full" onDismiss={() => setView('review')} header={header}>
        {hasActivity ? (
          <div style={{ background: R.bg, borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <p style={{ ...textStyles.heading200, color: R.navy, margin: '0 0 12px' }}>This week's summary</p>

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
    // Grouped continuation items (each represents 1 semantic "remove from date" action)
    ...continuationGroups,
    ...added
      .filter(({ unit: u }) => !consumedAddedIds.has(u.id))
      .map(({ unit: u, chargeAmount }) => {
        const startDate = parseDate(u.startDate)
        if (u._parentTime) {
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
    ...modified
      .filter(({ draft }) => !consumedModifiedIds.has(draft.id))
      .map(({ saved, draft }) => {
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
    ...skipped
      .filter(({ unit: su, dk }) => !consumedSkipKeys.has(`${su.id}-${dk}`))
      .map(({ unit, dk, refundAmount }) => ({
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
        <Row key={item.key} label={item.label} sublabel={item.sublabel} sublabel2={item.contLabel} />
      ))}
      <div style={{ marginTop: 24 }}>
        <Button variant="primary" size="small" fullWidth onClick={handlePrimaryAction}>{hasActivity ? 'Review charges and refunds' : 'Confirm changes'}</Button>
        <div style={{ marginTop: 12 }}>
          <Button variant="default" size="small" fullWidth onClick={onBack}>Go back</Button>
        </div>
      </div>
    </BottomSheet>
  )
}
