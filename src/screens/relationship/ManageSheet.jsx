import { useState } from 'react'
import { R, fontFamily, labelSt } from './theme'
import { textStyles } from '../../tokens'
import { SERVICES } from '../../data/services'
import { PROTO_TODAY } from '../../data/owners'
import { parseDate, dateKey, fmtDate, fmtDateLong, fmtTime, addDays, endTimeFromDuration } from '../../lib/dateUtils'
import { newId, shortRuleLabel, getWeekSunday, getScheduleHorizon } from '../../lib/scheduleHelpers'
import Button from '../../components/Button'
import Row from '../../components/Row'
import PetAvatar from '../../components/PetAvatar'
import BottomSheet from '../../components/BottomSheet'
import DisabledInput from '../../components/DisabledInput'
import CalInput from '../../components/CalInput'
import TimeInput from '../../components/TimeInput'
import { CancelIcon, ChevronRightIcon } from '../../assets/icons'

export default function ManageSheet({units, pets, onUnitsChange, onClose, onAdd}) {
  const [view,        setView]        = useState("list")
  const [editingUnit, setEditingUnit] = useState(null)

  const unitLabel = id => ({ dog_walking: 'walk', drop_in: 'visit', doggy_daycare: 'day', boarding: 'night', house_sitting: 'night' })[id] ?? (SERVICES.find(s => s.id === id)?.label ?? id).toLowerCase()

  const recurring       = units.filter(u => u.frequency !== "once")
  const updateUnit      = updated => {
    const orig         = units.find(x => x.id === updated.id)
    const todayMid     = new Date(PROTO_TODAY); todayMid.setHours(0,0,0,0)
    const startedInPast= orig && orig.startDate && parseDate(orig.startDate) < todayMid
    if(startedInPast) {
      const todayKey     = dateKey(todayMid)
      const yesterdayKey = dateKey(addDays(todayMid, -1))
      onUnitsChange([
        ...units.map(x => x.id !== updated.id ? x : {...x, repeatEndDate: yesterdayKey}),
        {...updated, id: newId(), startDate: todayKey},
      ])
    } else {
      onUnitsChange(units.map(x => x.id === updated.id ? updated : x))
    }
    setView("list"); setEditingUnit(null)
  }

  const svc      = SERVICES.find(s => s.id === units[0]?.serviceId)
  const petNames = pets.map(p => p.name)
  const petStr   = petNames.length === 0 ? "" : petNames.length === 1 ? petNames[0] : petNames.slice(0,-1).join(", ") + " and " + petNames[petNames.length-1]
  const subtitle = svc ? `${svc.label} with ${petStr || "your pet"}` : ""

  const handleDismiss = () => {
    if(view === "edit") { setView("list"); setEditingUnit(null); return }
    onClose()
  }

  const u                   = editingUnit
  const editEndT            = u ? endTimeFromDuration(u.startTime, u.durationMins) : null
  const editRecurrenceLabel = u ? shortRuleLabel(u) : ""
  const editDateLabel       = u ? (u.repeatEndDate
    ? `${fmtDate(parseDate(u.startDate))} to ${fmtDate(parseDate(u.repeatEndDate))}`
    : `${fmtDate(parseDate(u.startDate))} with no end`) : ""
  const toggleWeekDay       = d => { if(!u) return; const days = u.weekDays || []; setEditingUnit({...u, weekDays: days.includes(d) ? days.filter(x => x !== d) : [...days, d]}) }
  const isWeekly            = u && u.frequency === "weekly"

  const todayMid    = new Date(PROTO_TODAY); todayMid.setHours(0,0,0,0)
  const startInPast = u && u.startDate && parseDate(u.startDate) < todayMid

  const cancelTemplate = () => {
    if (!u) return
    const paidThru = getWeekSunday(PROTO_TODAY)
    if (parseDate(u.startDate) > paidThru) {
      onUnitsChange(units.filter(x => x.id !== u.id))
    } else {
      onUnitsChange(units.map(x => x.id !== u.id ? x : { ...x, repeatEndDate: dateKey(paidThru) }))
    }
    onClose()
  }

  const header = (
    view === "list" ? (
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",paddingBottom:24}}>
        <div style={{flex:1,minWidth:0}}>
          <p style={{...textStyles.heading300,color:R.navy,margin:0}}>Recurring rules</p>
          <p style={{...textStyles.text100,color:R.gray,margin:"4px 0 0"}}>{subtitle}</p>
        </div>
        <PetAvatar size={48} images={pets.map(p => p.img)}/>
      </div>
    ) : view === "edit" && u ? (
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",paddingBottom:24}}>
        <div style={{flex:1,minWidth:0}}>
          <p style={{...textStyles.heading300,color:R.navy,margin:0}}>Edit rule: {fmtTime(u.startTime)}</p>
          <p style={{...textStyles.text100,color:R.gray,margin:"4px 0 0"}}>{editRecurrenceLabel}</p>
          <p style={{...textStyles.text100,color:R.gray,margin:"2px 0 0"}}>{editDateLabel}</p>
        </div>
        <PetAvatar size={48} images={pets.map(p => p.img)}/>
      </div>
    ) : null
  )

  const body = (
    view === "list" ? (
      <>
        {recurring.map(ru => {
          const endT            = endTimeFromDuration(ru.startTime, ru.durationMins)
          const timeLabel       = `${fmtTime(ru.startTime)} to ${fmtTime(endT)}`
          const recurrenceLabel = shortRuleLabel(ru)
          const isCancelled     = !!ru.repeatEndDate
          const dateLabel       = ru.repeatEndDate
            ? `Cancelled · ${fmtDate(parseDate(ru.startDate))} to ${fmtDate(parseDate(ru.repeatEndDate))}`
            : `${fmtDate(parseDate(ru.startDate))} with no end`
          return <Row key={ru.id} label={timeLabel} sublabel={recurrenceLabel} sublabel2={dateLabel} rightItem={isCancelled ? null : <ChevronRightIcon/>} onClick={isCancelled ? undefined : () => {setEditingUnit(ru); setView("edit")}}/>
        })}
        <div style={{marginTop:24}}>
          {onAdd && <Button variant="primary" size="small" fullWidth onClick={onAdd}>Add a {unitLabel(svc?.id ?? '')}</Button>}
          <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={onClose}>Close</Button></div>
        </div>
      </>
    ) : view === "edit" && u ? (
      <>
        <div style={{marginBottom:24}}>
          <label style={labelSt}>Start date</label>
          {startInPast
            ? <DisabledInput value={fmtDateLong(parseDate(u.startDate))}/>
            : <CalInput value={u.startDate} onChange={v => setEditingUnit({...u, startDate:v})} placeholder="Select date" maxDate={dateKey(getScheduleHorizon())}/>
          }
        </div>
        <div style={{marginBottom:24}}>
          <label style={labelSt}>Start time</label>
          <TimeInput value={u.startTime} onChange={v => setEditingUnit({...u, startTime:v})} placeholder="Select time"/>
          {u.startTime && u.durationMins && <p style={{...textStyles.paragraph100,color:R.gray,margin:"4px 0 0"}}>Ends at {fmtTime(editEndT)}</p>}
        </div>
        {isWeekly && (
          <div style={{marginBottom:24}}>
            <label style={labelSt}>Repeats on</label>
            <div style={{display:"flex",gap:8}}>
              {["M","T","W","T","F","S","S"].map((d,i) => {
                const jsDay  = [1,2,3,4,5,6,0][i]
                const active = (u.weekDays || []).includes(jsDay)
                return <button key={i} onClick={() => toggleWeekDay(jsDay)} style={{flex:1,minHeight:48,border:`2px solid ${active?"#2E67D1":"#C9CFD4"}`,borderRadius:8,background:active?"#ECF1FB":"#fff",color:R.navy,fontSize:16,fontFamily,fontWeight:400,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:"8px 4px",boxSizing:"border-box"}}>{d}</button>
              })}
            </div>
          </div>
        )}
        <div style={{marginBottom:8}}>
          <label style={labelSt}>End date</label>
          <DisabledInput value={u.repeatEndDate ? fmtDate(parseDate(u.repeatEndDate)) : "No end date"}/>
        </div>
        <div onClick={cancelTemplate} style={{display:"flex",alignItems:"center",gap:10,minHeight:56,paddingTop:8,paddingBottom:8,cursor:"pointer"}}>
          <CancelIcon color={R.red}/>
          <p style={{...textStyles.text200,color:R.red,margin:0}}>Cancel rule</p>
        </div>
        <div style={{marginTop:16}}>
          <Button variant="primary" size="small" fullWidth onClick={() => updateUnit(u)}>Save changes</Button>
          <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={onClose}>Close</Button></div>
        </div>
      </>
    ) : null
  )

  return (
    <BottomSheet variant="full" onDismiss={handleDismiss} header={header}>
      {body}
    </BottomSheet>
  )
}
