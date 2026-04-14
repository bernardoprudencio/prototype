import { useState } from 'react'
import { R } from './theme'
import { textStyles } from '../../tokens'
import { dateKey, fmtDate, fmtDateLong, fmtTime, addDays, nightCount, endTimeFromDuration } from '../../lib/dateUtils'
import { shortSvcName } from '../../lib/scheduleHelpers'
import Button from '../../components/Button'
import Row from '../../components/Row'
import PetAvatar from '../../components/PetAvatar'
import BottomSheet from '../../components/BottomSheet'
import RadioRow from '../../components/RadioRow'
import { CancelIcon } from '../../assets/icons'
import UnitEditor from './UnitEditor'

export default function OccActionSheet({occ, allPets, onSaveUnit, onSkip, onOverride, onOverrideFromDate, onCancelDayFromDate, onCancel, onClose}) {
  const [view,  setView]  = useState("editForm")
  const [draft, setDraft] = useState({...occ.unit, startDate: dateKey(occ.start)})
  const [scope, setScope] = useState("this")

  const isRecurring = (occ.parentUnit || occ.unit).frequency !== "once"
  const overnight   = occ.svc.type === "overnight"
  const endT        = !overnight ? endTimeFromDuration(occ.unit.startTime, occ.unit.durationMins) : null
  const occPets         = allPets.filter(p => occ.unit.petIds.includes(p.id))
  const dateLabel       = overnight
    ? `${fmtDate(occ.start)} to ${fmtDate(occ.end)} · ${occ.totalNights || nightCount(occ.unit)} night${(occ.totalNights || nightCount(occ.unit)) !== 1 ? "s" : ""}`
    : `${fmtDateLong(occ.start)} · ${fmtTime(occ.unit.startTime)} to ${fmtTime(endT)}`
  const svcName = shortSvcName(occ.svc)
  const dayLabel = occ.start.toLocaleDateString('en-US', { weekday: 'long' })
  const followingDetail = `${fmtTime(occ.unit.startTime)} ${svcName}s on ${dayLabel}`

  const headerRow = label => (
    <Row label={label} sublabel={dateLabel} rightItem={<PetAvatar size={48} images={occPets.map(p => p.img)}/>} firstRow/>
  )

  const endRuleFromDate = () => {
    const baseUnit = occ.parentUnit || occ.unit
    const dk = dateKey(occ.start)
    if(dk === baseUnit.startDate) { onCancel(baseUnit) }
    else {
      const keys = baseUnit.skippedKeys || []
      onSaveUnit({...baseUnit, repeatEndDate: dk, skippedKeys: [...new Set([...keys, dk])]})
      onClose()
    }
  }

  const applyRemoveFollowing = () => {
    const parentUnit = occ.parentUnit || occ.unit
    if((parentUnit.weekDays || []).length > 1) { onCancelDayFromDate(occ) }
    else { endRuleFromDate() }
  }

  if(view === "editForm") {
    const timeChanged = draft.startTime !== occ.unit.startTime
    const handleSave = () => {
      if(!timeChanged) { onClose(); return }
      if(isRecurring) { setScope("this"); setView("editScope") }
      else { onSaveUnit(draft); onClose() }
    }
    const handleRemove = () => {
      if(isRecurring) { setScope("this"); setView("removeScope") }
      else { onCancel(occ.unit); onClose() }
    }
    return (
      <BottomSheet onDismiss={onClose}>
        {headerRow(`Edit ${svcName}`)}
        <div style={{marginBottom:8}}/>
        <UnitEditor unit={draft} onChange={setDraft} allUnits={[]} allPets={allPets} timeOnly/>
        <div onClick={handleRemove} style={{display:"flex",alignItems:"center",gap:10,minHeight:48,paddingTop:4,paddingBottom:20,cursor:"pointer"}}>
          <CancelIcon color={R.red}/>
          <p style={{...textStyles.text200,color:R.red,margin:0}}>Remove {svcName}</p>
        </div>
        <Button variant="primary" size="small" fullWidth onClick={handleSave}>Save changes</Button>
        <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={onClose}>Close</Button></div>
      </BottomSheet>
    )
  }

  if(view === "editScope") return (
    <BottomSheet onDismiss={onClose}>
      {headerRow(`Edit ${svcName}`)}
      <RadioRow label={`This ${svcName} only`} value="this" selected={scope} onSelect={setScope}/>
      <RadioRow label={`This and following ${svcName}s`} sublabel={followingDetail} value="following" selected={scope} onSelect={setScope}/>
      <div style={{marginTop:16}}>
        <Button variant="primary" size="small" fullWidth onClick={() => {scope === "this" ? onOverride(occ, draft) : onOverrideFromDate(occ, draft); onClose()}}>Save changes</Button>
        <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={onClose}>Close</Button></div>
      </div>
    </BottomSheet>
  )

  if(view === "removeScope") {
    const handleConfirm = () => {
      if(scope === "this") { onSkip(occ.key, true); onClose() }
      else { applyRemoveFollowing(); onClose() }
    }
    return (
      <BottomSheet onDismiss={onClose}>
        {headerRow(`Remove ${svcName}`)}
        <RadioRow label={`This ${svcName} only`} value="this" selected={scope} onSelect={setScope}/>
        <RadioRow label={`This and following ${svcName}s`} sublabel={followingDetail} value="following" selected={scope} onSelect={setScope}/>
        <div style={{marginTop:16}}>
          <Button variant="primary" size="small" fullWidth onClick={handleConfirm}>Save changes</Button>
          <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={onClose}>Close</Button></div>
        </div>
      </BottomSheet>
    )
  }

  return null
}
