import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
import { PETS_SEED, PROTO_TODAY } from '../../data/owners'
import { parseDate, dateKey, fmtDate, fmtRelDate, fmtTime, addDays, isPast, endTimeFromDuration } from '../../lib/dateUtils'
import { buildAgenda, expandUnit, getWeekMonday, getPaidThruSunday, isPaidOcc, defaultUnit, newId, shortRuleLabel, getRuleImpact } from '../../lib/scheduleHelpers'
import SummarySheet from './SummarySheet'
import Button from '../../components/Button'
import ReviewSheet from '../../components/ReviewSheet'
import { R, fontFamily } from './theme'
import AgendaView from './AgendaView'
import AddSheet from './AddSheet'
import OccActionSheet from './OccActionSheet'
import ManageSheet from './ManageSheet'
import DeleteConfirmDialog from './DeleteConfirmDialog'

const RelationshipScreen = forwardRef(function RelationshipScreen({initialPets, initialUnits, ownerFirstName = '', onScheduleChange, onReviewComplete, isIncompleteResolved = false}, ref) {
  const [pets,       setPets]       = useState(initialPets || PETS_SEED)
  const [units,      setUnits]      = useState(initialUnits || [])
  const [relEndDate, setRelEndDate] = useState("")
  const [showAdd,    setShowAdd]    = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [showSummary,setShowSummary]= useState(false)
  const [activeOcc,  setActiveOcc]  = useState(null)
  const [reviewOcc,  setReviewOcc]  = useState(null)
  const [cancelUnit, setCancelUnit] = useState(null)
  const savedUnitsRef = useRef(initialUnits || [])
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
      const updated = prev.map(u => u.id !== parentUnit.id ? u : {...u, repeatEndDate: dateKey(addDays(occ.start, -1))})
      const newUnit = {
        ...defaultUnit(parentUnit.serviceId, {
          petIds:      parentUnit.petIds,
          startDate:   dk,
          startTime:   parentUnit.startTime,
          durationMins:parentUnit.durationMins,
          frequency:   parentUnit.frequency,
          weekDays:    newWeekDays,
          everyNWeeks: parentUnit.everyNWeeks,
        }),
        repeatEndDate: parentUnit.repeatEndDate || "",
      }
      return [...updated, newUnit]
    })
  }

  const overrideFromDate = (occ, draft) => {
    const dk       = dateKey(occ.start)
    const parentId = occ.parentUnit ? occ.parentUnit.id : occ.unit.id
    setUnits(prev => {
      const parent  = prev.find(u => u.id === parentId); if(!parent) return prev
      const updated = prev.map(u => u.id !== parentId ? u : {...u, repeatEndDate: dateKey(addDays(occ.start, -1))})
      const newUnit = {
        ...defaultUnit(draft.serviceId, {
          petIds:      draft.petIds,
          startDate:   dk,
          startTime:   draft.startTime,
          durationMins:draft.durationMins,
          frequency:   draft.frequency,
          weekDays:    draft.weekDays,
          everyNWeeks: draft.everyNWeeks,
        }),
        repeatEndDate: parent.repeatEndDate || "",
        endDate:       parent.endDate || "",
      }
      return [...updated, newUnit]
    })
  }

  const [resolvedIncompleteKey, setResolvedIncompleteKey] = useState(null)

  const allEnded = units.length > 0 && units.every(u => !!u.repeatEndDate)
  const agenda = buildAgenda(units, relEndDate)
  const incompleteKey = useMemo(() => {
    const thisMonday   = getWeekMonday(PROTO_TODAY)
    const lastMonday   = addDays(thisMonday, -7)
    const lastWeekOccs = agenda.flatMap(([, occs]) => occs).filter(occ => occ.start >= lastMonday && occ.start < thisMonday)
    if(!lastWeekOccs.length) return null
    return lastWeekOccs.reduce((max, occ) => occ.start > max.start ? occ : max).key
  }, [agenda])
  const effectiveIncompleteKey = (incompleteKey === resolvedIncompleteKey || isIncompleteResolved) ? null : incompleteKey

  const thisMonday             = getWeekMonday(PROTO_TODAY)
  const allPastEntries         = agenda.filter(([dk, occs]) => { const d = parseDate(dk); return isPast(d) && d < thisMonday && occs.some(occ => occ.key === effectiveIncompleteKey) })
  const currentWeekPastEntries = agenda.filter(([dk]) => { const d = parseDate(dk); return isPast(d) && d >= thisMonday })
  const allUpcoming            = agenda.filter(([dk]) => !isPast(parseDate(dk)))

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
          incompleteKey={effectiveIncompleteKey}
          ownerFirstName={ownerFirstName}
          scrollContainerRef={scrollRef}
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
          onCancelDayFromDate={cancelDayFromDate}
          onCancel={u => { setActiveOcc(null); setCancelUnit(u) }}
          onClose={() => setActiveOcc(null)}
        />
      )}
      {cancelUnit && (
        <DeleteConfirmDialog
          unit={cancelUnit}
          units={units}
          onDelete={id => {
            setUnits(prev => prev.filter(x => x.id !== id))
          }}
          onDeleteKeepPaid={id => {
            const u      = units.find(x => x.id === id); if(!u) return
            const paidThru= getPaidThruSunday()
            const occs   = expandUnit(u).filter(o => !o.skipped && isPaidOcc(o.start, paidThru))
            const kept   = occs.map(o => ({...defaultUnit(u.serviceId, {petIds:u.petIds, startDate:dateKey(o.start), endDate:u.endDate?dateKey(o.end||o.start):"", startTime:u.startTime, durationMins:u.durationMins}), frequency:"once"}))
            setUnits(prev => [...prev.filter(x => x.id !== id), ...kept])
          }}
          onRefundAndDelete={id => {
            setUnits(prev => prev.filter(x => x.id !== id))
          }}
          onClose={() => setCancelUnit(null)}
        />
      )}
      {showSummary && (
        <SummarySheet
          savedUnits={savedUnitsRef.current}
          draftUnits={units}
          pets={pets}
          onConfirm={text => {
            savedUnitsRef.current = units
            emit(text, units)
            setShowSummary(false)
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
          cost:     reviewOcc.unit.cost ? `$${reviewOcc.unit.cost.toFixed(2)}` : "",
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

export default RelationshipScreen
