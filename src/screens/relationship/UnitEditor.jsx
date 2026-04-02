import { useMemo } from 'react'
import { R, fontFamily, labelSt } from './theme'
import { SERVICES, DURATION_SHORT, DURATION_DAYCARE, FREQ, WEEKDAYS } from '../../data/services'
import { PETS_SEED } from '../../data/owners'
import { parseDate, dateKey, fmtDate, fmtDateLong, fmtTime, addDays, endTimeFromDuration } from '../../lib/dateUtils'
import { overlaps, overnightCanRepeat, expandUnit } from '../../lib/scheduleHelpers'
import CalInput from '../../components/CalInput'
import TimeInput from '../../components/TimeInput'

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({label, active, onClick, small, danger}) {
  const base = {padding:small?"4px 10px":"10px 16px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily,lineHeight:1.25,transition:"all 0.12s",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}
  if(danger) return <button onClick={onClick} style={{...base,border:`2px solid ${R.red}`,background:R.redLight,color:R.red}}>{label}</button>
  if(active) return (
    <button onClick={onClick} style={{...base,border:`2px solid #2E67D1`,background:"#ECF1FB",color:R.navy}}>
      <svg width="16" height="16" viewBox="0 0 32 32" fill="#2E67D1"><path d="M26.191 4.412a1 1 0 1 1 1.618 1.176l-16 22a1 1 0 0 1-1.516.12l-6-6a1 1 0 1 1 1.414-1.415l5.173 5.172L26.19 4.412z"/></svg>
      {label}
    </button>
  )
  return <button onClick={onClick} style={{...base,border:`2px solid ${R.border}`,background:"#fff",color:R.gray}}>{label}</button>
}

// ── PetSelector ───────────────────────────────────────────────────────────────
function PetSelector({pets, selectedIds, onChange}) {
  const toggle = id => {
    const ids = selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]
    if(ids.length) onChange(ids)
  }
  return (
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {pets.map(p => {
        const on = selectedIds.includes(p.id)
        return (
          <button key={p.id} onClick={() => toggle(p.id)} style={{padding:"10px 16px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",border:on?`2px solid #2E67D1`:`2px solid ${R.border}`,background:on?"#ECF1FB":"#fff",color:on?R.navy:R.gray,fontFamily,lineHeight:1.25,transition:"all 0.12s",display:"inline-flex",alignItems:"center",gap:6}}>
            {on && <svg width="16" height="16" viewBox="0 0 32 32" fill="#2E67D1"><path d="M26.191 4.412a1 1 0 1 1 1.618 1.176l-16 22a1 1 0 0 1-1.516.12l-6-6a1 1 0 1 1 1.414-1.415l5.173 5.172L26.19 4.412z"/></svg>}
            {p.name}
          </button>
        )
      })}
    </div>
  )
}

// ── UnitEditor ────────────────────────────────────────────────────────────────
export default function UnitEditor({unit, onChange, allUnits, allPets, simplified=false, timeOnly=false}) {
  const svc          = SERVICES.find(s => s.id === unit.serviceId)
  const overnight    = (svc && svc.type) === "overnight"
  const isDaycare    = (svc && svc.id) === "doggy_daycare"
  const conflict     = overlaps(allUnits, unit)
  const repeats      = unit.frequency !== "once"
  const isWeekly     = unit.frequency === "weekly"
  const canRepeat    = overnightCanRepeat(unit)
  const durationOpts = isDaycare ? DURATION_DAYCARE : DURATION_SHORT
  const pets         = allPets || PETS_SEED
  const toggleWeekDay = d => { const days = unit.weekDays || []; onChange({...unit, weekDays: days.includes(d) ? days.filter(x => x !== d) : [...days, d]}) }

  const bookedDates = useMemo(() => {
    if (!allUnits || allUnits.length === 0) return []
    const dates = new Set()
    allUnits.filter(u => u.id !== unit.id).forEach(u => {
      expandUnit(u).forEach(occ => dates.add(dateKey(occ.start)))
    })
    return [...dates]
  }, [allUnits, unit.id])

  if(timeOnly) return (
    <div style={{marginBottom:12}}>
      <div style={{marginBottom:20}}>
        <label style={labelSt}>Start time</label>
        <TimeInput value={unit.startTime} onChange={v => onChange({...unit, startTime:v})} placeholder="Select time…"/>
        {unit.startTime && unit.durationMins && <div style={{fontSize:14,color:R.gray,marginTop:4,lineHeight:1.5}}>Ends at {fmtTime(endTimeFromDuration(unit.startTime, unit.durationMins))}</div>}
      </div>
    </div>
  )

  return (
    <div style={{marginBottom:12}}>
      {conflict && <div style={{fontSize:12,background:R.redLight,color:R.red,fontWeight:600,padding:"8px 12px",borderRadius:8,marginBottom:10}}>⚠ Conflict with another service</div>}
      {overnight ? (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div><label style={labelSt}>Check-in</label><CalInput value={unit.startDate} onChange={v => onChange({...unit,startDate:v})} placeholder="Check-in date" bookedDates={bookedDates}/></div>
          <div><label style={labelSt}>Check-out</label><CalInput value={unit.endDate} onChange={v => onChange({...unit,endDate:v})} minDate={unit.startDate} placeholder="Check-out date"/></div>
        </div>
      ) : (
        <div style={{marginBottom:20}}>
          <div style={{marginBottom:20}}><label style={labelSt}>Date</label><CalInput value={unit.startDate} onChange={v => { const updated = {...unit,startDate:v}; if(isWeekly) updated.weekDays = [parseDate(v).getDay()]; onChange(updated) }} placeholder="Select date" bookedDates={bookedDates}/></div>
          <div><label style={labelSt}>Start time</label><TimeInput value={unit.startTime} onChange={v => onChange({...unit,startTime:v})} placeholder="Select time"/>
            {unit.startTime && unit.durationMins && <div style={{fontSize:14,color:R.gray,marginTop:4,lineHeight:1.5}}>Ends at {fmtTime(endTimeFromDuration(unit.startTime, unit.durationMins))}</div>}
          </div>
        </div>
      )}
      {!overnight && !simplified && (
        <div style={{marginBottom:12}}>
          <label style={labelSt}>{isDaycare ? "Hours" : "Duration"}</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {durationOpts.map(d => <Chip key={d.mins} label={d.label} active={unit.durationMins===d.mins} onClick={() => onChange({...unit,durationMins:d.mins})}/>)}
          </div>
        </div>
      )}
      {!simplified && <div style={{marginBottom:isWeekly && !overnight ? 0 : 12}}>
        <label style={labelSt}>Frequency</label>
        {overnight ? (
          canRepeat ? (
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {FREQ.map(f => <Chip key={f.id} label={f.label} active={unit.frequency===f.id} onClick={() => onChange({...unit,frequency:f.id,repeatEndDate:f.id==="once"?"":unit.repeatEndDate,weekDays:[],everyNWeeks:unit.everyNWeeks||1})}/>)}
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Chip label="One-time" active={true} onClick={() => {}}/>
              <span style={{fontSize:11,color:R.gray}}>Stays over 7 nights can't repeat</span>
            </div>
          )
        ) : (
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {FREQ.map(f => <Chip key={f.id} label={f.label} active={unit.frequency===f.id} onClick={() => { const wd = f.id === "weekly" ? ((unit.weekDays && unit.weekDays.length) > 0 ? unit.weekDays : [unit.startDate ? parseDate(unit.startDate).getDay() : new Date().getDay()]) : []; onChange({...unit,frequency:f.id,repeatEndDate:f.id==="once"?"":unit.repeatEndDate,weekDays:wd,everyNWeeks:unit.everyNWeeks||1}) }}/>)}
          </div>
        )}
      </div>}
      {isWeekly && overnight && (
        <div style={{background:R.bg,borderRadius:10,padding:"12px 14px",margin:"10px 0 12px",border:`1px solid ${R.border}`}}>
          <label style={{...labelSt,marginBottom:7}}>Every</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[1,2,3,4].map(n => <Chip key={n} small label={n===1?"week":`${n} weeks`} active={(unit.everyNWeeks||1)===n} onClick={() => onChange({...unit,everyNWeeks:n})}/>)}
          </div>
        </div>
      )}
      {isWeekly && !overnight && simplified && (
        <div style={{marginBottom:14}}>
          <label style={labelSt}>Repeats on</label>
          <div style={{display:"flex",gap:8}}>
            {["M","T","W","T","F","S","S"].map((d,i) => {
              const jsDay = [1,2,3,4,5,6,0][i]
              const active = (unit.weekDays || []).includes(jsDay)
              return (
                <button key={i} onClick={() => toggleWeekDay(jsDay)} style={{flex:1,minHeight:40,border:`2px solid ${active?"#2E67D1":"#C9CFD4"}`,borderRadius:8,background:active?"#ECF1FB":"#fff",color:R.navy,fontSize:16,fontFamily,fontWeight:400,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:"8px 12px",boxSizing:"border-box"}}>
                  {d}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {isWeekly && !overnight && !simplified && (
        <div style={{background:R.bg,borderRadius:10,padding:"12px 14px",margin:"10px 0 12px",border:`1px solid ${R.border}`}}>
          <div style={{marginBottom:10}}>
            <label style={{...labelSt,marginBottom:7}}>Repeat on</label>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {WEEKDAYS.map((d,i) => {
                const active = (unit.weekDays || []).includes(i)
                return <button key={i} onClick={() => toggleWeekDay(i)} style={{width:38,height:38,borderRadius:"50%",border:active?"2px solid transparent":`2px solid ${R.border}`,background:active?R.blue:"#fff",color:active?"#fff":R.navyMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily,transition:"all 0.12s",boxShadow:active?"0px 2px 12px rgba(27,31,35,0.24)":"none"}}>{d}</button>
              })}
            </div>
            {(unit.weekDays || []).length === 0 && <div style={{fontSize:11,color:R.gray,marginTop:5}}>Defaults to same weekday as start date</div>}
            {unit.startDate && (unit.weekDays || []).length > 0 && (() => { const b = parseDate(unit.startDate); const first = unit.weekDays.slice().sort((a,b2) => a-b2).map(d => addDays(b, ((d-b.getDay())+7)%7)).sort((a,b2) => a-b2)[0]; return <div style={{fontSize:11,color:R.blue,fontWeight:600,marginTop:5}}>📅 First: {fmtDateLong(first)}</div> })()}
          </div>
          <div>
            <label style={{...labelSt,marginBottom:7}}>Every</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[1,2,3,4].map(n => <Chip key={n} small label={n===1?"week":`${n} weeks`} active={(unit.everyNWeeks||1)===n} onClick={() => onChange({...unit,everyNWeeks:n})}/>)}
            </div>
          </div>
        </div>
      )}
      {!simplified && repeats && (
        <div style={{marginBottom:12,background:R.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${R.border}`}}>
          <label style={{...labelSt,marginBottom:5}}>Series ends <span style={{fontWeight:400,color:R.gray}}>(optional)</span></label>
          <CalInput value={unit.repeatEndDate||""} onChange={v => onChange({...unit,repeatEndDate:v})} minDate={unit.startDate} placeholder="No end date"/>
          <div style={{fontSize:11,color:R.gray,marginTop:5}}>{unit.repeatEndDate ? `Stops after ${fmtDate(parseDate(unit.repeatEndDate))}` : "No end — continues until relationship ends"}</div>
        </div>
      )}
      {!simplified && <div>
        <label style={labelSt}>For which pets?</label>
        <PetSelector pets={pets} selectedIds={unit.petIds} onChange={ids => onChange({...unit,petIds:ids,petOverride:true})}/>
        {unit.petOverride && <div style={{fontSize:10,color:R.gray,marginTop:5}}>Custom pet selection</div>}
      </div>}
    </div>
  )
}
