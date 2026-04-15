import { useState } from 'react'
import { R, fontFamily } from './theme'
import { textStyles } from '../../tokens'
import { computeScheduleDiff, shortRuleLabel, expandUnit, isPaidOcc, getPaidThruSunday, getWeekMonday, unitTotalCost } from '../../lib/scheduleHelpers'
import { parseDate, dateKey, addDays, fmtDate, fmtDateLong, fmtTime } from '../../lib/dateUtils'
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
  const paidThru   = getPaidThruSunday()
  const weekMonday = getWeekMonday(PROTO_TODAY)

  // All walks within the current Mon–Sun billing week (past + future)
  const weekOccs = units =>
    units.flatMap(u =>
      expandUnit(u)
        .filter(o => !o.skipped && o.start >= weekMonday && o.start <= paidThru)
        .map(o => ({ unit: u, occ: o }))
    )

  const savedOccs = weekOccs(savedUnits)
  const draftOccs = weekOccs(draftUnits)

const savedTotal = savedOccs.reduce((s, { unit: u }) => s + unitTotalCost(u), 0)
  const draftTotal = draftOccs.reduce((s, { unit: u }) => s + unitTotalCost(u), 0)

  // One line item per (pet × serviceId). Each occurrence increments every pet in the unit.
  const sourceOccs = draftOccs.length > 0 ? draftOccs : savedOccs
  const petSvcMap = new Map() // key: `${petId}|${serviceId}`
  for (const { unit: u } of sourceOccs) {
    for (const petId of (u.petIds || [])) {
      const key = `${petId}|${u.serviceId}`
      if (!petSvcMap.has(key)) {
        const pet = petsArr.find(p => p.id === petId)
        const rate = (u.petCosts || {})[petId] ?? 20
        petSvcMap.set(key, { unit: u, petNames: pet?.name || 'Pet', cost: rate, count: 0 })
      }
      petSvcMap.get(key).count += 1
    }
  }
  const lineItems = [...petSvcMap.values()].map(g => ({
    ...g,
    count: draftOccs.length > 0 ? g.count : 0,
    total: draftOccs.length > 0 ? g.count * g.cost : 0,
  }))

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

  // A single-occurrence time edit is superseded when the same occurrence is also removed.
  // Suppress such overrides everywhere (review list, count, confirm message).
  const effectiveOverridden = overridden.filter(({ unit, dk }) =>
    !skipped.some(sk => sk.unit.id === unit.id && sk.dk === dk)
  )

  const isEmpty = totalCount === 0
  const { savedTotal, draftTotal, net, lineItems, hasActivity } = computeWeekBilling(savedUnits, draftUnits, pets)
  const hasFinancialActivity = hasActivity || chargeTotal > 0 || refundTotal > 0

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

    // Only start a chain from a unit whose parent is in modified (the original saved rule).
    // Both cancelDayFromDate and overrideFromDate now set repeatEndDate to dk-1
    // (the day before the continuation's startDate).
    const dk1 = dateKey(addDays(parseDate(rootCont.startDate), -1))
    const rootParentMod = modified.find(({ saved, draft }) =>
      !consumedModifiedIds.has(draft.id) &&
      !saved.repeatEndDate &&
      draft.repeatEndDate === dk1 &&
      draft.serviceId === rootCont.serviceId
    )
    if (!rootParentMod) continue

    // Detect edit-time continuation: a _parentTime sibling starts on the same date
    const isEditContinuation = added.some(({ unit: au }) =>
      au._parentTime &&
      au.startDate === rootCont.startDate &&
      au.serviceId === rootCont.serviceId
    )

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

    // Edit-time continuation: unchanged days carried forward at original time.
    // Unify with the _parentTime sibling into one row: "Changed X to Y / From date onward".
    // Also handles the case where the continuation itself was later split by cancelDayFromDate:
    // in that case, suppress contLabel on the edit row and emit separate removal rows for the tail.
    if (isEditContinuation) {
      const pivotDate = parseDate(rootCont.startDate)
      const parentEntry = added.find(({ unit: au }) =>
        au._parentTime &&
        au.startDate === rootCont.startDate &&
        au.serviceId === rootCont.serviceId
      )
      if (parentEntry) {
        consumedAddedIds.add(parentEntry.unit.id)
        const pu = parentEntry.unit

        // Build a tail chain from rootCont by following subsequent cancelDayFromDate splits.
        // cancelDayFromDate sets repeatEndDate = dk-1 on parent, new unit startDate = dk,
        // so the link is: nextUnit.startDate === addDays(current.repeatEndDate, 1).
        const tailChain = []
        let tailCurrent = rootCont
        while (tailCurrent.repeatEndDate) {
          const nextStartDate = dateKey(addDays(parseDate(tailCurrent.repeatEndDate), 1))
          const nextEntry = added.find(({ unit: au }) =>
            au._continuation &&
            !consumedAddedIds.has(au.id) &&
            au.id !== tailCurrent.id &&
            au.startDate === nextStartDate &&
            au.startTime === tailCurrent.startTime &&
            au.serviceId === tailCurrent.serviceId
          )
          if (!nextEntry) break
          tailChain.push({ contUnit: nextEntry.unit, parentWeekDays: tailCurrent.weekDays || [] })
          consumedAddedIds.add(nextEntry.unit.id)
          tailCurrent = nextEntry.unit
        }

        // After the loop, tailCurrent is the last unit processed.
        // If it still has repeatEndDate AND that date is in skippedKeys, endRuleFromDate()
        // terminated it (no new continuation was created) — we'll need a final removal row.
        const isChainTerminated = !!(tailCurrent.repeatEndDate &&
          (tailCurrent.skippedKeys || []).includes(tailCurrent.repeatEndDate))

        // Terminal surviving days: only if the last unit has no repeatEndDate
        const terminalCont = tailChain.length > 0 ? tailChain[tailChain.length - 1].contUnit : null
        const terminalDays = terminalCont && !terminalCont.repeatEndDate
          ? (terminalCont.weekDays || [])
          : []

        // Only show contLabel on the edit row when the continuation is unmodified.
        // If rootCont itself has a repeatEndDate, it was further split — don't claim those days
        // "continue as scheduled" here; the tail removal rows will explain what happened.
        const hasTailChanges = tailChain.length > 0 || !!rootCont.repeatEndDate
        const editContDays = hasTailChanges ? [] : (rootCont.weekDays || [])

        let editSublabel, confirmUntil = ''
        if (pu.repeatEndDate) {
          const puOccs = expandUnit(pu)
          const lastOccStart = puOccs.length > 0 ? puOccs[puOccs.length - 1].start : pivotDate
          editSublabel = `From ${fmtDateLong(pivotDate)} until ${fmtDateLong(lastOccStart)}`
          confirmUntil = ` until ${fmtDate(lastOccStart)}`
        } else {
          editSublabel = `From ${fmtDateLong(pivotDate)} onward`
        }

        continuationGroups.push({
          key: `edit-${pu.id}`,
          date: pivotDate,
          label: `Changed ${fmtTime(pu._parentTime)} ${ul(pu.serviceId)} to ${fmtTime(pu.startTime)}`,
          sublabel: editSublabel,
          contLabel: null,
          isInformational: false,
          _confirmLine: `Changed ${ul(pu.serviceId)} from ${fmtTime(pu._parentTime)} to ${fmtTime(pu.startTime)} — from ${fmtDate(pivotDate)}${confirmUntil || ' onward'}`,
        })

        // Emit one removal row per meaningful tail transition (days removed from continuation).
        const tailMeaningful = tailChain
          .map(link => ({
            ...link,
            removedDays: link.parentWeekDays.filter(d => !(link.contUnit.weekDays || []).includes(d)),
          }))
          .filter(link => link.removedDays.length > 0)

        for (let ti = 0; ti < tailMeaningful.length; ti++) {
          const { contUnit } = tailMeaningful[ti]
          const isLastTail = ti === tailMeaningful.length - 1
          const tailPivot = parseDate(contUnit.startDate)
          // Only show contLabel on the last tail row when there are truly surviving days
          // (terminalDays is empty if terminalCont was itself later terminated)
          const tailContLabel = null
          continuationGroups.push({
            key: `cont-tail-${contUnit.id}`,
            date: tailPivot,
            label: `Removed ${fmtTime(contUnit.startTime)} ${ul(contUnit.serviceId)}`,
            sublabel: `From ${fmtDateLong(tailPivot)} onward`,
            contLabel: tailContLabel,
            isInformational: false,
            _confirmLine: `Removed ${fmtTime(contUnit.startTime)} ${ul(contUnit.serviceId)} — from ${fmtDate(tailPivot)} onward`,
          })
        }

        // If the final unit in the chain was terminated by endRuleFromDate (single-day removal),
        // emit one more removal row for that termination.
        if (isChainTerminated && (tailCurrent.weekDays || []).length > 0) {
          const termPivot = parseDate(tailCurrent.repeatEndDate)
          continuationGroups.push({
            key: `cont-tail-end-${tailCurrent.id}`,
            date: termPivot,
            label: `Removed ${fmtTime(tailCurrent.startTime)} ${ul(tailCurrent.serviceId)}`,
            sublabel: `From ${fmtDateLong(termPivot)} onward`,
            contLabel: null,
            isInformational: false,
            _confirmLine: `Removed ${fmtTime(tailCurrent.startTime)} ${ul(tailCurrent.serviceId)} — from ${fmtDate(termPivot)}`,
          })
        }
      } else {
        // Fallback: no _parentTime sibling found; show informational continuation row
        continuationGroups.push({
          key: `cont-${rootCont.id}`,
          date: pivotDate,
          label: `${fmtDays(rootCont.weekDays || [])} ${ul(rootCont.serviceId)} unchanged`,
          sublabel: `Starting ${fmtDateLong(pivotDate)}`,
          contLabel: null,
          isInformational: true,
        })
      }
      continue
    }

    // Remove-time continuation: build a forward chain and render each removed-day link.

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
        contLabel: null,
        isInformational: false,
        _confirmLine: `Removed ${fmtTime(contUnit.startTime)} ${ul(contUnit.serviceId)} — from ${fmtDate(pivotDate)} onward${refundSuffix(refundAmount)}`,
      })
    }

    // If the terminal node has a repeatEndDate, determine whether it was a genuine removal
    // (endRuleFromDate) or a split by cancelDayFromDate/overrideFromDate.
    // A split leaves a _continuation unit starting the day after repeatEndDate.
    // Genuine removals emit a final row; splits consume the orphaned continuation silently.
    if (isTerminated && terminalNode.weekDays && terminalNode.weekDays.length > 0) {
      const splitStart = dateKey(addDays(parseDate(terminalNode.repeatEndDate), 1))
      const splitConts = added.filter(({ unit: au }) =>
        au._continuation &&
        !consumedAddedIds.has(au.id) &&
        au.startDate === splitStart &&
        au.serviceId === terminalNode.serviceId
      )
      if (splitConts.length > 0) {
        // Split — the continuation carries forward unchanged days alongside a _parentTime
        // edit unit. Consume it silently; the edit row handles the summary.
        splitConts.forEach(({ unit: au }) => consumedAddedIds.add(au.id))
      } else {
        const termPivotDate = parseDate(terminalNode.repeatEndDate)
        continuationGroups.push({
          key: `cont-${terminalNode.id}-end`,
          date: termPivotDate,
          label: `Removed ${fmtTime(terminalNode.startTime)} ${ul(terminalNode.serviceId)}`,
          sublabel: `From ${fmtDateLong(termPivotDate)} onward`,
          contLabel: null,
          isInformational: false,
          _confirmLine: `Removed ${fmtTime(terminalNode.startTime)} ${ul(terminalNode.serviceId)} — from ${fmtDate(termPivotDate)}`,
        })
      }
    }
  }

  // Pre-consume skips that are covered by a "rule ended" modified entry (same unit, same date).
  // endRuleFromDate() both sets repeatEndDate and adds the date to skippedKeys — the refund
  // belongs to the rule row, not a separate skip row.
  const endedRuleRefunds = new Map() // draft.id → refundAmount
  modified
    .filter(({ draft }) => !consumedModifiedIds.has(draft.id))
    .forEach(({ saved, draft }) => {
      if (!saved.repeatEndDate && draft.repeatEndDate) {
        const matchedSkips = skipped.filter(({ unit: su, dk }) =>
          !consumedSkipKeys.has(`${su.id}-${dk}`) &&
          su.id === draft.id
        )
        matchedSkips.forEach(({ unit: su, dk }) => consumedSkipKeys.add(`${su.id}-${dk}`))
        const totalRefund = matchedSkips.reduce((s, sk) => s + (sk.refundAmount || 0), 0)
        if (matchedSkips.length > 0) endedRuleRefunds.set(draft.id, totalRefund)
      }
    })

  // Semantic change count: informational "continues" rows don't count as a change
  const remainingCount = (added.length - consumedAddedIds.size)
    + removed.length
    + (modified.length - consumedModifiedIds.size)
    + (skipped.length - consumedSkipKeys.size)
    + effectiveOverridden.length
  const displayCount = continuationGroups.filter(g => !g.isInformational).length + remainingCount

  const handleConfirm = () => {
    const items = [
      ...added.filter(({ unit: u }) => !consumedAddedIds.has(u.id)).map(({ unit: u }) => ({
        date: parseDate(u.startDate),
        line: u._parentTime
          ? `Changed ${ul(u.serviceId)} from ${fmtTime(u._parentTime)} to ${fmtTime(u.startTime)} — from ${fmtDate(parseDate(u.startDate))}${u.repeatEndDate ? ` until ${fmtDate(parseDate(u.repeatEndDate))}` : ' onward'}`
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
      ...modified
        .filter(({ draft }) => !consumedModifiedIds.has(draft.id))
        .map(({ saved, draft }) => {
          const isEnded = !saved.repeatEndDate && !!draft.repeatEndDate
          return {
            date: draft.repeatEndDate ? parseDate(draft.repeatEndDate) : parseDate(draft.startDate),
            line: isEnded
              ? `Ended ${ul(draft.serviceId)} rule — ${shortRuleLabel(draft)} at ${fmtTime(draft.startTime)}, ends ${fmtDate(parseDate(draft.repeatEndDate))}`
              : `Updated ${ul(draft.serviceId)} rule — ${shortRuleLabel(draft)} at ${fmtTime(draft.startTime)}${draft.repeatEndDate ? `, ends ${fmtDate(parseDate(draft.repeatEndDate))}` : ''}`,
          }
        }),
      ...continuationGroups
        .filter(g => g._confirmLine)
        .map(g => ({ date: g.date, line: g._confirmLine })),
      ...skipped
        .filter(({ unit: su, dk }) => !consumedSkipKeys.has(`${su.id}-${dk}`))
        .map(({ unit, dk }) => ({
          date: parseDate(dk),
          line: `Removed ${ul(unit.serviceId)} on ${fmtDate(parseDate(dk))}`,
      })),
      ...effectiveOverridden.map(({ unit, dk, newTime }) => ({
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
      if (hasFinancialActivity) { setView('confirm'); return }
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
        {hasFinancialActivity ? (
          <div style={{ background: R.bg, borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <p style={{ ...textStyles.heading200, color: R.navy, margin: '0 0 12px' }}>This week's summary</p>

            {lineItems.map((item, i) => (
              <div key={`${item.unit.serviceId}-${item.petNames}-${i}`} style={{ padding: '12px 0', ...(i > 0 ? divider : {}) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <p style={{ ...textStyles.text100Semibold, color: R.navy, margin: 0 }}>{item.petNames}</p>
                  <p style={{ ...textStyles.text100Semibold, color: R.navy, margin: 0 }}>{fmt(item.total)}</p>
                </div>
                <p style={{ ...textStyles.paragraph100, color: R.gray, margin: 0 }}>{SVC_LABEL(item.unit.serviceId)}</p>
                <p style={{ ...textStyles.paragraph100, color: R.gray, margin: 0 }}>
                  {fmt(item.cost)} per {UNIT_LABEL(item.unit.serviceId)} × {item.count} {item.count === 1 ? UNIT_LABEL(item.unit.serviceId) : UNIT_LABEL(item.unit.serviceId) + 's'}
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
          let ptSublabel
          if (u.repeatEndDate) {
            const ptOccs = expandUnit(u)
            const lastOccStart = ptOccs.length > 0 ? ptOccs[ptOccs.length - 1].start : startDate
            ptSublabel = `From ${fmtDateLong(startDate)} until ${fmtDateLong(lastOccStart)}`
          } else {
            ptSublabel = `From ${fmtDateLong(startDate)} onward`
          }
          return {
            key: `add-${u.id}`,
            date: startDate,
            label: `Changed ${fmtTime(u._parentTime)} ${ul(u.serviceId)} to ${fmtTime(u.startTime)}`,
            sublabel: ptSublabel,
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
        const endedRefund = endedRuleRefunds.get(draft.id) || 0
        return {
          key: `mod-${draft.id}`,
          date: draft.repeatEndDate ? parseDate(draft.repeatEndDate) : parseDate(draft.startDate),
          label: isEnded ? `Removed ${fmtTime(draft.startTime)} rule` : `Updated ${fmtTime(draft.startTime)} rule`,
          sublabel: isEnded
            ? `${shortRuleLabel(draft)}, ends ${fmtDateLong(parseDate(draft.repeatEndDate))}${refundSuffix(endedRefund)}`
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
    ...effectiveOverridden.map(({ unit, dk, newTime }) => ({
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
        <Button variant="primary" size="small" fullWidth onClick={handlePrimaryAction}>{hasFinancialActivity ? 'Review charges and refunds' : 'Confirm changes'}</Button>
        <div style={{ marginTop: 12 }}>
          <Button variant="default" size="small" fullWidth onClick={onBack}>Go back</Button>
        </div>
      </div>
    </BottomSheet>
  )
}
