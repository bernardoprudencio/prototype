import { useState } from 'react'
import { R, fontFamily } from './theme'
import { SERVICES } from '../../data/services'
import { PETS_SEED } from '../../data/owners'
import { parseDate, dateKey, fmtDate, fmtDateLong, fmtTime, addDays, endTimeFromDuration } from '../../lib/dateUtils'
import { defaultUnit, shortSvcName, getScheduleHorizon } from '../../lib/scheduleHelpers'
import Button from '../../components/Button'
import Row from '../../components/Row'
import PetAvatar from '../../components/PetAvatar'
import BottomSheet from '../../components/BottomSheet'
import RadioRow from '../../components/RadioRow'
import { ChevronRightIcon } from '../../assets/icons'
import UnitEditor from './UnitEditor'
import boardingIcon from '../../assets/boarding.svg'
import sittingIcon  from '../../assets/sitting.svg'
import daycareIcon  from '../../assets/daycare.svg'
import dropInIcon   from '../../assets/drop-in.svg'
import walkingIcon  from '../../assets/walking.svg'

const SvcIcon = ({ src }) => <img src={src} alt="" style={{ width: 24, height: 24 }} />
const SERVICE_ICONS = {
  boarding:      <SvcIcon src={boardingIcon} />,
  house_sitting: <SvcIcon src={sittingIcon} />,
  doggy_daycare: <SvcIcon src={daycareIcon} />,
  drop_in:       <SvcIcon src={dropInIcon} />,
  dog_walking:   <SvcIcon src={walkingIcon} />,
}

export default function AddSheet({onAdd, onClose, existing, allPets, defaultServiceId, defaultDurationMins}) {
  const initialSvc = defaultServiceId ? SERVICES.find(s => s.id === defaultServiceId) : null
  const pets       = allPets || PETS_SEED
  const makeInitUnit = svcObj => {
    const today            = new Date()
    const durationOverride = (defaultDurationMins && svcObj.id !== 'doggy_daycare') ? {durationMins: defaultDurationMins} : {}
    return {...defaultUnit(svcObj.id, {petIds: pets.map(p => p.id), ...durationOverride}), frequency:"weekly", weekDays:[today.getDay()], startDate:dateKey(today)}
  }
  const [addView,     setAddView]     = useState(initialSvc ? "form" : "pick")
  const [svc,         setSvc]         = useState(initialSvc)
  const [unit,        setUnit]        = useState(initialSvc ? makeInitUnit(initialSvc) : null)
  const [scopeChoice, setScopeChoice] = useState("this")

  const handleUnitChange = updated => {
    const prev     = unit
    const prevDays = (prev?.weekDays || []).slice().sort((a,b) => a-b).join(",")
    const nextDays = (updated.weekDays || []).slice().sort((a,b) => a-b).join(",")
    if(prevDays !== nextDays && (updated.weekDays || []).length === 1 && updated.startDate) {
      const targetDow = updated.weekDays[0]
      const base      = parseDate(updated.startDate)
      const diff      = ((targetDow - base.getDay()) + 7) % 7
      if(diff !== 0) updated = {...updated, startDate: dateKey(addDays(base, diff))}
    }
    setUnit(updated)
  }

  const draftDate     = unit?.startDate ? parseDate(unit.startDate) : null
  const draftEndT     = unit?.startTime && unit?.durationMins ? endTimeFromDuration(unit.startTime, unit.durationMins) : null
  const dateTimeLabel = draftDate && unit?.startTime
    ? `${fmtDate(draftDate)} · ${fmtTime(unit.startTime)} to ${fmtTime(draftEndT)}`
    : draftDate ? fmtDate(draftDate) : "Today — default"
  const isMultiDay    = (unit?.weekDays || []).length > 1
  const svcName       = svc ? shortSvcName(svc) : ""

  const handleSave = () => {
    if(!unit?.startDate) return
    if(isMultiDay) { onAdd({...unit, frequency:"weekly"}); onClose() }
    else { setScopeChoice("this"); setAddView("scopePicker") }
  }

  const sheetHeader = (label, sublabel) => (
    <Row label={label} sublabel={sublabel} rightItem={<PetAvatar size={48} images={pets.map(p => p.img)}/>} firstRow/>
  )

  if(addView === "pick") return (
    <BottomSheet variant="full" onDismiss={onClose} header={<h3 style={{margin:0,fontSize:18,fontWeight:600,color:R.navy,fontFamily}}>Add a service</h3>}>
      <div style={{paddingBottom:12}}>
        {SERVICES.map(s => (
          <Row key={s.id} label={s.label} sublabel={s.desc} leftItem={SERVICE_ICONS[s.id]} rightItem={<ChevronRightIcon/>}
            onClick={() => {setSvc(s); setUnit(makeInitUnit(s)); setAddView("form")}}/>
        ))}
      </div>
    </BottomSheet>
  )

  if(addView === "form") return (
    <BottomSheet onDismiss={onClose}>
      {sheetHeader(`Add ${svcName}`, draftDate ? fmtDateLong(draftDate) : "Today — default")}
      <div style={{marginBottom:8}}/>
      <UnitEditor unit={unit} onChange={handleUnitChange} allUnits={existing} allPets={pets} simplified maxDate={dateKey(getScheduleHorizon())}/>
      <Button variant="primary" size="small" fullWidth disabled={!unit?.startDate} onClick={handleSave}>Save changes</Button>
      <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={onClose}>Close</Button></div>
    </BottomSheet>
  )

  if(addView === "scopePicker") return (
    <BottomSheet onDismiss={onClose}>
      {sheetHeader(`Add ${svcName}`, dateTimeLabel)}
      <RadioRow label={`One-time ${svcName}`} value="this" selected={scopeChoice} onSelect={setScopeChoice}/>
      <RadioRow label="Repeat weekly from this date" value="following" selected={scopeChoice} onSelect={setScopeChoice}/>
      <div style={{marginTop:8}}>
        <Button variant="primary" size="small" fullWidth onClick={() => {
          scopeChoice === "this" ? onAdd({...unit, frequency:"once", weekDays:[]}) : onAdd({...unit, frequency:"weekly"})
          onClose()
        }}>Save changes</Button>
        <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={onClose}>Close</Button></div>
      </div>
    </BottomSheet>
  )

  return null
}
