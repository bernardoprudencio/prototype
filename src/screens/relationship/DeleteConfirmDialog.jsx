import { R, fontFamily } from './theme'
import { SERVICES } from '../../data/services'
import { parseDate, fmtDate } from '../../lib/dateUtils'
import { getRuleImpact } from '../../lib/scheduleHelpers'
import Button from '../../components/Button'
import BottomSheet from '../../components/BottomSheet'

export default function DeleteConfirmDialog({unit, units, onDelete, onDeleteKeepPaid, onRefundAndDelete, onClose}) {
  const svc    = SERVICES.find(s => s.id === unit.serviceId)
  const isOnce = unit.frequency === "once"
  const { paidOccs, unpaidUpcoming } = getRuleImpact(unit, units)
  const hasPaid = paidOccs.length > 0

  const header = (
    <h3 style={{margin:0,fontSize:18,fontWeight:600,color:R.navy,fontFamily}}>Cancel service</h3>
  )
  return (
    <BottomSheet variant="full" onDismiss={onClose} zIndex={500} header={header}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <p style={{margin:0,fontSize:14,color:R.gray,fontFamily,lineHeight:1.5}}>
          {isOnce
            ? <>This will remove <strong style={{color:R.navy}}>{svc && svc.label}</strong> on {unit.startDate ? fmtDate(parseDate(unit.startDate)) : "(no date)"}. {hasPaid && "A refund will be issued per Rover's cancellation policy."}</>
            : <>This will remove the <strong style={{color:R.navy}}>{svc && svc.label}</strong> rule and cancel all upcoming sessions. {hasPaid && "Paid sessions will be refunded per Rover's cancellation policy."}</>
          }
        </p>
        {!isOnce && (hasPaid || unpaidUpcoming.length > 0) && (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {hasPaid && (
              <div style={{background:R.greenLight,border:`1.5px solid ${R.green}44`,borderRadius:8,padding:"10px 14px"}}>
                <div style={{fontSize:13,color:R.navy,lineHeight:1.5,fontFamily}}><strong>{paidOccs.length} paid session{paidOccs.length !== 1 ? "s" : ""}</strong> — will be refunded</div>
              </div>
            )}
            {unpaidUpcoming.length > 0 && (
              <div style={{background:R.redLight,border:`1.5px solid ${R.red}44`,borderRadius:8,padding:"10px 14px"}}>
                <div style={{fontSize:13,color:R.navy,lineHeight:1.5,fontFamily}}><strong>{unpaidUpcoming.length} upcoming session{unpaidUpcoming.length !== 1 ? "s" : ""}</strong> — will be cancelled</div>
              </div>
            )}
          </div>
        )}
        <Button variant="destructive" size="small" fullWidth onClick={() => {hasPaid ? onRefundAndDelete(unit.id) : onDelete(unit.id); onClose()}}>
          {hasPaid ? "Cancel and refund" : "Cancel service"}
        </Button>
        {!isOnce && hasPaid && (
          <Button variant="default" size="small" fullWidth onClick={() => {onDeleteKeepPaid(unit.id); onClose()}}>Cancel upcoming, keep paid</Button>
        )}
        <Button variant="default" size="small" fullWidth onClick={onClose}>Go back</Button>
      </div>
    </BottomSheet>
  )
}
