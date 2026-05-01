import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
import { PETS_SEED, PROTO_TODAY } from '../../data/owners'
import { parseDate, dateKey, fmtDate, fmtRelDate, fmtTime, addDays, isPast, endTimeFromDuration } from '../../lib/dateUtils'
import { buildAgenda, expandUnit, getWeekMonday, defaultUnit, newId, shortRuleLabel, getRuleImpact } from '../../lib/scheduleHelpers'
import SummarySheet from './SummarySheet'
import Button from '../../components/Button'
import ReviewSheet from '../../components/ReviewSheet'
import { R, fontFamily } from './theme'
import AgendaView from './AgendaView'
import AddSheet from './AddSheet'
import OccActionSheet from './OccActionSheet'
import ManageSheet from './ManageSheet'

const RelationshipManagement = forwardRef(function RelationshipManagement({initialPets, initialUnits, ownerFirstName = '', onScheduleChange, onScheduleConfirmed, onReviewComplete, isIncompleteResolved = false}, ref) {
  const [pets,       setPets]       = useState(initialPets || PETS_SEED)
  const [units,      setUnits]      = useState(initialUnits || [])
  const [relEndDate, setRelEndDate] = useState("")
  const [showAdd,    setShowAdd]    = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [showSummary,setShowSummary]= useState(false)
  const [activeOcc,  setActiveOcc]  = useState(null)
  const [reviewOcc,  setReviewOcc]  = useState(null)
  const savedUnitsRef  = useRef(initialUnits || [])
  const [savedVersion, setSavedVersion] = useState(0)
  const [scrollToKey, setScrollToKey] = useState(null)

  const emit = (text, committedUnits) => onScheduleChange?.(text, committedUnits)

  const hasChanges = JSON.stringify(units) !== JSON.stringify(savedUnitsRef.current)

  const scrollRef      = useRef(null)
  const upcomingRef    = useRef(null)
  const currentWeekRef = useRef(null)

  useEffect(() => {
    if (!scrollToKey || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-day-key="${scrollToKey}"]`)
    if (!el) return
    const containerTop = scrollRef.current.getBoundingClientRect().top
    const elTop        = el.getBoundingClientRect().top
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollTop + (elTop - containerTop) - 72, behavior: 'smooth' })
    setScrollToKey(null)
  }, [scrollToKey])

  useEffect(() => {
    if(allPastEntries.length > 0) return
    if(currentWeekRef.current && scrollRef.current) {
      const containerTop = scrollRef.current.getBoundingClientRect().top
      const elTop        = currentWeekRef.current.getBoundingClientRect().top
      scrollRef.current.scrollTop += (elTop - containerTop) - 72
    }
  }, [])

  const updateUnit = u => setUnits(prev => prev.map(x => x.id === u.id ? u : x))

  const skipOccurrence = (occKey, skip) => {
    setUnits(prev => prev.map(u => {
      const occs = expandUnit(u)
      if(!occs.find(o => o.key === occKey)) return u
      const dayKey2 = occKey.replace(`${u.id}-`, "")
      const keys    = u.skippedKeys || []
      return {...u, skippedKeys: skip ? [...new Set([...keys, dayKey2])] : keys.filter(k => k !== dayKey2)}
    }))
  }

  const overrideOccurrence = (occ, draft) => {
    const dk       = dateKey(occ.start)
    const parentId = occ.parentUnit ? occ.parentUnit.id : occ.unit.id
    setUnits(prev => prev.map(u => {
      if(u.id !== parentId) return u
      const overrides = {...(u.overrides || {})}
      overrides[dk]   = {serviceId:draft.serviceId, startTime:draft.startTime, durationMins:draft.durationMins, petIds:draft.petIds}
      return {...u, overrides}
    }))
  }

  const cancelDayFromDate = occ => {
    const parentUnit  = occ.parentUnit || occ.unit
    const occDow      = occ.start.getDay()
    const newWeekDays = (parentUnit.weekDays || []).filter(d => d !== occDow)
    const dk          = dateKey(occ.start)
    setUnits(prev => {
      const updated = prev.map(u =>
        u.id !== parentUnit.id ? u : {...u, repeatEndDate: dateKey(addDays(occ.start, -1))}
      )
      const newUnit = {
        ...defaultUnit(parentUnit.serviceId, {
          petIds:      parentUnit.petIds,
          petCosts:    parentUnit.petCosts,
          startDate:   dk,
          startTime:   parentUnit.startTime,
          durationMins:parentUnit.durationMins,
          frequency:   parentUnit.frequency,
          weekDays:    newWeekDays,
          everyNWeeks: parentUnit.everyNWeeks,
        }),
        repeatEndDate: parentUnit.repeatEndDate || "",
        _continuation: true,
      }
      return [...updated, newUnit]
    })
  }

  const overrideFromDate = (occ, draft) => {
    const dk       = dateKey(occ.start)
    const parentId = occ.parentUnit ? occ.parentUnit.id : occ.unit.id
    setUnits(prev => {
      const parent  = prev.find(u => u.id === parentId); if(!parent) return prev
      const occDow    = occ.start.getDay()
      const otherDays = (parent.weekDays || []).filter(d => d !== occDow)
      const common    = { repeatEndDate: parent.repeatEndDate || "", endDate: parent.endDate || "" }

      // Editing from the very first occurrence — no need to split, just replace parent
      if (dk === parent.startDate) {
        if ((parent.weekDays || []).length <= 1) {
          // Single-day: update in-place, no new units
          return prev.map(u => u.id !== parentId ? u : {...u, startTime: draft.startTime, durationMins: draft.durationMins})
        }
        // Multi-day: replace parent entirely to avoid a zombie with repeatEndDate < startDate
        const changedUnit = {
          ...defaultUnit(draft.serviceId, {
            petIds: draft.petIds, petCosts: parent.petCosts, startDate: dk, startTime: draft.startTime,
            durationMins: draft.durationMins, frequency: parent.frequency,
            weekDays: [occDow], everyNWeeks: parent.everyNWeeks,
          }),
          ...common,
          _parentTime: parent.startTime,
        }
        const continuationUnit = {
          ...defaultUnit(parent.serviceId, {
            petIds: parent.petIds, petCosts: parent.petCosts, startDate: dk, startTime: parent.startTime,
            durationMins: parent.durationMins, frequency: parent.frequency,
            weekDays: otherDays, everyNWeeks: parent.everyNWeeks,
          }),
          ...common,
          _continuation: true,
        }
        const rest = prev.filter(u => u.id !== parentId)
        return otherDays.length > 0 ? [...rest, changedUnit, continuationUnit] : [...rest, changedUnit]
      }

      const updated = prev.map(u => u.id !== parentId ? u : {...u, repeatEndDate: dateKey(addDays(occ.start, -1))})
      // Rule for the edited weekday with new time
      const changedUnit = {
        ...defaultUnit(draft.serviceId, {
          petIds:      draft.petIds,
          petCosts:    parent.petCosts,
          startDate:   dk,
          startTime:   draft.startTime,
          durationMins:draft.durationMins,
          frequency:   parent.frequency,
          weekDays:    [occDow],
          everyNWeeks: parent.everyNWeeks,
        }),
        ...common,
        _parentTime: parent.startTime,
      }
      if (otherDays.length === 0) return [...updated, changedUnit]
      // Rule for remaining weekdays — continuation at original time
      const continuationUnit = {
        ...defaultUnit(parent.serviceId, {
          petIds:      parent.petIds,
          petCosts:    parent.petCosts,
          startDate:   dk,
          startTime:   parent.startTime,
          durationMins:parent.durationMins,
          frequency:   parent.frequency,
          weekDays:    otherDays,
          everyNWeeks: parent.everyNWeeks,
        }),
        ...common,
        _continuation: true,
      }
      return [...updated, changedUnit, continuationUnit]
    })
  }

  const overrideFromDateAll = (occ, draft) => {
    const dk       = dateKey(occ.start)
    const parentId = occ.parentUnit ? occ.parentUnit.id : occ.unit.id
    setUnits(prev => {
      const parent = prev.find(u => u.id === parentId); if(!parent) return prev

      // Editing from the very first occurrence — update all weekdays in-place
      if(dk === parent.startDate) {
        return prev.map(u => u.id !== parentId ? u : {...u, startTime: draft.startTime, durationMins: draft.durationMins})
      }

      // Split: end original at day before, new rule keeps ALL weekdays with new time
      const updated = prev.map(u =>
        u.id !== parentId ? u : {...u, repeatEndDate: dateKey(addDays(occ.start, -1))}
      )
      const changedUnit = {
        ...defaultUnit(draft.serviceId, {
          petIds:       draft.petIds,
          petCosts:     parent.petCosts,
          startDate:    dk,
          startTime:    draft.startTime,
          durationMins: draft.durationMins,
          frequency:    parent.frequency,
          weekDays:     parent.weekDays,
          everyNWeeks:  parent.everyNWeeks,
        }),
        repeatEndDate: parent.repeatEndDate || "",
        endDate:       parent.endDate || "",
        _parentTime:   parent.startTime,
      }
      return [...updated, changedUnit]
    })
  }

  const [resolvedIncompleteKey, setResolvedIncompleteKey] = useState(null)

  const allEnded = units.length > 0 && units.every(u => !!u.repeatEndDate)
  const agenda = buildAgenda(units, relEndDate)

  // Draft change flags — badge agenda cards until changes are saved/dismissed
  const addedUnitIds = useMemo(() => {
    const savedIds = new Set(savedUnitsRef.current.map(u => u.id))
    return new Set(units.filter(u => !savedIds.has(u.id) && !u._parentTime && !u._continuation).map(u => u.id))
  }, [units, savedVersion])
  // forked units: "edit all future" time changes — new unit spawned from existing one
  const changedUnitIds = useMemo(() => {
    const savedIds = new Set(savedUnitsRef.current.map(u => u.id))
    const map = new Map()
    for (const u of units) {
      if (!savedIds.has(u.id) && u._parentTime && u._parentTime !== u.startTime) {
        map.set(u.id, u._parentTime) // unitId → original time
      }
    }
    return map
  }, [units, savedVersion])
  const overriddenKeys = useMemo(() => {
    const map = new Map()
    for (const draft of units) {
      const saved = savedUnitsRef.current.find(u => u.id === draft.id)
      if (!saved) continue
      const savedOvr = saved.overrides || {}
      const draftOvr = draft.overrides || {}
      for (const dk of Object.keys(draftOvr)) {
        if (!savedOvr[dk] || savedOvr[dk].startTime !== draftOvr[dk].startTime) {
          map.set(`${draft.id}-${dk}`, draftOvr[dk].startTime)
        }
      }
    }
    return map
  }, [units, savedVersion])
  const { removedOccKeys, agendaWithRemoved } = useMemo(() => {
    // Compare by (serviceId + date) so continuation units (new IDs) don't cause false "removed" flags
    const draftByDateSvc = new Set(
      units.flatMap(u => expandUnit(u).filter(o => !o.skipped).map(o => `${u.serviceId}-${dateKey(o.start)}`))
    )
    const savedOccs   = savedUnitsRef.current.flatMap(u => expandUnit(u).filter(o => !o.skipped))
    const removedOccs = savedOccs.filter(o => !draftByDateSvc.has(`${o.parentUnit.serviceId}-${dateKey(o.start)}`))
    const keys = new Set(removedOccs.map(o => o.key))
    if (removedOccs.length === 0) return { removedOccKeys: keys, agendaWithRemoved: agenda }
    const byDay = new Map(agenda.map(([dk, occs]) => [dk, [...occs]]))
    for (const occ of removedOccs) {
      const dk = dateKey(occ.start)
      if (!byDay.has(dk)) byDay.set(dk, [])
      if (!byDay.get(dk).some(o => o.key === occ.key)) {
        byDay.get(dk).push(occ)
        byDay.get(dk).sort((a, b) => a.unit.startTime.localeCompare(b.unit.startTime))
      }
    }
    return { removedOccKeys: keys, agendaWithRemoved: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)) }
  }, [agenda, units, savedVersion])
  // Continuation units (rule was split) — flag their occurrences as "Updated"
  const updatedUnitIds = useMemo(() => {
    const savedIds = new Set(savedUnitsRef.current.map(u => u.id))
    return new Set(units.filter(u => !savedIds.has(u.id) && u._continuation).map(u => u.id))
  }, [units, savedVersion])

  const incompleteKey = useMemo(() => {
    const thisMonday   = getWeekMonday(PROTO_TODAY)
    const lastMonday   = addDays(thisMonday, -7)
    const lastWeekOccs = agenda.flatMap(([, occs]) => occs).filter(occ => occ.start >= lastMonday && occ.start < thisMonday)
    if(!lastWeekOccs.length) return null
    return lastWeekOccs.reduce((max, occ) => occ.start > max.start ? occ : max).key
  }, [agenda])
  const effectiveIncompleteKey = (incompleteKey === resolvedIncompleteKey || isIncompleteResolved) ? null : incompleteKey

  const thisMonday             = getWeekMonday(PROTO_TODAY)
  const allPastEntries         = agendaWithRemoved.filter(([dk, occs]) => { const d = parseDate(dk); return isPast(d) && d < thisMonday && occs.some(occ => occ.key === effectiveIncompleteKey) })
  const currentWeekPastEntries = agendaWithRemoved.filter(([dk]) => { const d = parseDate(dk); return isPast(d) && d >= thisMonday })
  const allUpcoming            = agendaWithRemoved.filter(([dk]) => !isPast(parseDate(dk)))

  useImperativeHandle(ref, () => ({
    openAdd:    () => setShowAdd(true),
    openManage: () => setShowManage(true),
  }))

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:R.white,position:"relative"}}>
      <div ref={scrollRef} className="hide-scrollbar" style={{flex:1,overflowY:"auto",padding:"0 16px 0"}}>
        <AgendaView
          agenda={[...allPastEntries, ...currentWeekPastEntries, ...allUpcoming]}
          pets={pets}
          onAdd={() => setShowAdd(true)}
          allEnded={allEnded}
          upcomingRef={upcomingRef}
          currentWeekRef={currentWeekRef}
          firstUpcomingKey={allUpcoming[0]?.[0]}
          relEndDate={relEndDate}
          incompleteKey={null}
          ownerFirstName={ownerFirstName}
          scrollContainerRef={scrollRef}
          addedUnitIds={addedUnitIds}
          changedUnitIds={changedUnitIds}
          overriddenKeys={overriddenKeys}
          removedKeys={removedOccKeys}
          updatedUnitIds={null}
          onTap={setActiveOcc}
          onReview={setReviewOcc}
        />
      </div>
      {hasChanges && (
        <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:10,background:R.white,borderTop:`1px solid ${R.separator}`,padding:16,display:"flex",gap:12}}>
          <Button variant="primary" style={{flex:1}} onClick={() => setShowSummary(true)}>Save changes</Button>
          <Button variant="default" onClick={() => setUnits(savedUnitsRef.current)}>Dismiss</Button>
        </div>
      )}

      {showAdd && (
        <AddSheet
          onAdd={u => {
            const finalUnit = {...u, petIds: u.petIds.length ? u.petIds : pets.map(p => p.id)}
            setUnits(prev => [...prev, finalUnit])
            setShowAdd(false)
            const firstOcc = expandUnit(finalUnit).find(o => !o.skipped)
            if (firstOcc) setScrollToKey(dateKey(firstOcc.start))
          }}
          onClose={() => setShowAdd(false)}
          existing={units}
          allPets={pets}
          defaultServiceId={units[0]?.serviceId}
          defaultDurationMins={units[0]?.durationMins}
        />
      )}
      {showManage && (
        <ManageSheet units={units} pets={pets} onUnitsChange={setUnits} onClose={() => setShowManage(false)} onAdd={() => { setShowManage(false); setShowAdd(true) }}/>
      )}
      {activeOcc && (
        <OccActionSheet
          occ={activeOcc}
          allPets={pets}
          onSaveUnit={u => { updateUnit(u); setActiveOcc(null) }}
          onSkip={skipOccurrence}
          onOverride={overrideOccurrence}
          onOverrideFromDate={overrideFromDate}
          onOverrideFromDateAll={overrideFromDateAll}
          onCancelDayFromDate={cancelDayFromDate}
          onCancel={u => { setActiveOcc(null); setUnits(prev => prev.filter(x => x.id !== u.id)) }}
          onClose={() => setActiveOcc(null)}
        />
      )}
{showSummary && (
        <SummarySheet
          savedUnits={savedUnitsRef.current}
          draftUnits={units}
          pets={pets}
          onConfirm={text => {
            savedUnitsRef.current = units
            setSavedVersion(v => v + 1)
            emit(text, units)
            setShowSummary(false)
            onScheduleConfirmed?.()
          }}
          onBack={() => setShowSummary(false)}
        />
      )}
      {reviewOcc && (() => {
        const occPets = pets.filter(p => reviewOcc.unit.petIds.includes(p.id))
        const endT    = endTimeFromDuration(reviewOcc.unit.startTime, reviewOcc.unit.durationMins)
        const card    = {
          label:    `${reviewOcc.svc.label}${occPets.length > 0 ? `: ${occPets.map(p => p.name).join(", ")}` : ""}`,
          sublabel: `${fmtRelDate(reviewOcc.start)} · ${fmtTime(reviewOcc.unit.startTime)} to ${fmtTime(endT)}`,
          images:   occPets.map(p => p.img),
          cost:     (() => { const t = Object.values(reviewOcc.unit.petCosts || {}).reduce((s,c)=>s+c,0); return t > 0 ? `$${t.toFixed(2)}` : "" })(),
          dateLabel: fmtRelDate(reviewOcc.start),
        }
        const handleResolve = resolution => {
          onReviewComplete?.(resolution, card)
          if(reviewOcc.key === incompleteKey) setResolvedIncompleteKey(incompleteKey)
          setReviewOcc(null)
        }
        return <ReviewSheet visible card={card} onClose={() => setReviewOcc(null)} onComplete={() => handleResolve('completed')} onCancelRefund={() => handleResolve('cancelled')}/>
      })()}
    </div>
  )
})

export default RelationshipManagement
