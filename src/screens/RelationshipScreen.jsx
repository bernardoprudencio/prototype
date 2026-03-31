import { useState, useRef, useEffect, useMemo } from 'react'
import { PROTO_TODAY } from '../data/owners'
import { colors, typography } from '../tokens'
import Button from '../components/Button'
import Row from '../components/Row'
import PetAvatar from '../components/PetAvatar'
import { CancelIcon, ChevronRightIcon, DropdownIcon, MoreIcon } from '../assets/icons'
import ReviewSheet from '../components/ReviewSheet'
import boardingIcon   from '../assets/boarding.svg'
import sittingIcon    from '../assets/sitting.svg'
import daycareIcon    from '../assets/daycare.svg'
import dropInIcon     from '../assets/drop-in.svg'
import walkingIcon    from '../assets/walking.svg'

// ─── Local token aliases (values sourced from central tokens where possible) ──
const R = {
  brand:       colors.brand,              brandLight:  colors.brandLight,
  navy:        colors.primary,            navyMid:     colors.secondary,
  gray:        colors.tertiary,           grayMid:     "#767C82",
  grayLight:   colors.disabledText,       border:      colors.borderInteractive,
  separator:   colors.border,             bg:          colors.bgSecondary,
  bgTertiary:  colors.bgTertiary,         white:       colors.white,
  blue:        colors.link,               blueLight:   colors.blueLight,
  green:       colors.brand,              greenLight:  colors.brandLight,
  red:         colors.destructive,        redLight:    "#FDECEA",
  amber:       "#D4860A",                 amberLight:  "#FEF7E6",
  amberBorder: "#F0D48A",                 purple:      "#2741CC",
  purpleLight: "#EBEEFB",                 cardBorder:  colors.border,
  disabled:    colors.bgTertiary,         disabledText:colors.disabledText,
}

const fontFamily = typography.fontFamily

// ─── Constants ───────────────────────────────────────────────────────────────
const SERVICES = [
  { id:"boarding",      label:"Boarding",       icon:"🏠", desc:"Overnight at sitter's home", type:"overnight" },
  { id:"house_sitting", label:"House Sitting",  icon:"🛋️", desc:"Sitter stays at your home",  type:"overnight" },
  { id:"doggy_daycare", label:"Doggy Day Care", icon:"☀️", desc:"Daytime at sitter's home",   type:"daytime", hourBased:true },
  { id:"drop_in",       label:"Drop-In Visit",  icon:"🚪", desc:"30-min visit at your home",  type:"daytime" },
  { id:"dog_walking",   label:"Dog Walking",    icon:"🦮", desc:"30 or 60-min walk",          type:"daytime" },
]
const DURATION_SHORT   = [{label:"30 min",mins:30},{label:"45 min",mins:45},{label:"1 hr",mins:60},{label:"2 hr",mins:120}]
const DURATION_DAYCARE = [{label:"4 hrs",mins:240},{label:"8 hrs",mins:480},{label:"12 hrs",mins:720}]
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const PETS_SEED = [{id:1,name:"Louie",breed:"German Shepherd",emoji:"🐕"},{id:2,name:"Mochi",breed:"Scottish Fold",emoji:"🐈"}]
const PET_EMOJIS = ["🐕","🐈","🐇","🐦","🐠","🦎","🐹","🐾"]
const FREQ = [{id:"once",label:"One-time"},{id:"weekly",label:"Weekly"},{id:"monthly",label:"Monthly"}]

// ─── Service icons ────────────────────────────────────────────────────────────
const SvcIcon = ({ src }) => <img src={src} alt="" style={{ width: 24, height: 24 }} />

const SERVICE_ICONS = {
  boarding:      <SvcIcon src={boardingIcon} />,
  house_sitting: <SvcIcon src={sittingIcon} />,
  doggy_daycare: <SvcIcon src={daycareIcon} />,
  drop_in:       <SvcIcon src={dropInIcon} />,
  dog_walking:   <SvcIcon src={walkingIcon} />,
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const MONTHS_S = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const DAYS_S   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

function parseDate(s)  { return s?new Date(s+"T00:00:00"):null }
function dateKey(d)    { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` }
function fmtDate(d)    { if(!d)return""; return`${MONTHS_S[d.getMonth()]} ${d.getDate()}` }
function fmtDateFull(d){ if(!d)return""; return`${MONTHS_S[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` }
function fmtDateLong(d){ if(!d)return""; return`${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}` }
function fmtMonthYear(d){ if(!d)return""; return`${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
function fmtTime(t)    { if(!t)return""; const[h,m]=t.split(":").map(Number); return`${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}` }
function addDays(d,n)  { const r=new Date(d); r.setDate(r.getDate()+n); return r }
function addWeeks(d,n) { return addDays(d,n*7) }
function addMonths(d,n){ const r=new Date(d); r.setMonth(r.getMonth()+n); return r }
function nightCount(u) { if(!u.startDate||!u.endDate)return 1; return Math.max(1,Math.round((parseDate(u.endDate)-parseDate(u.startDate))/86400000)) }
function endTimeFromDuration(t,mins){ if(!t||!mins)return""; const[h,m]=t.split(":").map(Number),tot=h*60+m+mins; return`${String(Math.floor(tot/60)%24).padStart(2,"0")}:${String(tot%60).padStart(2,"0")}` }
function isToday(d)    { const t=new Date(); return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate() }
function isYesterday(d){ const y=addDays(new Date(new Date().setHours(0,0,0,0)),-1); return d.getFullYear()===y.getFullYear()&&d.getMonth()===y.getMonth()&&d.getDate()===y.getDate() }
function fmtRelDate(d) { if(isToday(d))return"Today"; if(isYesterday(d))return"Yesterday"; return fmtDate(d) }
function isPast(d)     { return d<new Date(new Date().setHours(0,0,0,0)) }
function ruleLabel(unit){
  if(unit.frequency==="once") return"Doesn't repeat"
  const DAY_NAMES_FULL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
  const dayStr=(unit.weekDays||[]).length>0?" on "+(unit.weekDays.slice().sort((a,b)=>a-b).map(d=>DAY_NAMES_FULL[d]).join(" and ")):""
  if(unit.frequency==="weekly") return unit.everyNWeeks>1?`Every ${unit.everyNWeeks} weeks${dayStr}`:`Weekly${dayStr}`
  if(unit.frequency==="monthly") return`Monthly${dayStr}`
  return""
}
function durLabel(svc,mins){ const opts=(svc&&svc.id==="doggy_daycare")?DURATION_DAYCARE:DURATION_SHORT; const f=opts.find(d=>d.mins===mins); return f?f.label:(mins+"min") }
function shortRuleLabel(unit){
  if(unit.frequency==="once") return"Doesn't repeat"
  const SHORT=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  const days=(unit.weekDays||[]).slice().sort((a,b)=>a-b).map(d=>SHORT[d])
  const dayStr=days.length===0?"":days.length===1?days[0]:days.slice(0,-1).join(", ")+" and "+days[days.length-1]
  if(unit.frequency==="weekly") return unit.everyNWeeks>1?`Every ${unit.everyNWeeks} weeks${dayStr?" on "+dayStr:""}`:dayStr
  if(unit.frequency==="monthly") return`Monthly${dayStr?" on "+dayStr:""}`
  return""
}

// ─── Billing helpers ──────────────────────────────────────────────────────────
function getWeekMonday(d){ const r=new Date(d); r.setHours(0,0,0,0); const day=r.getDay(); const diff=day===0?-6:1-day; r.setDate(r.getDate()+diff); return r }
function getWeekSunday(d){ return addDays(getWeekMonday(d),6) }
function getPaidThruSunday(units){ const starts=units.map(u=>u.startDate?parseDate(u.startDate):null).filter(Boolean); if(!starts.length)return null; return getWeekSunday(starts.reduce((a,b)=>a<b?a:b)) }
function isPaidOcc(occStart, paidThruSunday){ return paidThruSunday && occStart<=paidThruSunday }

// ─── Unit factory ─────────────────────────────────────────────────────────────
let _nextId=100
function newId(){ return ++_nextId }
function defaultUnit(serviceId, overrides={}){
  const svc=SERVICES.find(s=>s.id===serviceId)
  return { id:newId(), serviceId, startDate:"", endDate:"", repeatEndDate:"", startTime:"09:00", durationMins:(svc&&svc.id)==="doggy_daycare"?480:60, petIds:[], frequency:"once", weekDays:[], everyNWeeks:1, skippedKeys:[], overrides:{}, cost:20, ...overrides }
}
function cloneUnit(u, newServiceId){
  const targetId=newServiceId||u.serviceId
  const svc=SERVICES.find(s=>s.id===targetId)
  const newDuration=(svc&&svc.id)==="doggy_daycare"?480:(svc&&svc.type)==="overnight"?u.durationMins:(u.durationMins<=240?u.durationMins:60)
  const freq=((svc&&svc.type)==="overnight"&&nightCount({...u,serviceId:targetId})>=7)?"once":u.frequency
  return { ...u, id:newId(), serviceId:targetId, startDate:"", endDate:"", repeatEndDate:"", skippedKeys:[], overrides:{}, durationMins:newDuration, frequency:freq }
}

// ─── Overlap detection ────────────────────────────────────────────────────────
function overlaps(units,u){
  const svc=SERVICES.find(s=>s.id===u.serviceId)
  if(!svc||!u.startDate) return false
  const uOccs=expandUnit(u)
  return units.filter(x=>{ if(x.id===u.id) return false; const xSvc=SERVICES.find(s=>s.id===x.serviceId); return xSvc?.type===svc.type }).some(x=>{
    if(!x.startDate) return false
    const xOccs=expandUnit(x)
    return uOccs.some(uo=>xOccs.some(xo=>dateKey(uo.start)===dateKey(xo.start)&&uo.unit.startTime===xo.unit.startTime))
  })
}
function overnightCanRepeat(u){ const svc=SERVICES.find(s=>s.id===u.serviceId); if((svc&&svc.type)!=="overnight") return true; return nightCount(u)<7 }

// ─── Expand unit → occurrences ────────────────────────────────────────────────
function expandUnit(unit){
  const svc=SERVICES.find(s=>s.id===unit.serviceId)
  if(!svc||!unit.startDate) return []
  const base=parseDate(unit.startDate)
  const today=new Date(); today.setHours(0,0,0,0)
  let horizon=addMonths(base,6)
  const hB=addWeeks(today,8); if(hB>horizon) horizon=hB
  if(unit.repeatEndDate){ const cap=parseDate(unit.repeatEndDate); if(cap<horizon) horizon=cap }
  const MAX=120
  const makeOcc=(start,dk)=>{
    const overrideData=(unit.overrides&&unit.overrides[dk])||null
    return { unit:overrideData?{...unit,...overrideData,id:unit.id}:unit, svc:overrideData&&overrideData.serviceId?SERVICES.find(s=>s.id===overrideData.serviceId)||svc:svc, start:new Date(start), end:svc.type==="overnight"&&unit.endDate?addDays(start,nightCount(unit)):null, key:`${unit.id}-${dk}`, skipped:(unit.skippedKeys&&unit.skippedKeys.indexOf(dk)>=0), isOverride:!!overrideData, parentUnit:unit }
  }
  const occs=[]
  if(unit.frequency==="once"){ occs.push(makeOcc(base,dateKey(base))) }
  else if(unit.frequency==="weekly"){
    const overnight=svc.type==="overnight"; const step=Math.max(1,unit.everyNWeeks||1)
    if(overnight){ let cur=new Date(base); while(cur<=horizon&&occs.length<MAX){ occs.push(makeOcc(cur,dateKey(cur))); cur=addWeeks(cur,step) } }
    else{
      const days=(unit.weekDays&&unit.weekDays.length)>0?unit.weekDays:[base.getDay()]
      days.forEach(dow=>{ const diff=((dow-base.getDay())+7)%7; let cur=addDays(base,diff); while(cur<=horizon&&occs.length<MAX){ occs.push(makeOcc(cur,dateKey(cur))); cur=addWeeks(cur,step) } })
    }
    occs.sort((a,b)=>a.start-b.start)
  } else if(unit.frequency==="monthly"){ let cur=new Date(base); while(cur<=horizon&&occs.length<MAX){ occs.push(makeOcc(cur,dateKey(cur))); cur=addMonths(cur,1) } }
  return occs
}

// ─── Build agenda ─────────────────────────────────────────────────────────────
function buildAgenda(units,relEndDate){
  let all=units.flatMap(u=>expandUnit(u)).filter(o=>!o.skipped)
  if(relEndDate){ const cap=parseDate(relEndDate); all=all.filter(o=>o.start<=cap) }
  all.sort((a,b)=>a.start-b.start)
  const byDay={}
  all.forEach(occ=>{
    if(occ.svc.type==="overnight"&&occ.end){
      const nights=nightCount(occ.unit)
      for(let i=0;i<nights;i++){
        const day=addDays(occ.start,i)
        const k=dateKey(day)
        if(!byDay[k]) byDay[k]=[]
        byDay[k].push({...occ,nightIndex:i+1,totalNights:nights})
      }
    } else {
      const k=dateKey(occ.start); if(!byDay[k]) byDay[k]=[]; byDay[k].push(occ)
    }
  })
  return Object.entries(byDay).sort(([a],[b])=>a.localeCompare(b))
}

// ─── Style atoms ─────────────────────────────────────────────────────────────
const labelSt  ={display:"block",fontSize:14,fontWeight:600,color:R.navyMid,marginBottom:4,fontFamily,lineHeight:1.25}
const inputSt  ={width:"100%",padding:"10px 12px",border:`1.5px solid ${R.border}`,borderRadius:8,fontSize:14,fontFamily,color:R.navy,background:R.white,boxSizing:"border-box",lineHeight:1.25}
const btnPrimary={background:R.blue,color:"#fff",border:"none",borderRadius:99999,padding:"12px 24px",fontSize:16,fontWeight:600,cursor:"pointer",fontFamily,width:"100%",boxShadow:"0px 2px 12px rgba(27,31,35,0.24)",transition:"all 0.15s ease",lineHeight:1.5}
const btnGhost ={background:"#fff",color:R.navyMid,border:`2px solid ${R.border}`,borderRadius:99999,padding:"12px 24px",fontSize:16,fontWeight:600,cursor:"pointer",fontFamily,lineHeight:1.5}
const btnSmall={background:"#fff",color:R.navyMid,border:`2px solid ${R.border}`,borderRadius:99999,padding:"8px 16px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily,lineHeight:1.25}
const btnSmallDestructive={background:"#fff",color:R.red,border:`2px solid ${R.red}`,borderRadius:99999,padding:"8px 16px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily,lineHeight:1.25}
const btnDestructive={background:R.red,color:"#fff",border:"none",borderRadius:99999,padding:"12px 24px",fontSize:16,fontWeight:600,cursor:"pointer",fontFamily,boxShadow:"0px 2px 12px rgba(27,31,35,0.24)",lineHeight:1.5}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({label,active,onClick,small,danger}){
  const base={padding:small?"4px 10px":"10px 16px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily,lineHeight:1.25,transition:"all 0.12s",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}
  if(danger) return <button onClick={onClick} style={{...base,border:`2px solid ${R.red}`,background:R.redLight,color:R.red}}>{label}</button>
  if(active) return (
    <button onClick={onClick} style={{...base,border:`2px solid #2E67D1`,background:"#ECF1FB",color:R.navy}}>
      <svg width="16" height="16" viewBox="0 0 32 32" fill="#2E67D1"><path d="M26.191 4.412a1 1 0 1 1 1.618 1.176l-16 22a1 1 0 0 1-1.516.12l-6-6a1 1 0 1 1 1.414-1.415l5.173 5.172L26.19 4.412z"/></svg>
      {label}
    </button>
  )
  return <button onClick={onClick} style={{...base,border:`2px solid ${R.border}`,background:"#fff",color:R.gray}}>{label}</button>
}

// ─── CalInput ─────────────────────────────────────────────────────────────────
function CalInput({value, onChange, minDate, placeholder}){
  const sel=value?parseDate(value):null
  const today=new Date(); today.setHours(0,0,0,0)
  const minD=minDate?parseDate(minDate):today
  const [open,setOpen]=useState(false)
  const [alignRight,setAlignRight]=useState(false)
  const [viewYear,setViewYear]=useState(sel?sel.getFullYear():today.getFullYear())
  const [viewMonth,setViewMonth]=useState(sel?sel.getMonth():today.getMonth())
  const ref=useRef(null)
  useEffect(()=>{ if(!open)return; const h=e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false) }; document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h) },[open])
  const handleToggle=()=>{ if(!open&&ref.current){ const rect=ref.current.getBoundingClientRect(); setAlignRight(rect.left+276>window.innerWidth) } setOpen(o=>!o) }
  const firstDay=new Date(viewYear,viewMonth,1); const cells=[]
  for(let i=0;i<firstDay.getDay();i++) cells.push(null)
  for(let d=1;d<=new Date(viewYear,viewMonth+1,0).getDate();d++) cells.push(d)
  const prevM=()=>viewMonth===0?(setViewMonth(11),setViewYear(viewYear-1)):setViewMonth(viewMonth-1)
  const nextM=()=>viewMonth===11?(setViewMonth(0),setViewYear(viewYear+1)):setViewMonth(viewMonth+1)
  const pick=day=>{ if(!day)return; const d=new Date(viewYear,viewMonth,day); if(minD&&d<minD)return; onChange(dateKey(d)); setOpen(false) }
  const label=sel?fmtDateLong(sel):(placeholder||"Select date…")
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={handleToggle} style={{width:"100%",padding:"12px 8px 12px 12px",border:`2px solid ${open?R.blue:"#C9CFD4"}`,borderRadius:4,fontSize:16,fontFamily,color:sel?R.navy:R.grayLight,background:"#fff",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",minHeight:48,boxSizing:"border-box"}}>
        <span style={{flex:1,fontWeight:400,lineHeight:1.5}}>{label}</span>
        <DropdownIcon/>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:alignRight?"auto":0,right:alignRight?0:"auto",zIndex:900,background:"#fff",borderRadius:8,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",border:`1.5px solid ${R.border}`,width:276,padding:"14px 12px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <button onClick={prevM} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:R.gray,padding:"2px 6px",borderRadius:6}}>‹</button>
            <span style={{fontWeight:600,fontSize:13,color:R.navy}}>{`${MONTHS[viewMonth]} ${viewYear}`}</span>
            <button onClick={nextM} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:R.gray,padding:"2px 6px",borderRadius:6}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
            {WEEKDAYS.map(w=><div key={w} style={{textAlign:"center",fontSize:10,fontWeight:600,color:R.gray,padding:"2px 0"}}>{w}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {cells.map((day,i)=>{
              if(!day) return <div key={"e"+i}/>
              const d=new Date(viewYear,viewMonth,day)
              const isSel=sel&&dateKey(d)===dateKey(sel)
              const dis=d<minD
              const tod=isToday(d)
              return(
                <button key={day} disabled={dis} onClick={()=>pick(day)}
                  style={{padding:"6px 0",borderRadius:8,border:"none",cursor:dis?"not-allowed":"pointer",fontSize:12,fontWeight:isSel?700:tod?600:400,background:isSel?R.blue:tod&&!isSel?R.blueLight:"transparent",color:dis?R.grayLight:isSel?"#fff":tod?R.blue:R.navy,opacity:dis?0.4:1,fontFamily}}>
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TimeInput ────────────────────────────────────────────────────────────────
function TimeInput({value, onChange, placeholder}){
  const [open,setOpen]=useState(false)
  const ref=useRef(null)
  useEffect(()=>{ if(!open)return; const h=e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false) }; document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h) },[open])
  const HOURS=[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
  const MINS=[0,15,30,45]
  const selH=value?parseInt(value.split(":")[0],10):null
  const selM=value?parseInt(value.split(":")[1],10):null
  const pick=(h,m)=>{ onChange(String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")); setOpen(false) }
  const fH=h=>`${h%12||12} ${h>=12?"PM":"AM"}`
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",padding:"12px 8px 12px 12px",border:`2px solid ${open?R.blue:"#C9CFD4"}`,borderRadius:4,fontSize:16,fontFamily,color:value?R.navy:R.grayLight,background:"#fff",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",minHeight:48,boxSizing:"border-box"}}>
        <span style={{flex:1,fontWeight:400,lineHeight:1.5}}>{value?fmtTime(value):(placeholder||"Select time…")}</span>
        <DropdownIcon/>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:900,background:"#fff",borderRadius:8,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",border:`1.5px solid ${R.border}`,width:240,padding:"12px"}}>
          <div style={{fontSize:10,fontWeight:600,color:R.gray,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Select time</div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,maxHeight:196,overflowY:"auto"}}>
              <div style={{fontSize:10,color:R.grayLight,marginBottom:4,textAlign:"center",fontWeight:600}}>Hour</div>
              {HOURS.map(h=>(
                <button key={h} onClick={()=>pick(h,selM!==null?selM:0)}
                  style={{width:"100%",padding:"6px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:selH===h?700:400,background:selH===h?R.blue:"transparent",color:selH===h?"#fff":R.navy,fontFamily,textAlign:"center",marginBottom:1}}>
                  {fH(h)}
                </button>
              ))}
            </div>
            <div style={{width:58}}>
              <div style={{fontSize:10,color:R.grayLight,marginBottom:4,textAlign:"center",fontWeight:600}}>Min</div>
              {MINS.map(m=>(
                <button key={m} onClick={()=>pick(selH!==null?selH:9,m)}
                  style={{width:"100%",padding:"6px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,fontWeight:selM===m?700:400,background:selM===m?R.blue:"transparent",color:selM===m?"#fff":R.navy,fontFamily,textAlign:"center",marginBottom:1}}>
                  {String(m).padStart(2,"0")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Pet selector ─────────────────────────────────────────────────────────────
function PetSelector({pets, selectedIds, onChange}){
  const toggle=id=>{ const ids=selectedIds.includes(id)?selectedIds.filter(i=>i!==id):[...selectedIds,id]; if(ids.length) onChange(ids) }
  return(
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {pets.map(p=>{
        const on=selectedIds.includes(p.id)
        return(
          <button key={p.id} onClick={()=>toggle(p.id)} style={{padding:"10px 16px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",border:on?`2px solid #2E67D1`:`2px solid ${R.border}`,background:on?"#ECF1FB":"#fff",color:on?R.navy:R.gray,fontFamily,lineHeight:1.25,transition:"all 0.12s",display:"inline-flex",alignItems:"center",gap:6}}>
            {on&&<svg width="16" height="16" viewBox="0 0 32 32" fill="#2E67D1"><path d="M26.191 4.412a1 1 0 1 1 1.618 1.176l-16 22a1 1 0 0 1-1.516.12l-6-6a1 1 0 1 1 1.414-1.415l5.173 5.172L26.19 4.412z"/></svg>}
            {p.name}
          </button>
        )
      })}
    </div>
  )
}

// ─── Pet panel ────────────────────────────────────────────────────────────────
function PetPanel({pets, setPets, selectedIds, setSelectedIds, unitList, setUnitList, compact}){
  const [adding,setAdding]=useState(false)
  const [newName,setNewName]=useState("")
  const [newBreed,setNewBreed]=useState("")
  const [newEmoji,setNewEmoji]=useState("🐕")
  const addPet=()=>{
    if(!newName.trim()) return
    const p={id:Date.now(),name:newName.trim(),breed:newBreed.trim()||"",emoji:newEmoji}
    setPets(prev=>[...prev,p]); setSelectedIds(prev=>[...prev,p.id])
    if(setUnitList) setUnitList(prev=>prev.map(u=>({...u,petIds:[...new Set([...u.petIds,p.id])]})))
    setAdding(false); setNewName(""); setNewBreed(""); setNewEmoji("🐕")
  }
  const togglePet=id=>{
    const on=selectedIds.includes(id); if(on&&selectedIds.length<=1) return
    const next=on?selectedIds.filter(i=>i!==id):[...selectedIds,id]; setSelectedIds(next)
    if(on&&setUnitList){ setUnitList(prev=>prev.map(u=>{ if(u.petOverride) return u; const newPets=u.petIds.filter(i=>i!==id); return {...u,petIds:newPets.length?newPets:u.petIds} })) }
  }
  return(
    <div>
      {!compact&&<label style={labelSt}>Pets in this relationship</label>}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:adding?12:0}}>
        {pets.map(p=>{
          const on=selectedIds.includes(p.id)
          return(
            <button key={p.id} onClick={()=>togglePet(p.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 12px",borderRadius:10,border:`1.5px solid ${on?R.blue:R.border}`,background:on?R.blueLight:"#fff",cursor:"pointer",fontFamily,transition:"all 0.12s"}}>
              <span style={{fontSize:20}}>{p.emoji}</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:12,fontWeight:600,color:on?R.blue:R.navy,lineHeight:1.2}}>{p.name}</div>
                {p.breed&&<div style={{fontSize:10,color:R.gray,lineHeight:1}}>{p.breed}</div>}
              </div>
              {on&&<span style={{fontSize:11,color:R.blue}}>✓</span>}
            </button>
          )
        })}
        <button onClick={()=>setAdding(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,border:`1.5px dashed ${R.border}`,background:"#fff",cursor:"pointer",fontFamily,color:R.gray,fontSize:12,fontWeight:600}}>
          + Add pet
        </button>
      </div>
      {adding&&(
        <div style={{background:R.bg,borderRadius:10,padding:"12px",border:`1px solid ${R.border}`,marginTop:4}}>
          <div style={{fontSize:12,fontWeight:600,color:R.navy,marginBottom:10}}>New pet</div>
          <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
            {PET_EMOJIS.map(e=><button key={e} onClick={()=>setNewEmoji(e)} style={{fontSize:20,padding:"4px",borderRadius:6,border:`1.5px solid ${newEmoji===e?R.blue:R.border}`,background:newEmoji===e?R.blueLight:"#fff",cursor:"pointer"}}>{e}</button>)}
          </div>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name (required)" style={{...inputSt,marginBottom:7,fontSize:13,padding:"8px 10px"}}/>
          <input value={newBreed} onChange={e=>setNewBreed(e.target.value)} placeholder="Breed (optional)" style={{...inputSt,marginBottom:10,fontSize:13,padding:"8px 10px"}}/>
          <div style={{display:"flex",gap:7}}>
            <button onClick={addPet} style={{...btnPrimary,padding:"8px",fontSize:13,borderRadius:8,flex:2}}>Add {newEmoji} {newName||"pet"}</button>
            <button onClick={()=>setAdding(false)} style={{...btnGhost,padding:"8px",fontSize:13,borderRadius:8,flex:1}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Unit editor ─────────────────────────────────────────────────────────────
function UnitEditor({unit, onChange, onRemove, onDuplicate, allUnits, allPets, showRemove=true, showChangeType=false, onChangeType, simplified=false, timeOnly=false}){
  const svc=SERVICES.find(s=>s.id===unit.serviceId)
  const overnight=(svc&&svc.type)==="overnight"
  const isDaycare=(svc&&svc.id)==="doggy_daycare"
  const conflict=overlaps(allUnits,unit)
  const repeats=unit.frequency!=="once"
  const isWeekly=unit.frequency==="weekly"
  const canRepeat=overnightCanRepeat(unit)
  const durationOpts=isDaycare?DURATION_DAYCARE:DURATION_SHORT
  const pets=allPets||PETS_SEED
  const togglePet=id=>{ const ids=unit.petIds.includes(id)?unit.petIds.filter(i=>i!==id):[...unit.petIds,id]; if(ids.length) onChange({...unit,petIds:ids,petOverride:true}) }
  const toggleWeekDay=d=>{ const days=unit.weekDays||[]; onChange({...unit,weekDays:days.includes(d)?days.filter(x=>x!==d):[...days,d]}) }
  if(timeOnly) return(
    <div style={{marginBottom:12}}>
      <div style={{marginBottom:20}}>
        <label style={labelSt}>Start time</label>
        <TimeInput value={unit.startTime} onChange={v=>onChange({...unit,startTime:v})} placeholder="Select time…"/>
        {unit.startTime&&unit.durationMins&&<div style={{fontSize:14,color:R.gray,marginTop:4,lineHeight:1.5}}>Ends at {fmtTime(endTimeFromDuration(unit.startTime,unit.durationMins))}</div>}
      </div>
    </div>
  )

  return(
    <div style={{marginBottom:12}}>
      {conflict&&<div style={{fontSize:12,background:R.redLight,color:R.red,fontWeight:600,padding:"8px 12px",borderRadius:8,marginBottom:10}}>⚠ Conflict with another service</div>}
      {overnight?(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div><label style={labelSt}>Check-in</label><CalInput value={unit.startDate} onChange={v=>onChange({...unit,startDate:v})} placeholder="Check-in date"/></div>
          <div><label style={labelSt}>Check-out</label><CalInput value={unit.endDate} onChange={v=>onChange({...unit,endDate:v})} minDate={unit.startDate} placeholder="Check-out date"/></div>
        </div>
      ):(
        <div style={{marginBottom:20}}>
          <div style={{marginBottom:20}}><label style={labelSt}>Date</label><CalInput value={unit.startDate} onChange={v=>{ const updated={...unit,startDate:v}; if(isWeekly) updated.weekDays=[parseDate(v).getDay()]; onChange(updated) }} placeholder="Select date"/></div>
          <div><label style={labelSt}>Start time</label><TimeInput value={unit.startTime} onChange={v=>onChange({...unit,startTime:v})} placeholder="Select time"/>
            {unit.startTime&&unit.durationMins&&<div style={{fontSize:14,color:R.gray,marginTop:4,lineHeight:1.5}}>Ends at {fmtTime(endTimeFromDuration(unit.startTime,unit.durationMins))}</div>}
          </div>
        </div>
      )}
      {!overnight&&!simplified&&(
        <div style={{marginBottom:12}}>
          <label style={labelSt}>{isDaycare?"Hours":"Duration"}</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {durationOpts.map(d=><Chip key={d.mins} label={d.label} active={unit.durationMins===d.mins} onClick={()=>onChange({...unit,durationMins:d.mins})}/>)}
          </div>
        </div>
      )}
      {!simplified&&<div style={{marginBottom:isWeekly&&!overnight?0:12}}>
        <label style={labelSt}>Frequency</label>
        {overnight?(
          canRepeat?(
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {FREQ.map(f=><Chip key={f.id} label={f.label} active={unit.frequency===f.id} onClick={()=>onChange({...unit,frequency:f.id,repeatEndDate:f.id==="once"?"":unit.repeatEndDate,weekDays:[],everyNWeeks:unit.everyNWeeks||1})}/>)}
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Chip label="One-time" active={true} onClick={()=>{}}/>
              <span style={{fontSize:11,color:R.gray}}>Stays over 7 nights can't repeat</span>
            </div>
          )
        ):(
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {FREQ.map(f=><Chip key={f.id} label={f.label} active={unit.frequency===f.id} onClick={()=>{ const wd=f.id==="weekly"?((unit.weekDays&&unit.weekDays.length)>0?unit.weekDays:[unit.startDate?parseDate(unit.startDate).getDay():new Date().getDay()]):[]; onChange({...unit,frequency:f.id,repeatEndDate:f.id==="once"?"":unit.repeatEndDate,weekDays:wd,everyNWeeks:unit.everyNWeeks||1}) }}/>)}
          </div>
        )}
      </div>}
      {isWeekly&&overnight&&(
        <div style={{background:R.bg,borderRadius:10,padding:"12px 14px",margin:"10px 0 12px",border:`1px solid ${R.border}`}}>
          <label style={{...labelSt,marginBottom:7}}>Every</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[1,2,3,4].map(n=><Chip key={n} small label={n===1?"week":`${n} weeks`} active={(unit.everyNWeeks||1)===n} onClick={()=>onChange({...unit,everyNWeeks:n})}/>)}
          </div>
        </div>
      )}
      {isWeekly&&!overnight&&simplified&&(
        <div style={{marginBottom:14}}>
          <label style={labelSt}>Repeats on</label>
          <div style={{display:"flex",gap:8}}>
            {["M","T","W","T","F","S","S"].map((d,i)=>{
              const jsDay=[1,2,3,4,5,6,0][i]
              const active=(unit.weekDays||[]).includes(jsDay)
              return(
                <button key={i} onClick={()=>toggleWeekDay(jsDay)} style={{flex:1,minHeight:40,border:`2px solid ${active?"#2E67D1":"#C9CFD4"}`,borderRadius:8,background:active?"#ECF1FB":"#fff",color:R.navy,fontSize:16,fontFamily,fontWeight:400,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:"8px 12px",boxSizing:"border-box"}}>
                  {d}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {isWeekly&&!overnight&&!simplified&&(
        <div style={{background:R.bg,borderRadius:10,padding:"12px 14px",margin:"10px 0 12px",border:`1px solid ${R.border}`}}>
          <div style={{marginBottom:10}}>
            <label style={{...labelSt,marginBottom:7}}>Repeat on</label>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {WEEKDAYS.map((d,i)=>{
                const active=(unit.weekDays||[]).includes(i)
                return <button key={i} onClick={()=>toggleWeekDay(i)} style={{width:38,height:38,borderRadius:"50%",border:active?"2px solid transparent":`2px solid ${R.border}`,background:active?R.blue:"#fff",color:active?"#fff":R.navyMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily,transition:"all 0.12s",boxShadow:active?"0px 2px 12px rgba(27,31,35,0.24)":"none"}}>{d}</button>
              })}
            </div>
            {(unit.weekDays||[]).length===0&&<div style={{fontSize:11,color:R.gray,marginTop:5}}>Defaults to same weekday as start date</div>}
            {unit.startDate&&(unit.weekDays||[]).length>0&&(()=>{ const b=parseDate(unit.startDate); const first=unit.weekDays.slice().sort((a,b2)=>a-b2).map(d=>addDays(b,((d-b.getDay())+7)%7)).sort((a,b2)=>a-b2)[0]; return <div style={{fontSize:11,color:R.blue,fontWeight:600,marginTop:5}}>📅 First: {fmtDateLong(first)}</div> })()}
          </div>
          <div>
            <label style={{...labelSt,marginBottom:7}}>Every</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[1,2,3,4].map(n=><Chip key={n} small label={n===1?"week":`${n} weeks`} active={(unit.everyNWeeks||1)===n} onClick={()=>onChange({...unit,everyNWeeks:n})}/>)}
            </div>
          </div>
        </div>
      )}
      {!simplified&&repeats&&(
        <div style={{marginBottom:12,background:R.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${R.border}`}}>
          <label style={{...labelSt,marginBottom:5}}>Series ends <span style={{fontWeight:400,color:R.gray}}>(optional)</span></label>
          <CalInput value={unit.repeatEndDate||""} onChange={v=>onChange({...unit,repeatEndDate:v})} minDate={unit.startDate} placeholder="No end date"/>
          <div style={{fontSize:11,color:R.gray,marginTop:5}}>{unit.repeatEndDate?`Stops after ${fmtDate(parseDate(unit.repeatEndDate))}`:"No end — continues until relationship ends"}</div>
        </div>
      )}
      {!simplified&&<div>
        <label style={labelSt}>For which pets?</label>
        <PetSelector pets={pets} selectedIds={unit.petIds} onChange={ids=>onChange({...unit,petIds:ids,petOverride:true})}/>
        {unit.petOverride&&<div style={{fontSize:10,color:R.gray,marginTop:5}}>Custom pet selection</div>}
      </div>}
    </div>
  )
}

// ─── Change-type picker ───────────────────────────────────────────────────────
function ChangeTypeSheet({unit, onConfirm, onClose}){
  const [targetId,setTargetId]=useState(unit.serviceId)
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(10,18,30,0.5)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:R.bg,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"100%",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.18)"}}>
        <div style={{background:"#fff",padding:"18px 20px 14px",borderRadius:"20px 20px 0 0",borderBottom:`1px solid ${R.border}`,position:"sticky",top:0}}>
          <div style={{width:36,height:4,borderRadius:99,background:R.border,margin:"0 auto 14px"}}/>
          <h3 style={{margin:0,fontSize:17,fontWeight:600,color:R.navy,fontFamily}}>Change service type</h3>
          <p style={{margin:"4px 0 0",fontSize:12,color:R.gray,fontFamily}}>All other settings will be copied over</p>
        </div>
        <div style={{padding:"16px 20px 32px"}}>
          {SERVICES.map(s=>(
            <button key={s.id} onClick={()=>setTargetId(s.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 16px",borderRadius:8,border:`1.5px solid ${targetId===s.id?R.blue:R.cardBorder}`,background:targetId===s.id?R.blueLight:"#fff",cursor:"pointer",fontFamily,textAlign:"left",width:"100%",marginBottom:8,transition:"all 0.1s"}}>
              <span style={{fontSize:22}}>{s.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,color:targetId===s.id?R.blue:R.navy}}>{s.label}</div>
                <div style={{fontSize:12,color:R.gray,marginTop:1}}>{s.desc}</div>
              </div>
              {targetId===s.id&&<span style={{color:R.blue,fontWeight:600}}>✓</span>}
            </button>
          ))}
          <button onClick={()=>onConfirm(targetId)} style={{...btnPrimary,marginTop:4}}>Copy as {SERVICES.find(s=>s.id===targetId)&&SERVICES.find(s=>s.id===targetId).label} →</button>
        </div>
      </div>
    </div>
  )
}

// ─── Add-service sheet ────────────────────────────────────────────────────────
function AddSheet({onAdd, onClose, existing, allPets, defaultServiceId}){
  const initialSvc=defaultServiceId?SERVICES.find(s=>s.id===defaultServiceId):null
  const pets=allPets||PETS_SEED
  const makeInitUnit=(svcObj)=>{
    const today=new Date()
    return {...defaultUnit(svcObj.id,{petIds:pets.map(p=>p.id)}),frequency:"weekly",weekDays:[today.getDay()],startDate:dateKey(today)}
  }
  const [addView,setAddView]=useState(initialSvc?"form":"pick")
  const [svc,setSvc]=useState(initialSvc)
  const [unit,setUnit]=useState(initialSvc?makeInitUnit(initialSvc):null)
  const [scopeChoice,setScopeChoice]=useState("this")

  const handleUnitChange=(updated)=>{
    // If weekDays changed to a single day that doesn't match the current startDate's day,
    // advance startDate to the next occurrence of that day (today if it matches, else next week)
    const prev=unit
    const prevDays=(prev?.weekDays||[]).slice().sort((a,b)=>a-b).join(",")
    const nextDays=(updated.weekDays||[]).slice().sort((a,b)=>a-b).join(",")
    if(prevDays!==nextDays&&(updated.weekDays||[]).length===1&&updated.startDate){
      const targetDow=updated.weekDays[0]
      const base=parseDate(updated.startDate)
      const diff=((targetDow-base.getDay())+7)%7
      if(diff!==0){
        updated={...updated,startDate:dateKey(addDays(base,diff))}
      }
    }
    setUnit(updated)
  }

  const draftDate=unit?.startDate?parseDate(unit.startDate):null
  const draftEndT=unit?.startTime&&unit?.durationMins?endTimeFromDuration(unit.startTime,unit.durationMins):null
  const dateTimeLabel=draftDate&&unit?.startTime
    ?`${fmtDate(draftDate)} · ${fmtTime(unit.startTime)} to ${fmtTime(draftEndT)}`
    :draftDate?fmtDate(draftDate):"Today — default"
  const isCurrWeek=draftDate?dateKey(getWeekMonday(draftDate))===dateKey(getWeekMonday(PROTO_TODAY)):false
  const isMultiDay=(unit?.weekDays||[]).length>1
  const cost=unit?.cost||20
  const svcName=svc?shortSvcName(svc):""
  const currWeekSunday=draftDate?getWeekSunday(getWeekMonday(PROTO_TODAY)):null
  const currWeekOccs=unit&&draftDate?expandUnit({...unit,frequency:"weekly"}).filter(o=>o.start>=draftDate&&currWeekSunday&&o.start<=currWeekSunday).length:0
  const currWeekTotal=currWeekOccs*cost

  const handleSave=()=>{
    if(!unit?.startDate) return
    if(isCurrWeek){ setAddView("chargeConfirm") }
    else if(isMultiDay){ onAdd({...unit,frequency:"weekly"}); onClose() }
    else { setScopeChoice("this"); setAddView("scopePicker") }
  }

  const simpleSheet=(content)=>(
    <div style={{position:"fixed",inset:0,background:"rgba(10,18,30,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"8px 8px 0 0",width:"100%",maxWidth:"100%",boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",padding:"0 16px 24px"}}>
        <div style={{display:"flex",justifyContent:"center",paddingTop:8,marginBottom:24}}>
          <div style={{width:36,height:5,borderRadius:35,background:R.border}}/>
        </div>
        {content}
      </div>
    </div>
  )

  const sheetHeader=(label,sublabel)=>(
    <Row label={label} sublabel={sublabel} rightItem={<PetAvatar size={48} images={pets.map(p=>p.img)}/>} firstRow/>
  )

  const radioRow=(label,value)=>(
    <div onClick={()=>setScopeChoice(value)} style={{display:"flex",alignItems:"center",gap:8,minHeight:56,paddingTop:8,paddingBottom:8,cursor:"pointer"}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontFamily,fontWeight:400,fontSize:16,color:R.navy,margin:0,lineHeight:1.5}}>{label}</p>
      </div>
      <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${scopeChoice===value?"#2E67D1":"#C9CFD4"}`,background:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {scopeChoice===value&&<div style={{width:10,height:10,borderRadius:"50%",background:"#2E67D1"}}/>}
      </div>
    </div>
  )

  // ── Pick service ──
  if(addView==="pick") return(
    <div style={{position:"fixed",inset:0,background:"rgba(10,18,30,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:R.white,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"100%",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.18)"}}>
        <div style={{background:R.white,padding:"18px 16px 8px",borderRadius:"20px 20px 0 0",position:"sticky",top:0,zIndex:1}}>
          <div style={{width:36,height:4,borderRadius:99,background:R.border,margin:"0 auto 24px"}}/>
          <h3 style={{margin:0,fontSize:18,fontWeight:600,color:R.navy,fontFamily}}>Add a service</h3>
        </div>
        <div style={{padding:"8px 16px 36px"}}>
          {SERVICES.map(s=>(
            <Row key={s.id} label={s.label} sublabel={s.desc} leftItem={SERVICE_ICONS[s.id]} rightItem={<ChevronRightIcon/>}
              onClick={()=>{setSvc(s);setUnit(makeInitUnit(s));setAddView("form")}}/>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Add form ──
  if(addView==="form") return simpleSheet(<>
    {sheetHeader(`Add ${svcName}`, draftDate?fmtDateLong(draftDate):"Today — default")}
    <div style={{marginBottom:8}}/>
    <UnitEditor unit={unit} onChange={handleUnitChange} onRemove={()=>{}} allUnits={existing} allPets={pets} showRemove={false} simplified/>
    {isCurrWeek&&<p style={{fontFamily,fontSize:14,color:R.gray,margin:"-8px 0 16px",lineHeight:1.5}}>${currWeekTotal}.00 will be charged</p>}
    <Button variant="primary" size="small" fullWidth disabled={!unit?.startDate} onClick={handleSave}>Save changes</Button>
    <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={onClose}>Close</Button></div>
  </>)

  // ── Scope picker (future week, single day) ──
  if(addView==="scopePicker") return simpleSheet(<>
    {sheetHeader(`Add ${svcName}`, dateTimeLabel)}
    {radioRow(`This ${svcName} only`,"this")}
    {radioRow(`This and following ${svcName}s`,"following")}
    <div style={{marginTop:8}}>
      <Button variant="primary" size="small" fullWidth onClick={()=>{
        scopeChoice==="this"?onAdd({...unit,frequency:"once",weekDays:[]}):onAdd({...unit,frequency:"weekly"})
        onClose()
      }}>Save changes</Button>
      <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={()=>setAddView("form")}>Close</Button></div>
    </div>
  </>)

  // ── Charge confirmation (current week) ──
  if(addView==="chargeConfirm") return simpleSheet(<>
    {sheetHeader("Add and charge", dateTimeLabel)}
    <p style={{fontFamily,fontSize:14,color:R.gray,lineHeight:1.6,margin:"8px 0 20px"}}>
      {`Are you sure you want to add the ${svcName} and charge $${currWeekTotal}.00 to their original payment method?`}
    </p>
    <Button variant="primary" size="small" fullWidth onClick={()=>{
      onAdd({...unit,frequency:isMultiDay?"weekly":"once",weekDays:isMultiDay?unit.weekDays:[]})
      onClose()
    }}>Confirm and charge</Button>
    <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={()=>setAddView("form")}>Close</Button></div>
  </>)

  return null
}

// ─── Occurrence action sheet ──────────────────────────────────────────────────
const SVC_SHORT={dog_walking:"walk",doggy_daycare:"daycare",overnight_boarding:"stay",overnight_traveling:"stay",drop_in:"drop-in",grooming:"grooming"}
function shortSvcName(svc){ return SVC_SHORT[svc.id]||svc.label.toLowerCase() }

function OccActionSheet({occ, allPets, onSaveUnit, onSkip, onOverride, onOverrideFromDate, onCancelDayFromDate, onCancel, onClose}){
  const [view,setView]=useState("editForm")
  const [draft,setDraft]=useState({...occ.unit,startDate:dateKey(occ.start)})
  const [scope,setScope]=useState("this")
  const isRecurring=(occ.parentUnit||occ.unit).frequency!=="once"
  const overnight=occ.svc.type==="overnight"
  const occWeekMonday=getWeekMonday(occ.start)
  const todayWeekMonday=getWeekMonday(PROTO_TODAY)
  const isCurrentWeek=dateKey(occWeekMonday)===dateKey(todayWeekMonday)
  const endT=!overnight?endTimeFromDuration(occ.unit.startTime,occ.unit.durationMins):null
  const occPets=allPets.filter(p=>occ.unit.petIds.includes(p.id))
  const dateLabel=overnight
    ?`${fmtDate(occ.start)} to ${fmtDate(occ.end)} · ${occ.totalNights||nightCount(occ.unit)} night${(occ.totalNights||nightCount(occ.unit))!==1?"s":""}`
    :`${fmtDateLong(occ.start)} · ${fmtTime(occ.unit.startTime)} to ${fmtTime(endT)}`
  const svcName=shortSvcName(occ.svc)

  const headerRow=(label)=>(
    <Row
      label={label}
      sublabel={dateLabel}
      rightItem={<PetAvatar size={48} images={occPets.map(p=>p.img)}/>}
      firstRow
    />
  )

  const simpleSheet=(content)=>(
    <div style={{position:"fixed",inset:0,background:"rgba(10,18,30,0.5)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"8px 8px 0 0",width:"100%",maxWidth:"100%",boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",padding:"0 16px 24px"}}>
        <div style={{display:"flex",justifyContent:"center",paddingTop:8,marginBottom:24}}>
          <div style={{width:36,height:5,borderRadius:35,background:R.border}}/>
        </div>
        {content}
      </div>
    </div>
  )

  const radioRow=(label,value)=>(
    <div onClick={()=>setScope(value)} style={{display:"flex",alignItems:"center",gap:8,minHeight:56,paddingTop:8,paddingBottom:8,cursor:"pointer"}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontFamily,fontWeight:400,fontSize:16,color:R.navy,margin:0,lineHeight:1.5}}>{label}</p>
      </div>
      <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${scope===value?"#2E67D1":"#C9CFD4"}`,background:scope===value?"#fff":"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {scope===value&&<div style={{width:10,height:10,borderRadius:"50%",background:"#2E67D1"}}/>}
      </div>
    </div>
  )

  const endRuleFromDate=()=>{
    const baseUnit=occ.parentUnit||occ.unit
    if(dateKey(occ.start)===baseUnit.startDate){ onCancel(baseUnit) }
    else { onSaveUnit({...baseUnit,repeatEndDate:dateKey(addDays(occ.start,-1))}) ; onClose() }
  }

  const applyRemoveFollowing=()=>{
    const parentUnit=occ.parentUnit||occ.unit
    if((parentUnit.weekDays||[]).length>1){ onCancelDayFromDate(occ) }
    else { endRuleFromDate() }
  }

  // ── Edit form ──
  if(view==="editForm"){
    const timeChanged=draft.startTime!==occ.unit.startTime
    const handleSave=()=>{
      if(!timeChanged){ onClose(); return }
      if(isRecurring){ setScope("this"); setView("editScope") }
      else { onSaveUnit(draft); onClose() }
    }
    const handleRemove=()=>{
      if(isRecurring){ setScope("this"); setView("removeScope") }
      else if(isCurrentWeek){ setScope("this"); setView("cancelRefund") }
      else { onCancel(occ.unit); onClose() }
    }
    return simpleSheet(<>
      {headerRow(`Edit ${svcName}`)}
      <div style={{marginBottom:8}}/>
      <UnitEditor unit={draft} onChange={setDraft} onRemove={()=>{}} allUnits={[]} allPets={allPets} showRemove={false} timeOnly/>
      <div onClick={handleRemove} style={{display:"flex",alignItems:"center",gap:10,minHeight:48,paddingTop:4,paddingBottom:12,cursor:"pointer"}}>
        <CancelIcon color={R.red}/>
        <p style={{fontFamily,fontWeight:400,fontSize:16,color:R.red,margin:0,lineHeight:1.5}}>Remove {svcName}</p>
      </div>
      <Button variant="primary" size="small" fullWidth onClick={handleSave}>Save changes</Button>
      <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={onClose}>Close</Button></div>
    </>)
  }

  // ── Edit scope picker ──
  if(view==="editScope") return simpleSheet(<>
    {headerRow(`Edit ${svcName}`)}
    {radioRow("This one","this")}
    {radioRow("All future ones","following")}
    <div style={{marginTop:8}}>
      <Button variant="primary" size="small" fullWidth onClick={()=>{scope==="this"?onOverride(occ,draft):onOverrideFromDate(occ,draft);onClose()}}>Save changes</Button>
      <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={()=>setView("editForm")}>Close</Button></div>
    </div>
  </>)

  // ── Remove scope picker ──
  if(view==="removeScope"){
    const followingLabel=`This and following ${svcName}s`
    const handleConfirm=()=>{
      if(scope==="this"){
        if(isCurrentWeek){ setView("cancelRefund") }
        else { onSkip(occ.key,true); onClose() }
      } else {
        if(isCurrentWeek){ setView("cancelRefund") }
        else { applyRemoveFollowing(); onClose() }
      }
    }
    return simpleSheet(<>
      {headerRow(`Remove ${svcName}`)}
      {radioRow(`This ${svcName} only`,"this")}
      {radioRow(followingLabel,"following")}
      <div style={{marginTop:8}}>
        <Button variant="primary" size="small" fullWidth onClick={handleConfirm}>Save changes</Button>
        <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={()=>setView("editForm")}>Close</Button></div>
      </div>
    </>)
  }

  // ── Cancel and refund confirmation ──
  if(view==="cancelRefund"){
    const handleConfirmRefund=()=>{
      if(scope==="this"){
        if(isRecurring){ onSkip(occ.key,true) }
        else { onCancel(occ.unit) }
      } else { applyRemoveFollowing() }
      onClose()
    }
    return simpleSheet(<>
      {headerRow("Cancel and refund")}
      <p style={{fontFamily,fontSize:14,color:R.gray,lineHeight:1.6,margin:"8px 0 20px"}}>
        {`Are you sure you want to cancel and refund the ${svcName} of ${fmtDate(occ.start)}? A refund of $${occ.unit.cost||0}.00 will automatically be processed.`}
      </p>
      <Button variant="destructive" size="small" fullWidth onClick={handleConfirmRefund}>Cancel and refund</Button>
      <div style={{marginTop:12}}><Button variant="default" size="small" fullWidth onClick={()=>setView("removeScope")}>Close</Button></div>
    </>)
  }

  return null
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────
function DeleteConfirmDialog({unit, units, onDelete, onDeleteKeepPaid, onRefundAndDelete, onClose}){
  const svc=SERVICES.find(s=>s.id===unit.serviceId)
  const isOnce=unit.frequency==="once"
  const paidThru=getPaidThruSunday(units)
  const occs=expandUnit(unit)
  const today=new Date(); today.setHours(0,0,0,0)
  const paidOccs=occs.filter(o=>!o.skipped&&isPaidOcc(o.start,paidThru))
  const unpaidUpcoming=occs.filter(o=>!o.skipped&&o.start>=today&&!isPaidOcc(o.start,paidThru))
  const hasPaid=paidOccs.length>0

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(10,18,30,0.5)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:R.white,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"100%",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.18)"}}>
        <div style={{background:R.white,padding:"18px 16px 8px",borderRadius:"20px 20px 0 0",position:"sticky",top:0,zIndex:1}}>
          <div style={{width:36,height:4,borderRadius:99,background:R.border,margin:"0 auto 24px"}}/>
          <h3 style={{margin:0,fontSize:18,fontWeight:600,color:R.navy,fontFamily}}>Cancel service</h3>
        </div>
        <div style={{padding:"8px 16px 36px",display:"flex",flexDirection:"column",gap:12}}>
          <p style={{margin:0,fontSize:14,color:R.gray,fontFamily,lineHeight:1.5}}>
            {isOnce
              ?<>This will remove <strong style={{color:R.navy}}>{svc&&svc.label}</strong> on {unit.startDate?fmtDate(parseDate(unit.startDate)):"(no date)"}. {hasPaid&&"A refund will be issued per Rover's cancellation policy."}</>
              :<>This will remove the <strong style={{color:R.navy}}>{svc&&svc.label}</strong> rule and cancel all upcoming sessions. {hasPaid&&"Paid sessions will be refunded per Rover's cancellation policy."}</>
            }
          </p>
          {!isOnce&&(hasPaid||unpaidUpcoming.length>0)&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {hasPaid&&(
                <div style={{background:R.greenLight,border:`1.5px solid ${R.green}44`,borderRadius:8,padding:"10px 14px"}}>
                  <div style={{fontSize:13,color:R.navy,lineHeight:1.5,fontFamily}}><strong>{paidOccs.length} paid session{paidOccs.length!==1?"s":""}</strong> — will be refunded</div>
                </div>
              )}
              {unpaidUpcoming.length>0&&(
                <div style={{background:R.redLight,border:`1.5px solid ${R.red}44`,borderRadius:8,padding:"10px 14px"}}>
                  <div style={{fontSize:13,color:R.navy,lineHeight:1.5,fontFamily}}><strong>{unpaidUpcoming.length} upcoming session{unpaidUpcoming.length!==1?"s":""}</strong> — will be cancelled</div>
                </div>
              )}
            </div>
          )}
          <Button variant="destructive" size="small" fullWidth onClick={()=>{hasPaid?onRefundAndDelete(unit.id):onDelete(unit.id);onClose()}}>
            {hasPaid?"Cancel and refund":"Cancel service"}
          </Button>
          {!isOnce&&hasPaid&&(
            <Button variant="default" size="small" fullWidth onClick={()=>{onDeleteKeepPaid(unit.id);onClose()}}>Cancel upcoming, keep paid</Button>
          )}
          <Button variant="default" size="small" fullWidth onClick={onClose}>Go back</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Manage sheet ─────────────────────────────────────────────────────────────
function ManageSheet({units, pets, relEndDate, onUnitsChange, onRelEndDateChange, onPetsChange, onUnitListChange, onClose}){
  const [showAdd,setShowAdd]=useState(false)
  const [editingUnit,setEditingUnit]=useState(null)
  const [changeTypeFor,setChangeTypeFor]=useState(null)
  const [confirmDelete,setConfirmDelete]=useState(null)
  const [localEnd,setLocalEnd]=useState(relEndDate||"")
  const [endSaved,setEndSaved]=useState(true)
  const relEndErr=localEnd&&units.some(u=>u.startDate&&parseDate(localEnd)<parseDate(u.startDate))
  const saveEnd=()=>{ onRelEndDateChange(localEnd); setEndSaved(true) }
  const oneTime=units.filter(u=>u.frequency==="once")
  const recurring=units.filter(u=>u.frequency!=="once")
  const updateUnit=u=>{ onUnitsChange(units.map(x=>x.id===u.id?u:x)); setEditingUnit(null) }
  const removeUnit=id=>onUnitsChange(units.filter(x=>x.id!==id))
  const deleteKeepPaid=id=>{
    const u=units.find(x=>x.id===id); if(!u) return
    const paidThru=getPaidThruSunday(units)
    const occs=expandUnit(u).filter(o=>!o.skipped&&isPaidOcc(o.start,paidThru))
    const keptUnits=occs.map(o=>({...defaultUnit(u.serviceId,{petIds:u.petIds,startDate:dateKey(o.start),endDate:u.endDate?dateKey(o.end||o.start):"",startTime:u.startTime,durationMins:u.durationMins}),frequency:"once"}))
    onUnitsChange([...units.filter(x=>x.id!==id),...keptUnits])
  }
  const refundAndDelete=id=>onUnitsChange(units.filter(x=>x.id!==id))
  const dupWithType=(u,newSvcId)=>{ onUnitsChange([...units,cloneUnit(u,newSvcId)]); setChangeTypeFor(null) }

  const UnitRow=({u})=>{
    const svc=SERVICES.find(s=>s.id===u.serviceId)
    const overnight=(svc&&svc.type)==="overnight"
    const upets=pets.filter(p=>u.petIds.includes(p.id))
    const nites=overnight?nightCount(u):0
    const skips=(u.skippedKeys||[]).length
    const overrideCount=u.overrides?Object.keys(u.overrides).length:0
    const weeklyLabel=u.frequency==="weekly"&&!overnight&&(u.weekDays||[]).length>0?(u.weekDays.slice().sort((a,b)=>a-b).map(d=>WEEKDAYS[d]).join(", ")):null
    return(
      <div style={{background:"#fff",borderRadius:8,padding:"13px 14px",marginBottom:8,border:`1.5px solid ${R.cardBorder}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap"}}>
              <span style={{fontSize:16}}>{svc&&svc.icon}</span>
              <span style={{fontWeight:600,fontSize:13,color:R.navy,fontFamily}}>{svc&&svc.label}</span>
              {u.frequency!=="once"&&<span style={{fontSize:10,background:R.blueLight,color:R.blue,fontWeight:600,padding:"1px 7px",borderRadius:99}}>↻ {u.frequency}{u.everyNWeeks>1?` ×${u.everyNWeeks}`:""}</span>}
            </div>
            <div style={{fontSize:12,color:R.gray,lineHeight:1.6,fontFamily}}>
              {overnight?`${fmtDate(parseDate(u.startDate))} – ${fmtDate(parseDate(u.endDate||u.startDate))} · ${nites} night${nites!==1?"s":""}`:
                `${fmtDate(parseDate(u.startDate))}${u.startTime?" · "+fmtTime(u.startTime):""} · ${durLabel(svc,u.durationMins)}`}
              {weeklyLabel&&` · ${weeklyLabel}`}{u.repeatEndDate&&` · ends ${fmtDate(parseDate(u.repeatEndDate))}`}
            </div>
            <div style={{fontSize:11,color:R.gray,marginTop:2,fontFamily}}>{upets.map(p=>p.emoji+" "+p.name).join(", ")||"No pets"}</div>
            {skips>0&&<div style={{fontSize:10,color:R.amber,marginTop:2,fontFamily}}>⏸ {skips} date{skips!==1?"s":""} skipped</div>}
            {overrideCount>0&&<div style={{fontSize:10,color:R.purple,marginTop:2,fontFamily}}>✦ {overrideCount} override{overrideCount!==1?"s":""}</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setEditingUnit(u)} style={{...btnSmall,flex:2}}>✎ Edit</button>
          <button onClick={()=>setChangeTypeFor(u)} style={{...btnSmall,flex:2}}>⧉ Copy</button>
          <button onClick={()=>setConfirmDelete(u)} style={{...btnSmallDestructive,flex:1}}>✕</button>
        </div>
      </div>
    )
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(10,18,30,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:R.bg,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"100%",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.18)"}}>
        <div style={{background:"#fff",padding:"18px 20px 14px",borderRadius:"20px 20px 0 0",borderBottom:`1px solid ${R.border}`,position:"sticky",top:0,zIndex:10}}>
          <div style={{width:36,height:4,borderRadius:99,background:R.border,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <h3 style={{margin:0,fontSize:17,fontWeight:600,color:R.navy,fontFamily}}>Manage relationship</h3>
              <p style={{margin:"2px 0 0",fontSize:12,color:R.gray,fontFamily}}>
                {oneTime.length>0&&recurring.length>0?`${oneTime.length} service${oneTime.length!==1?"s":""}, ${recurring.length} rule${recurring.length!==1?"s":""}`:
                  oneTime.length>0?`${oneTime.length} service${oneTime.length!==1?"s":""}`:
                  recurring.length>0?`${recurring.length} rule${recurring.length!==1?"s":""}`:
                  units.length+" item"+(units.length!==1?"s":"")}
              </p>
            </div>
            <button onClick={()=>setShowAdd(true)} style={{...btnGhost,padding:"8px 14px",fontSize:12,fontWeight:600,borderColor:R.blue,color:R.blue}}>+ Add</button>
          </div>
        </div>
        <div style={{padding:"16px 20px 36px"}}>
          <div style={{background:"#fff",borderRadius:8,padding:"14px 16px",marginBottom:20,border:`1.5px solid ${R.cardBorder}`}}>
            <PetPanel pets={pets} setPets={onPetsChange} selectedIds={pets.map(p=>p.id)} setSelectedIds={()=>{}} unitList={units} setUnitList={onUnitListChange} compact/>
          </div>
          {oneTime.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:R.gray,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8,fontFamily}}>One-time services</div>
              {oneTime.map(u=><UnitRow key={u.id} u={u}/>)}
            </div>
          )}
          {recurring.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:R.gray,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8,fontFamily}}>Recurring rules</div>
              {recurring.map(u=><UnitRow key={u.id} u={u}/>)}
            </div>
          )}
          {units.length===0&&(
            <div style={{textAlign:"center",padding:"32px 0",color:R.grayLight}}>
              <div style={{fontSize:28,marginBottom:8}}>📋</div>
              <div style={{fontSize:14,fontWeight:600,fontFamily}}>No services yet</div>
              <div style={{fontSize:12,marginTop:4,fontFamily}}>Tap + Add to create your first service</div>
            </div>
          )}
          <div style={{background:"#fff",borderRadius:8,padding:"14px 16px",border:`1.5px solid ${relEndErr?R.red:R.cardBorder}`}}>
            <label style={{...labelSt,marginBottom:8}}>Relationship end date <span style={{fontWeight:400,color:R.gray}}>(optional)</span></label>
            <CalInput value={localEnd} onChange={v=>{setLocalEnd(v);setEndSaved(false)}} placeholder="No end date — ongoing"/>
            {relEndErr&&<div style={{fontSize:11,color:R.red,fontWeight:600,marginBottom:8,fontFamily}}>⚠ Must be after all service start dates</div>}
            <div style={{fontSize:11,color:R.gray,marginBottom:10,fontFamily}}>{localEnd?`Repeating services stop after ${fmtDate(parseDate(localEnd))}`:"No end date — ongoing until manually ended"}</div>
            <button onClick={saveEnd} disabled={endSaved||!!relEndErr} style={{...btnPrimary,background:endSaved||relEndErr?R.border:R.blue,color:endSaved||relEndErr?R.gray:"#fff",boxShadow:"none",cursor:endSaved||relEndErr?"not-allowed":"pointer",padding:"10px"}}>
              {endSaved?"End date saved ✓":"Save end date"}
            </button>
          </div>
        </div>
        {editingUnit&&(
          <div style={{position:"fixed",inset:0,background:"rgba(10,18,30,0.5)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setEditingUnit(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:R.bg,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"100%",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.18)"}}>
              <div style={{background:"#fff",padding:"18px 20px 14px",borderRadius:"20px 20px 0 0",borderBottom:`1px solid ${R.border}`,position:"sticky",top:0,zIndex:1}}>
                <div style={{width:36,height:4,borderRadius:99,background:R.border,margin:"0 auto 14px"}}/>
                <button onClick={()=>setEditingUnit(null)} style={{...btnGhost,padding:"6px 12px",fontSize:12,marginBottom:12}}>← Back</button>
                <h3 style={{margin:0,fontSize:17,fontWeight:600,color:R.navy,fontFamily}}>{editingUnit.frequency==="once"?"Edit service":"Edit rule"}</h3>
              </div>
              <div style={{padding:"16px 20px 28px"}}>
                <UnitEditor unit={editingUnit} onChange={setEditingUnit} onRemove={()=>{removeUnit(editingUnit.id);setEditingUnit(null)}} allUnits={units.filter(u=>u.id!==editingUnit.id)} allPets={pets} showRemove={true}/>
                <button onClick={()=>updateUnit(editingUnit)} style={btnPrimary}>Save changes</button>
              </div>
            </div>
          </div>
        )}
        {changeTypeFor&&<ChangeTypeSheet unit={changeTypeFor} onConfirm={id=>dupWithType(changeTypeFor,id)} onClose={()=>setChangeTypeFor(null)}/>}
        {showAdd&&<AddSheet onAdd={u=>{onUnitsChange([...units,u]);setShowAdd(false)}} onClose={()=>setShowAdd(false)} existing={units} allPets={pets} defaultServiceId={units[0]?.serviceId}/>}
        {confirmDelete&&<DeleteConfirmDialog unit={confirmDelete} units={units} onDelete={id=>{removeUnit(id)}} onDeleteKeepPaid={deleteKeepPaid} onRefundAndDelete={refundAndDelete} onClose={()=>setConfirmDelete(null)}/>}
      </div>
    </div>
  )
}

// ─── Agenda view ──────────────────────────────────────────────────────────────
function AgendaView({agenda, upcomingRef, currentWeekRef, firstUpcomingKey, pets, relEndDate, paidThruSunday, incompleteKey, onTap, onReview}){
  if(agenda.length===0) return(
    <div style={{textAlign:"center",padding:"48px 20px",color:R.grayLight}}>
      <div style={{fontSize:32,marginBottom:8}}>📅</div>
      <div style={{fontSize:14,fontWeight:600,fontFamily}}>No upcoming services</div>
    </div>
  )

  // Group entries by month → week
  const monthGroups=[]
  let _lastMo=null, _lastWk=null
  const todayMid=new Date(PROTO_TODAY); todayMid.setHours(0,0,0,0)
  agenda.forEach(([dayKey,occs])=>{
    const d=parseDate(dayKey)
    const monday=getWeekMonday(d)
    const sunday=addDays(monday,6)
    const mo=`${sunday.getFullYear()}-${sunday.getMonth()}`
    const wk=dateKey(monday)
    if(mo!==_lastMo){monthGroups.push({mo,label:fmtMonthYear(sunday),weeks:[]});_lastMo=mo;_lastWk=null}
    const curMonth=monthGroups[monthGroups.length-1]
    if(wk!==_lastWk){curMonth.weeks.push({monday,wk,entries:[]});_lastWk=wk}
    curMonth.weeks[curMonth.weeks.length-1].entries.push([dayKey,occs])
  })

  const totalWeeks=monthGroups.reduce((n,m)=>n+m.weeks.length,0)
  let wkIdxGlobal=0

  return(
    <div>
      {monthGroups.map(({mo,label,weeks})=>(
        <div key={mo}>
          {/* Sticky month header */}
          <div style={{position:"sticky",top:0,zIndex:2,background:R.white,paddingTop:24,paddingBottom:16,borderBottom:`1px solid ${R.separator}`}}>
            <p style={{fontFamily,fontWeight:600,fontSize:20,color:R.navy,margin:0,lineHeight:1.25}}>{label}</p>
          </div>

          {weeks.map(({monday,wk,entries})=>{
            const wkIdx=wkIdxGlobal++
            const isPaid=monday<=todayMid
            const weekTotal=entries.reduce((sum,[,occs])=>sum+occs.reduce((s,occ)=>s+(occ.unit.cost||0),0),0)
            const fmtMoney=n=>`$${n.toFixed(2)}`
            const paymentLabel=isPaid?`Paid ${fmtMoney(weekTotal)}`:`Will be charged ${fmtMoney(weekTotal)}`
            const isLastWeek=wkIdx===totalWeeks-1
            const isCurrentWk=dateKey(monday)===dateKey(getWeekMonday(todayMid))
            return(
              <div key={wk}>
                {/* Week header */}
                <div ref={isCurrentWk?currentWeekRef:null} style={{paddingTop:16,paddingBottom:8}}>
                  <p style={{fontFamily,fontWeight:600,fontSize:16,color:R.navy,margin:0,lineHeight:1.25}}>Week of {fmtDate(monday)}</p>
                  <p style={{fontFamily,fontSize:14,color:R.gray,margin:"4px 0 0",lineHeight:1.25}}>{paymentLabel}</p>
                </div>

                {entries.map(([dayKey,occs],entryIdx)=>{
                  const d=parseDate(dayKey)
                  const today=isToday(d), past=isPast(d)
                  const isLastEntry=isLastWeek&&entryIdx===entries.length-1
                  const showEndMarker=relEndDate&&isLastEntry
                  const DAY_NAMES_FULL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
                  return(
                    <div key={dayKey} ref={dayKey===firstUpcomingKey?upcomingRef:null} style={{marginBottom:16}}>

                  {/* Day row: date tile + weekday name only */}
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:44,height:44,borderRadius:8,flexShrink:0,background:"#FFECBD",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:13,fontWeight:600,color:R.navy,fontFamily}}>{d.getDate()}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <p style={{fontFamily,fontWeight:600,fontSize:16,color:R.navy,margin:0,lineHeight:1.25}}>{DAY_NAMES_FULL[d.getDay()]}</p>
                    </div>
                  </div>

                  {/* Service cards: time + recurrence rule, no avatars */}
                  {occs.map((occ,occIdx)=>{
                    const isOccToday=today&&!past
                    const isBlocked=isOccToday&&occIdx>0
                    const showReviewBtn=occ.key===incompleteKey
                    const overnight=occ.svc.type==="overnight"
                    const timeLabel=overnight?`${fmtDate(occ.start)} – ${fmtDate(occ.end)}`:fmtTime(occ.unit.startTime)
                    return(
                      <div key={`${occ.key}-${occ.nightIndex||0}`} style={{border:`2px solid #D7DCE0`,borderRadius:8,padding:"0 16px",background:R.white,marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:16,paddingBottom:isOccToday||showReviewBtn?8:16}}>
                          <div style={{flex:1}}>
                            <p style={{fontFamily,fontWeight:600,fontSize:16,color:R.navy,margin:"0 0 4px",lineHeight:1.5}}>{timeLabel}</p>
                            <p style={{fontFamily,fontSize:14,color:R.gray,margin:0,lineHeight:1.25}}>{shortRuleLabel(occ.unit)}</p>
                          </div>
                          {(!past||showReviewBtn)&&<Button variant="default" icon={<MoreIcon size={16}/>} onClick={e=>{e.stopPropagation();onTap(occ)}}/>}
                        </div>
                        {isOccToday&&(
                          <div style={{display:"flex",gap:8,paddingTop:8,paddingBottom:16}}>
                            <Button variant="primary" style={{flex:1}} disabled={isBlocked}>Start Rover Card</Button>
                          </div>
                        )}
                        {showReviewBtn&&(
                          <div style={{display:"flex",gap:8,paddingBottom:8}}>
                            <Button variant="flat" style={{flex:1}} onClick={e=>{e.stopPropagation();onReview(occ)}}>Review and complete</Button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {showEndMarker&&(
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
              </div>
            )
          })}
        </div>
      ))}
      <div style={{height:80}}/>
    </div>
  )
}

// ─── RelationshipScreen ───────────────────────────────────────────────────────
export default function RelationshipScreen({ initialPets, initialUnits }){
  const [pets,       setPets]       = useState(initialPets || PETS_SEED)
  const [units,      setUnits]      = useState(initialUnits || [])
  const [relEndDate, setRelEndDate] = useState("")
  const [showAdd,    setShowAdd]    = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [activeOcc,  setActiveOcc]  = useState(null)
  const [reviewOcc,  setReviewOcc]  = useState(null)
  const [cancelUnit,       setCancelUnit]       = useState(null)
  const [pastWeeksVisible,  setPastWeeksVisible]  = useState(0)
  const [currentWeekHidden, setCurrentWeekHidden] = useState(false)
  const [isBelowToday,      setIsBelowToday]      = useState(false)
  const PAST_PAGE   = 2
  const WEEK_HEIGHT = 150  // px — approximate height of one week's entries
  const scrollRef   = useRef(null)
  const upcomingRef = useRef(null)
  const currentWeekRef = useRef(null)
  const [isLoadingPast, setIsLoadingPast] = useState(false)
  const prevScrollHeightRef = useRef(null)
  const hiddenPastWeeksRef = useRef(0)

  const checkScrollPosition=()=>{
    if(!scrollRef.current||!upcomingRef.current) return
    const cRect=scrollRef.current.getBoundingClientRect()
    const aTop=upcomingRef.current.getBoundingClientRect().top
    setIsBelowToday(aTop<cRect.top)
    setCurrentWeekHidden(aTop<cRect.top-WEEK_HEIGHT||aTop>cRect.bottom)
  }

  const triggerLoadPast=()=>{
    if(isLoadingPast||hiddenPastWeeksRef.current<=0) return
    setIsLoadingPast(true)
    prevScrollHeightRef.current=scrollRef.current?.scrollHeight??null
  }

  useEffect(()=>{
    checkScrollPosition()
    window.addEventListener('resize', checkScrollPosition)
    return ()=>window.removeEventListener('resize', checkScrollPosition)
  },[pastWeeksVisible, units])

  // Wheel: fire when user scrolls up while already at the top
  useEffect(()=>{
    const el=scrollRef.current
    if(!el) return
    const onWheel=(e)=>{
      if(el.scrollTop===0&&e.deltaY<0) triggerLoadPast()
    }
    el.addEventListener('wheel', onWheel, {passive:true})
    return ()=>el.removeEventListener('wheel', onWheel)
  },[isLoadingPast])

  // Touch: fire when user pulls down from the top edge
  useEffect(()=>{
    const el=scrollRef.current
    if(!el) return
    let touchStartY=0
    const onTouchStart=(e)=>{ touchStartY=e.touches[0].clientY }
    const onTouchEnd=(e)=>{
      const deltaY=e.changedTouches[0].clientY-touchStartY
      if(el.scrollTop===0&&deltaY>30) triggerLoadPast()
    }
    el.addEventListener('touchstart', onTouchStart, {passive:true})
    el.addEventListener('touchend', onTouchEnd, {passive:true})
    return ()=>{ el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchend', onTouchEnd) }
  },[isLoadingPast])

  useEffect(()=>{
    if(currentWeekRef.current&&scrollRef.current){
      const containerTop=scrollRef.current.getBoundingClientRect().top
      const elTop=currentWeekRef.current.getBoundingClientRect().top
      const stickyHeight=72 // month header: paddingTop 24 + text ~24 + paddingBottom 16 + border ~1
      scrollRef.current.scrollTop+=(elTop-containerTop)-stickyHeight
    }
  },[])

  useEffect(()=>{
    if(!isLoadingPast) return
    const t=setTimeout(()=>{
      setPastWeeksVisible(v=>v+PAST_PAGE)
      setIsLoadingPast(false)
    },600)
    return ()=>clearTimeout(t)
  },[isLoadingPast])

  useEffect(()=>{
    if(prevScrollHeightRef.current==null||!scrollRef.current) return
    scrollRef.current.scrollTop=scrollRef.current.scrollHeight-prevScrollHeightRef.current
    prevScrollHeightRef.current=null
  },[pastWeeksVisible])

  const updateUnit=u=>setUnits(prev=>prev.map(x=>x.id===u.id?u:x))

  const skipOccurrence=(occKey,skip)=>{
    setUnits(prev=>prev.map(u=>{
      const occs=expandUnit(u)
      if(!occs.find(o=>o.key===occKey)) return u
      const dayKey2=occKey.replace(`${u.id}-`,"")
      const keys=u.skippedKeys||[]
      return {...u,skippedKeys:skip?[...new Set([...keys,dayKey2])]:keys.filter(k=>k!==dayKey2)}
    }))
  }

  const overrideOccurrence=(occ,draft)=>{
    const dk=dateKey(occ.start)
    const parentId=occ.parentUnit?occ.parentUnit.id:occ.unit.id
    setUnits(prev=>prev.map(u=>{
      if(u.id!==parentId) return u
      const overrides={...(u.overrides||{})}
      overrides[dk]={serviceId:draft.serviceId,startTime:draft.startTime,durationMins:draft.durationMins,petIds:draft.petIds}
      return {...u,overrides}
    }))
  }

  const cancelDayFromDate=(occ)=>{
    const parentUnit=occ.parentUnit||occ.unit
    const occDow=occ.start.getDay()
    const newWeekDays=(parentUnit.weekDays||[]).filter(d=>d!==occDow)
    const dk=dateKey(occ.start)
    setUnits(prev=>{
      const updated=prev.map(u=>u.id!==parentUnit.id?u:{...u,repeatEndDate:dateKey(addDays(occ.start,-1))})
      const newUnit={
        ...defaultUnit(parentUnit.serviceId,{
          petIds:parentUnit.petIds,
          startDate:dk,
          startTime:parentUnit.startTime,
          durationMins:parentUnit.durationMins,
          frequency:parentUnit.frequency,
          weekDays:newWeekDays,
          everyNWeeks:parentUnit.everyNWeeks,
        }),
        repeatEndDate:parentUnit.repeatEndDate||"",
      }
      return [...updated,newUnit]
    })
  }

  const overrideFromDate=(occ,draft)=>{
    const dk=dateKey(occ.start)
    const parentId=occ.parentUnit?occ.parentUnit.id:occ.unit.id
    setUnits(prev=>{
      const parent=prev.find(u=>u.id===parentId); if(!parent) return prev
      // End the old rule the day before this occurrence
      const updated=prev.map(u=>u.id!==parentId?u:{...u,repeatEndDate:dateKey(addDays(occ.start,-1))})
      // Start a new rule from this date using all draft values
      const newUnit={
        ...defaultUnit(draft.serviceId,{
          petIds:draft.petIds,
          startDate:dk,
          startTime:draft.startTime,
          durationMins:draft.durationMins,
          frequency:draft.frequency,
          weekDays:draft.weekDays,
          everyNWeeks:draft.everyNWeeks,
        }),
        // Inherit the original rule's end date if it had one
        repeatEndDate:parent.repeatEndDate||"",
        endDate:parent.endDate||"",
      }
      return [...updated,newUnit]
    })
  }

  const paidThruSunday=getPaidThruSunday(units)
  const agenda=buildAgenda(units,relEndDate)
  const incompleteKey=useMemo(()=>{
    const thisMonday=getWeekMonday(PROTO_TODAY)
    const lastMonday=addDays(thisMonday,-7)
    const lastWeekOccs=agenda.flatMap(([,occs])=>occs).filter(occ=>occ.start>=lastMonday&&occ.start<thisMonday)
    if(!lastWeekOccs.length) return null
    return lastWeekOccs.reduce((max,occ)=>occ.start>max.start?occ:max).key
  },[agenda])
  const totalOccs=agenda.reduce((a,[,o])=>a+o.length,0)
  const allPastEntries=agenda.filter(([dk])=>isPast(parseDate(dk)))
  const allUpcoming=agenda.filter(([dk])=>!isPast(parseDate(dk)))
  const pastWeekGroups=[];let _lastWk=null
  allPastEntries.forEach(entry=>{ const wk=dateKey(getWeekMonday(parseDate(entry[0]))); if(wk!==_lastWk){pastWeekGroups.push([]);_lastWk=wk}; pastWeekGroups[pastWeekGroups.length-1].push(entry) })
  const totalPastWeeks=pastWeekGroups.length
  const hiddenPastWeeks=Math.max(0,totalPastWeeks-pastWeeksVisible)
  hiddenPastWeeksRef.current=hiddenPastWeeks
  const visiblePastEntries=pastWeeksVisible>0?pastWeekGroups.slice(-pastWeeksVisible).flat():[]

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:R.white,position:"relative"}}>
      <div ref={scrollRef} onScroll={checkScrollPosition} className="hide-scrollbar" style={{flex:1,overflowY:"auto",padding:"0 16px 0"}}>
        {(isLoadingPast||hiddenPastWeeksRef.current>0)&&(
          <div style={{height:44,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {isLoadingPast&&<div style={{width:18,height:18,border:`2px solid ${R.border}`,borderTopColor:R.blue,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>}
          </div>
        )}
        <AgendaView agenda={[...visiblePastEntries, ...allUpcoming]} upcomingRef={upcomingRef} currentWeekRef={currentWeekRef} firstUpcomingKey={allUpcoming[0]?.[0]} pets={pets} relEndDate={relEndDate} paidThruSunday={paidThruSunday} incompleteKey={incompleteKey} onTap={setActiveOcc} onReview={setReviewOcc}/>
      </div>
      {currentWeekHidden&&(
        <div style={{position:"absolute",bottom:72,left:"50%",transform:"translateX(-50%)",zIndex:10,pointerEvents:"auto"}}>
          <button
            onClick={()=>upcomingRef.current?.scrollIntoView({behavior:"smooth",block:"start"})}
            style={{background:R.navy,color:"#fff",border:"none",borderRadius:99,padding:"8px 20px",fontFamily,fontWeight:600,fontSize:14,cursor:"pointer",boxShadow:"0px 2px 12px -1px rgba(27,31,35,0.32)",whiteSpace:"nowrap"}}
          >
            {isBelowToday?"↑ Current week":"↓ Current week"}
          </button>
        </div>
      )}

      <div style={{padding:"10px 16px 12px",background:R.white,borderTop:`1px solid ${R.separator}`,flexShrink:0}}>
        <div style={{display:"flex",gap:12}}>
          <Button variant="primary" size="small" onClick={()=>setShowAdd(true)} style={{flex:2}}>Add a service</Button>
          <Button variant="default" size="small" onClick={()=>setShowManage(true)} style={{flex:1}}>Manage</Button>
        </div>
      </div>

      {showAdd&&<AddSheet onAdd={u=>{setUnits(prev=>[...prev,{...u,petIds:u.petIds.length?u.petIds:pets.map(p=>p.id)}]);setShowAdd(false)}} onClose={()=>setShowAdd(false)} existing={units} allPets={pets} defaultServiceId={units[0]?.serviceId}/>}
      {showManage&&<ManageSheet units={units} pets={pets} relEndDate={relEndDate} onUnitsChange={setUnits} onRelEndDateChange={setRelEndDate} onPetsChange={setPets} onUnitListChange={setUnits} onClose={()=>setShowManage(false)}/>}
      {activeOcc&&<OccActionSheet occ={activeOcc} allPets={pets}
        onSaveUnit={u=>{updateUnit(u);setActiveOcc(null)}}
        onSkip={skipOccurrence}
        onOverride={overrideOccurrence}
        onOverrideFromDate={overrideFromDate}
        onCancelDayFromDate={cancelDayFromDate}
        onCancel={u=>{setActiveOcc(null);setCancelUnit(u)}}
        onClose={()=>setActiveOcc(null)}/>}
      {cancelUnit&&<DeleteConfirmDialog unit={cancelUnit} units={units}
        onDelete={id=>{setUnits(prev=>prev.filter(x=>x.id!==id))}}
        onDeleteKeepPaid={id=>{
          const u=units.find(x=>x.id===id); if(!u) return
          const paidThru=getPaidThruSunday(units)
          const occs=expandUnit(u).filter(o=>!o.skipped&&isPaidOcc(o.start,paidThru))
          const kept=occs.map(o=>({...defaultUnit(u.serviceId,{petIds:u.petIds,startDate:dateKey(o.start),endDate:u.endDate?dateKey(o.end||o.start):"",startTime:u.startTime,durationMins:u.durationMins}),frequency:"once"}))
          setUnits(prev=>[...prev.filter(x=>x.id!==id),...kept])
        }}
        onRefundAndDelete={id=>{setUnits(prev=>prev.filter(x=>x.id!==id))}}
        onClose={()=>setCancelUnit(null)}/>}
      {reviewOcc&&(()=>{
        const occPets=pets.filter(p=>reviewOcc.unit.petIds.includes(p.id))
        const endT=endTimeFromDuration(reviewOcc.unit.startTime,reviewOcc.unit.durationMins)
        const card={
          label:`${reviewOcc.svc.label}${occPets.length>0?`: ${occPets.map(p=>p.name).join(", ")}` :""}`,
          sublabel:`${fmtRelDate(reviewOcc.start)} · ${fmtTime(reviewOcc.unit.startTime)} to ${fmtTime(endT)}`,
          images:occPets.map(p=>p.img),
          cost:"",
        }
        return <ReviewSheet visible card={card} onClose={()=>setReviewOcc(null)} onComplete={()=>setReviewOcc(null)} onCancelRefund={()=>setReviewOcc(null)}/>
      })()}
    </div>
  )
}
