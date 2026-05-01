import { useState, useRef, useEffect } from 'react'
import { R, fontFamily } from './theme'
import { PROTO_TODAY } from '../../data/owners'
import { parseDate, dateKey, fmtDate, fmtMonthYear, fmtTime, addDays, isToday, isPast } from '../../lib/dateUtils'
import { getWeekMonday, shortRuleLabel, unitTotalCost } from '../../lib/scheduleHelpers'
import Button from '../../components/Button'
import PetAvatar from '../../components/PetAvatar'
import { textStyles } from '../../tokens'
import { MoreIcon, DropdownIcon, CheckIcon } from '../../assets/icons'

const DAY_NAMES_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function AgendaView({agenda, pets, onAdd, allEnded, upcomingRef, currentWeekRef, firstUpcomingKey, relEndDate, incompleteKey, ownerFirstName, scrollContainerRef, addedUnitIds, changedUnitIds, overriddenKeys, removedKeys, updatedUnitIds, onTap, onReview}) {
  const [showJump, setShowJump] = useState(false)
  const [activeMo, setActiveMo] = useState(null)
  const monthRefs = useRef(new Map())

  useEffect(() => {
    const containerEl = scrollContainerRef?.current
    if (!containerEl) return
    const update = () => {
      const containerTop = containerEl.getBoundingClientRect().top
      let active = null
      for (const [mo, el] of monthRefs.current) {
        if (el.getBoundingClientRect().top <= containerTop + 1) active = mo
      }
      if (!active) active = monthRefs.current.keys().next().value ?? null
      setActiveMo(active)
    }
    update()
    containerEl.addEventListener('scroll', update)
    return () => containerEl.removeEventListener('scroll', update)
  }, [scrollContainerRef])

  const endCard = allEnded ? (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'48px 24px 120px',gap:24}}>
      <PetAvatar size={80} images={(pets || []).map(p => p.img)}/>
      <div style={{textAlign:'center'}}>
        <p style={{...textStyles.display400,color:R.navy,margin:'0 0 10px'}}>
          No walks scheduled after this
        </p>
        <p style={{fontFamily,fontSize:14,color:R.gray,margin:0,lineHeight:1.6}}>
          Add a walk or template anytime to keep things going — you can plan ahead, even before the last walk.
        </p>
      </div>
      <div style={{width:'100%',display:'flex',flexDirection:'column',gap:12}}>
        <Button variant="primary" fullWidth onClick={onAdd}>Add a walk</Button>
        <Button variant="default" fullWidth>End recurring walks</Button>
      </div>
    </div>
  ) : null

  if(agenda.length === 0) return endCard ?? (
    <div style={{textAlign:"center",padding:"48px 20px",color:R.grayLight}}>
      <div style={{fontSize:32,marginBottom:8}}>📅</div>
      <div style={{fontSize:14,fontWeight:600,fontFamily}}>No upcoming services</div>
    </div>
  )

  const todayMid = new Date(PROTO_TODAY); todayMid.setHours(0,0,0,0)

  // Collect unique service short names for gap-week messages
  const svcShortMap = { dog_walking: 'walk', doggy_daycare: 'daycare', drop_in: 'drop-in', boarding: 'stay', house_sitting: 'stay' }
  const svcNames = [...new Set(agenda.flatMap(([, occs]) => occs.map(o => svcShortMap[o.svc.id] || o.svc.label.toLowerCase())))]
  const emptyWeekSvc = svcNames.length === 1 ? `${svcNames[0]}s` : 'services'

  // Build a map of week-monday-key → entries, excluding fully past weeks
  const thisWeekMonday = getWeekMonday(todayMid)
  const weekEntryMap = new Map()
  agenda.forEach(([dayKey, occs]) => {
    const monday = getWeekMonday(parseDate(dayKey))
    if (monday < thisWeekMonday) return  // skip weeks entirely before the current week
    const wk     = dateKey(monday)
    if (!weekEntryMap.has(wk)) weekEntryMap.set(wk, [])
    weekEntryMap.get(wk).push([dayKey, occs])
  })

  if (weekEntryMap.size === 0) return endCard ?? (
    <div style={{textAlign:"center",padding:"48px 20px",color:R.grayLight}}>
      <div style={{fontSize:32,marginBottom:8}}>📅</div>
      <div style={{fontSize:14,fontWeight:600,fontFamily}}>No upcoming services</div>
    </div>
  )

  // Generate all weeks in range (including gaps)
  const sortedWks   = [...weekEntryMap.keys()].sort()
  const firstMonday = parseDate(sortedWks[0])
  const lastMonday  = parseDate(sortedWks[sortedWks.length - 1])
  const allWeeks    = []
  let cur = new Date(firstMonday)
  while (cur <= lastMonday) {
    const wk = dateKey(cur)
    allWeeks.push({ monday: new Date(cur), wk, entries: weekEntryMap.get(wk) || null })
    cur = addDays(cur, 7)
  }

  // Find last week with actual entries (for showEndMarker)
  const lastEntryWk = sortedWks[sortedWks.length - 1]

  // Build monthGroups from allWeeks
  const monthGroups = []
  let _lastMo = null
  allWeeks.forEach(({ monday, wk, entries }) => {
    const sunday = addDays(monday, 6)
    const mo     = `${sunday.getFullYear()}-${sunday.getMonth()}`
    if (mo !== _lastMo) { monthGroups.push({ mo, label: fmtMonthYear(sunday), weeks: [] }); _lastMo = mo }
    monthGroups[monthGroups.length - 1].weeks.push({ monday, wk, entries })
  })

  const allMonths    = monthGroups.map(({ mo, label }) => ({ mo, label }))
  const ownerName    = ownerFirstName || 'Pet parent'

  return (
    <div>
      {monthGroups.map(({mo, label, weeks}) => (
        <div key={mo} ref={el => el ? monthRefs.current.set(mo, el) : monthRefs.current.delete(mo)}>
          <div style={{position:"sticky",top:0,zIndex:mo === activeMo && showJump ? 20 : 2,background:R.white,paddingTop:24,paddingBottom:16,borderBottom:`1px solid ${R.separator}`}}>
            <button
              onClick={() => { if (mo === activeMo) setShowJump(v => !v) }}
              style={{display:"flex",alignItems:"center",width:"100%",background:"none",border:"none",cursor:mo === activeMo ? "pointer" : "default",padding:0}}
            >
              <p style={{...textStyles.heading300,color:R.navy,margin:0,flex:1,textAlign:"left"}}>{label}</p>
              {mo === activeMo && <DropdownIcon />}
            </button>
            {mo === activeMo && showJump && <>
              <div style={{position:"fixed",inset:0,zIndex:9}} onClick={() => setShowJump(false)} />
              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",borderRadius:8,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",border:`1.5px solid ${R.separator}`,zIndex:10,overflow:"hidden"}}>
                <div className="hide-scrollbar" style={{maxHeight:224,overflowY:"auto"}}>
                  {allMonths.map(({ mo: mKey, label: mLabel }) => {
                    const isCurrent = mKey === mo
                    return (
                      <div
                        key={mKey}
                        onMouseDown={() => {
                const containerEl = scrollContainerRef?.current
                const targetEl = monthRefs.current.get(mKey)
                if (containerEl && targetEl) {
                  const offset = targetEl.getBoundingClientRect().top - containerEl.getBoundingClientRect().top + containerEl.scrollTop
                  containerEl.scrollTo({ top: offset, behavior: 'smooth' })
                }
                setShowJump(false)
              }}
                        style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",cursor:"pointer",background:isCurrent?"#EBF1FB":"transparent"}}
                      >
                        <span style={{fontFamily,fontSize:14,fontWeight:isCurrent?600:400,color:isCurrent?R.blue:R.navy}}>{mLabel}</span>
                        {isCurrent && <CheckIcon />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>}
          </div>
          {weeks.map(({monday, wk, entries}) => {
            const isPaid           = monday <= todayMid
            const isCurrentWk      = dateKey(monday) === dateKey(getWeekMonday(todayMid))
            const isFullyPast      = isPaid && !isCurrentWk
            const isGapWeek        = entries === null
            const fmtMoney         = n => `$${n.toFixed(2)}`
            const weekTotal        = isGapWeek ? 0 : entries.reduce((sum, [,occs]) => sum + occs.reduce((s, occ) => addedUnitIds?.has(occ.unit.id) ? s : s + unitTotalCost(occ.unit), 0), 0)
            const incompleteCount  = isGapWeek || !isFullyPast ? 0 : entries.reduce((sum, [,occs]) => sum + occs.filter(occ => occ.key === incompleteKey).length, 0)
            const paymentLabel     = isGapWeek
              ? `There are no ${emptyWeekSvc} this week`
              : isFullyPast
                ? `${incompleteCount} incomplete card${incompleteCount !== 1 ? 's' : ''}`
                : `${ownerName} ${isPaid ? 'paid' : 'will be charged'} ${fmtMoney(weekTotal)}`
            const paymentColor     = isGapWeek ? R.grayLight : isFullyPast ? '#654418' : R.gray
            const isLastWeek       = wk === lastEntryWk
            return (
              <div key={wk}>
                <div ref={isCurrentWk ? currentWeekRef : null} style={{paddingTop:16,paddingBottom:8}}>
                  <p style={{...textStyles.heading200,color:isGapWeek ? R.grayLight : R.navy,margin:0}}>Week of {fmtDate(monday)}</p>
                  <p style={{...textStyles.text100,color:paymentColor,margin:"4px 0 0"}}>{paymentLabel}</p>
                </div>
                {!isGapWeek && <div style={{background:R.bg,borderRadius:12,padding:'16px',marginBottom:8}}>
                {entries.map(([dayKey, occs], entryIdx) => {
                  const d             = parseDate(dayKey)
                  const today         = isToday(d), past = isPast(d)
                  const isLastEntry   = isLastWeek && entryIdx === entries.length - 1
                  const showEndMarker = relEndDate && isLastEntry
                  return (
                    <div key={dayKey} data-day-key={dayKey} ref={dayKey === firstUpcomingKey ? upcomingRef : null} style={{marginBottom: entryIdx === entries.length - 1 ? 0 : 16}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <p style={{...textStyles.heading100,color:R.navy,margin:0,flex:1}}>{`${DAY_NAMES_FULL[d.getDay()]}, ${fmtDate(d)}`}</p>
                      </div>
                      {occs.map((occ, occIdx) => {
                        const isOccToday    = today && !past
                        const isBlocked     = isOccToday && occIdx > 0
                        const showReviewBtn = occ.key === incompleteKey
                        const overnight     = occ.svc.type === "overnight"
                        const timeLabel     = overnight
                          ? `${fmtDate(occ.start)} – ${fmtDate(occ.end)}`
                          : fmtTime(occ.unit.startTime)
                        const isAdded          = addedUnitIds?.has(occ.unit.id)
                        const changedToTime    = overriddenKeys?.get(occ.key)
                        const unitChangedFrom  = changedUnitIds?.get(occ.unit.id)
                        const isRemoved        = removedKeys?.has(occ.key)
                        const isUpdated        = !isAdded && !changedToTime && !unitChangedFrom && updatedUnitIds?.has(occ.unit.id)
                        const originalTime     = changedToTime && occ.parentUnit ? fmtTime(occ.parentUnit.startTime) : timeLabel
                        const unitOriginalTime = unitChangedFrom ? fmtTime(unitChangedFrom) : timeLabel
                        const flagBorder       = isAdded ? R.successBorder : isRemoved ? R.errorBorder : (changedToTime || unitChangedFrom || isUpdated) ? R.highlight : R.cardBorder
                        const headingColor     = isAdded ? R.success : isRemoved ? R.red : (changedToTime || unitChangedFrom || isUpdated) ? R.blue : R.navy
                        const headingText      = isAdded
                          ? `${timeLabel} · Added`
                          : isRemoved
                            ? `${timeLabel} · Removed`
                            : changedToTime
                              ? `${originalTime} · Changed to ${fmtTime(changedToTime)}`
                              : unitChangedFrom
                                ? `${unitOriginalTime} · Changed to ${timeLabel}`
                                : isUpdated
                                  ? `${timeLabel} · Updated`
                                  : timeLabel
                        return (
                          <div key={`${occ.key}-${occ.nightIndex || 0}`} style={{border:`2px solid ${flagBorder}`,borderRadius:8,padding:"0 16px",background:isRemoved?R.redLight:R.white,marginBottom:8}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:16,paddingBottom:isOccToday || showReviewBtn ? 8 : 16}}>
                              <div style={{flex:1}}>
                                <p style={{...textStyles.text200Semibold,color:headingColor,margin:"0 0 4px"}}>{headingText}</p>
                                <p style={{...textStyles.text100,color:R.gray,margin:0}}>{shortRuleLabel(occ.unit)}</p>
                              </div>
                              {!past && !showReviewBtn && !isRemoved && <Button variant="default" icon={<MoreIcon size={16}/>} onClick={e => {e.stopPropagation(); onTap(occ)}}/>}
                              {past && !showReviewBtn && !isRemoved && <div style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CheckIcon /></div>}
                            </div>
                            {isOccToday && (
                              <div style={{display:"flex",gap:8,paddingTop:8,paddingBottom:16}}>
                                <Button variant="primary" style={{flex:1}} disabled={isBlocked}>Start Rover Card</Button>
                              </div>
                            )}
                            {showReviewBtn && (
                              <div style={{display:"flex",gap:8,paddingBottom:8}}>
                                <Button variant="flat" style={{flex:1}} onClick={e => {e.stopPropagation(); onReview(occ)}}>Review and complete</Button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {showEndMarker && (
                        <div style={{display:"flex",alignItems:"center",gap:12,marginTop:8}}>
                          <div style={{flex:1,height:1,background:R.amberBorder}}/>
                          <div style={{display:"flex",alignItems:"center",gap:6,background:R.amberLight,border:`1.5px solid ${R.amberBorder}`,borderRadius:99,padding:"5px 14px",whiteSpace:"nowrap"}}>
                            <span style={{fontSize:13}}>⏰</span>
                            <span style={{fontSize:12,fontWeight:600,color:"#7A5800",fontFamily}}>Relationship ends {fmtDate(parseDate(relEndDate))}</span>
                          </div>
                          <div style={{flex:1,height:1,background:R.amberBorder}}/>
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>}
              </div>
            )
          })}
        </div>
      ))}
      {endCard ?? <div style={{height:80}}/>}
    </div>
  )
}
