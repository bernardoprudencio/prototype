import React, { useEffect, useRef, useState } from 'react'
import { colors, typography } from '../tokens'

const STAGE_W = 1600
const STAGE_H = 900

const stage = {
  bg: '#0B1220',
  card: '#FFFFFF',
  ink: colors.primary,
  muted: colors.tertiary,
  accent: colors.link,
  rule: colors.border,
}

const titleFont = {
  fontFamily: typography.displayFamily,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: stage.ink,
}

const eyebrow = {
  fontFamily: typography.fontFamily,
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: stage.accent,
  margin: 0,
}

const body = {
  fontFamily: typography.fontFamily,
  fontSize: 22,
  lineHeight: 1.45,
  color: stage.ink,
  margin: 0,
}

const muted = {
  fontFamily: typography.fontFamily,
  fontSize: 18,
  lineHeight: 1.5,
  color: stage.muted,
  margin: 0,
}

const Bullets = ({ items }) => (
  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18 }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <span style={{
          flexShrink: 0, width: 8, height: 8, borderRadius: 99,
          background: stage.accent, marginTop: 14,
        }} />
        <span style={body}>{item}</span>
      </li>
    ))}
  </ul>
)

const Stat = ({ value, label }) => (
  <div style={{
    background: stage.card, border: `1px solid ${stage.rule}`, borderRadius: 12,
    padding: '28px 24px', flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: 8,
  }}>
    <p style={{ ...titleFont, fontSize: 56, lineHeight: 1, margin: 0 }}>{value}</p>
    <p style={{ ...muted, fontSize: 16 }}>{label}</p>
  </div>
)

const SlideHeader = ({ eyebrowText, title }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
    {eyebrowText && <p style={eyebrow}>{eyebrowText}</p>}
    <h2 style={{ ...titleFont, fontSize: 44, lineHeight: 1.1, margin: 0 }}>{title}</h2>
  </div>
)

function SlideTitle() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', height: '100%' }}>
      <p style={eyebrow}>Product & Design Leadership Review</p>
      <h1 style={{ ...titleFont, fontSize: 72, lineHeight: 1.05, margin: 0 }}>
        Action incomplete<br/>Rover Cards
      </h1>
      <p style={{ ...body, fontSize: 26, color: stage.muted }}>from the app · April 30, 2026</p>
    </div>
  )
}

function SlideTLDR() {
  return (
    <div>
      <SlideHeader eyebrowText="TL;DR" title="What we're shipping" />
      <Bullets items={[
        "Productize the missed Rover Card flow on the sitter's Home tab.",
        "Reduce delayed payouts, owner refund delays, and reliance on CX.",
        "v1 ships with end-of-week payment logic update — immediate refunds deferred to a follow-up.",
      ]} />
    </div>
  )
}

function SlideProblem() {
  return (
    <div>
      <SlideHeader eyebrowText="Problem" title="Today, missing a Rover Card means…" />
      <Bullets items={[
        "Sitters contact CX (limited to 5 manual fixes per provider) or wait for the Monday email.",
        "Owners' refunds are held alongside the sitter's payout for up to two weeks.",
        "Confusion and frustration with the recurring feature — and ultimately off-platform attrition.",
      ]} />
    </div>
  )
}

function SlideNumbers() {
  return (
    <div>
      <SlideHeader eyebrowText="By the numbers" title="The cost of the current flow" />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Stat value="57%" label="of providers had at least one delayed payment in the last 6 months" />
        <Stat value="~2.6k" label="providers per week are paid two weeks late after a missed Rover Card" />
        <Stat value="~50%" label="of delayed payments only resolve after a full 2-week wait" />
        <Stat value="~10%" label="of weekly recurring stays have ≥1 missing Rover Card (up to 20% at Christmas)" />
      </div>
      <p style={{ ...muted, marginTop: 24 }}>Source: Mode dashboard · last 6 months</p>
    </div>
  )
}

function FlowCard({ day, title, desc, miniature }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <p style={{
        ...muted, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: stage.accent, margin: 0,
      }}>{day}</p>
      <div style={{
        background: stage.card, border: `1px solid ${stage.rule}`, borderRadius: 10,
        padding: 12, height: 110, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {miniature}
      </div>
      <p style={{ ...body, fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</p>
      <p style={{ ...muted, fontSize: 14, margin: 0 }}>{desc}</p>
    </div>
  )
}

function FlowArrow() {
  return (
    <div style={{
      flexShrink: 0, alignSelf: 'flex-start', marginTop: 50,
      color: stage.muted, fontSize: 22,
    }}>→</div>
  )
}

const EmailMini = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
    <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 10, color: stage.ink, margin: 0, lineHeight: 1.2 }}>
      Your payment is being held
    </p>
    <div style={{ height: 1, background: stage.rule }} />
    <p style={{ fontFamily: typography.fontFamily, fontSize: 8, color: stage.muted, margin: 0, lineHeight: 1.3 }}>
      Oops—it looks like a Rover Card was not completed…
    </p>
    <p style={{ fontFamily: typography.fontFamily, fontSize: 8, color: stage.accent, margin: 'auto 0 0', lineHeight: 1.2 }}>
      click here →
    </p>
  </div>
)

const LandingMini = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
    <p style={{ fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 10, color: stage.ink, margin: 0, textAlign: 'center' }}>
      Incomplete Services
    </p>
    <div style={{ height: 1, background: stage.rule }} />
    <p style={{ fontFamily: typography.fontFamily, fontSize: 8, color: stage.muted, margin: 0, lineHeight: 1.3 }}>
      Tue · Nov 14<br/>Wed · Nov 15
    </p>
    <div style={{
      marginTop: 'auto', background: '#1B6C42', color: stage.card,
      borderRadius: 4, padding: '4px 6px', textAlign: 'center',
      fontFamily: typography.fontFamily, fontSize: 8, fontWeight: 700,
    }}>
      I didn't perform these
    </div>
  </div>
)

const CxMini = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 99,
      background: stage.bg, color: stage.card,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 12,
    }}>CX</div>
    <p style={{ fontFamily: typography.fontFamily, fontSize: 9, color: stage.muted, margin: 0, textAlign: 'center', lineHeight: 1.3 }}>
      Limited to <b style={{ color: stage.ink }}>5 fixes</b><br/>per provider / week
    </p>
  </div>
)

const NotesMini = () => (
  <div style={{
    width: '100%', height: '100%', background: '#1F2124',
    color: stage.card, borderRadius: 6, padding: 8,
    display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <p style={{ fontFamily: typography.fontFamily, fontSize: 8, color: '#9EA5AC', margin: 0 }}>Staff Notes</p>
    <p style={{ fontFamily: typography.fontFamily, fontSize: 8, margin: 0, lineHeight: 1.3 }}>
      [cx] Missing RC, 5th time. <span style={{ color: '#FFB4B4' }}>FINAL WARNING.</span>
    </p>
  </div>
)

const PayoutMini = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
    <p style={{ fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 22, color: stage.ink, margin: 0 }}>+7 days</p>
    <p style={{ fontFamily: typography.fontFamily, fontSize: 9, color: stage.muted, margin: 0, textAlign: 'center', lineHeight: 1.3 }}>
      after the original<br/>service date
    </p>
  </div>
)

function SlideCurrentFlow() {
  return (
    <div>
      <SlideHeader eyebrowText="Today's flow" title="The path to resolve a missing Rover Card" />
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
        <FlowCard day="Mon" title='"Payment held" email' desc="Sent every Monday to every sitter with missing cards." miniature={<EmailMini />} />
        <FlowArrow />
        <FlowCard day="Tue+" title="Email landing page" desc="~16% of these stays — sitter confirms before the deadline." miniature={<LandingMini />} />
        <FlowArrow />
        <FlowCard day="Tue+" title="…or contact CX" desc="~5% of these stays — capped at 5 manual fixes per provider per week." miniature={<CxMini />} />
        <FlowArrow />
        <FlowCard day="Wed+" title="CX fixes manually" desc="Internal notes track repeat offenders and warnings." miniature={<NotesMini />} />
        <FlowArrow />
        <FlowCard day="Sun → Mon+" title="Payout / refund lands" desc="A full week (or more) after the service." miniature={<PayoutMini />} />
      </div>
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${stage.rule}`, maxWidth: 1000 }}>
        <p style={{
          ...muted, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', margin: 0,
        }}>Where stays end up today</p>
        <p style={{ ...body, fontSize: 17, marginTop: 6 }}>
          ~10% of stays have a missing Rover Card each week (up to ~20% during Christmas). Among these:
        </p>
        <p style={{ ...body, fontSize: 17, marginTop: 4 }}>
          ~20% are paid out on time · ~30% experience a delayed payout · ~50% are never paid out (owner auto‑refunded).
        </p>
      </div>
    </div>
  )
}

function SlideHypothesis() {
  return (
    <div>
      <SlideHeader eyebrowText="Hypothesis" title="If sitters can resolve missing cards in‑app…" />
      <p style={{ ...body, fontSize: 28, lineHeight: 1.4, maxWidth: 900 }}>
        …we'll reduce payment holds, shorten the path to payout, and cut CX volume —
        without rebuilding the email and CX safety net.
      </p>
      <p style={{ ...muted, marginTop: 24, maxWidth: 900 }}>
        We'll know it worked when payment holds drop, delayed payments drop, and CX tickets
        for missing Rover Cards trend toward zero.
      </p>
    </div>
  )
}

function SlideSolution() {
  const items = [
    { n: '1', t: '"Incomplete" section at the top of Home', d: 'One card per missed unit — date, time, pet, service.' },
    { n: '2', t: '"Did the walk happen?" review sheet', d: 'Yes / No, with No pre‑selected. One primary "Submit" CTA.' },
    { n: '3', t: 'Confirmation in the conversation', d: 'A system message lets the owner know what happened.' },
    { n: '4', t: 'End‑of‑week payment logic uses sitter answers', d: 'No payment hold if every unit is accounted for.' },
  ]
  return (
    <div>
      <SlideHeader eyebrowText="Solution" title="What we built" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map(({ n, t, d }) => (
          <div key={n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: 99,
              background: stage.accent, color: stage.card,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 18,
            }}>{n}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <p style={{ ...body, fontWeight: 700 }}>{t}</p>
              <p style={muted}>{d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideWalkthrough() {
  const steps = [
    { t: 'Home', d: 'Per‑unit "Incomplete" cards at the top of the day.' },
    { t: 'Review sheet', d: 'Yes / No with No pre‑selected — primary "Submit".' },
    { t: 'System message', d: 'Owner sees the outcome in the conversation.' },
  ]
  return (
    <div>
      <SlideHeader eyebrowText="Design walkthrough" title="Three surfaces, one decision" />
      <div style={{ display: 'flex', gap: 16 }}>
        {steps.map(({ t, d }, i) => (
          <div key={t} style={{
            flex: 1, minWidth: 0, padding: 24, borderRadius: 12,
            background: stage.card, border: `1px solid ${stage.rule}`,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <p style={{ ...muted, fontSize: 15, fontWeight: 700, color: stage.accent }}>STEP {i + 1}</p>
            <p style={{ ...body, fontWeight: 700, fontSize: 24 }}>{t}</p>
            <p style={muted}>{d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideDemo() {
  const src = import.meta.env.BASE_URL
  const [reloadKey, setReloadKey] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 56, height: '100%', alignItems: 'stretch' }}>
      {/* Phone column — frame + reload control under it */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* Phone-shaped iframe — real iPhone proportions */}
        <div style={{
          width: 390,
          height: 780,
          background: '#1F2124',
          borderRadius: 40, overflow: 'hidden',
          border: '10px solid #1F2124',
          boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
        }}>
          <iframe
            key={reloadKey}
            src={src}
            title="Incomplete Cards prototype"
            style={{
              width: '100%', height: '100%',
              border: 0, background: '#fff', display: 'block',
            }}
          />
        </div>
        <button
          onClick={() => setReloadKey(k => k + 1)}
          style={{
            background: stage.card,
            border: `1px solid ${stage.rule}`,
            borderRadius: 99,
            padding: '8px 18px',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 14,
            color: stage.ink, cursor: 'pointer',
          }}
          title="Reload the prototype without restarting the deck"
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>↻</span>
          Reload prototype
        </button>
      </div>

      {/* Right-side talking points */}
      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32,
      }}>
        <div>
          <p style={eyebrow}>Live demo</p>
          <h2 style={{ ...titleFont, fontSize: 48, lineHeight: 1.1, margin: '8px 0 0' }}>
            Try the flow
          </h2>
        </div>
        <Bullets items={[
          'Tap "Review and submit" on the Incomplete card.',
          '"Did the walk happen?" — pick Yes or No, then Submit.',
          'See the system message land in the conversation.',
        ]} />
        <p style={{ ...muted, fontSize: 16, margin: 0 }}>
          The phone on the left is the live prototype — interact directly.
          Use Reload to start over without leaving the deck.
        </p>
      </div>
    </div>
  )
}

function SlideDecisions() {
  const items = [
    { t: 'No immediate refunds in v1', d: 'Defer to end‑of‑week processing — accepted 2026‑04‑29 after Ion / Jake / Bernardo discussion.' },
    { t: 'No "More" actions menu on cards', d: 'Single "Review and submit" CTA; multi‑action affordance returns in a later round.' },
    { t: '"No" is pre‑selected', d: '95% of missing Rover Cards turn out to be services that didn\'t happen — match the most likely answer.' },
    { t: '2‑week visibility window', d: 'Cards from the prior week appear with Monday\'s "payment held" email and stay visible for 2 weeks — matches the existing email window, no permanent backlog.' },
  ]
  return (
    <div>
      <SlideHeader eyebrowText="v1 decisions" title="What we cut, and why" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map(({ t, d }) => (
          <div key={t} style={{
            padding: '18px 22px', borderRadius: 10,
            background: stage.card, border: `1px solid ${stage.rule}`,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <p style={{ ...body, fontWeight: 700 }}>{t}</p>
            <p style={muted}>{d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideRisks() {
  const items = [
    { t: 'Payments and orders complexity', d: 'Reviews from both teams on 1P, Specs, and RFC; regression test plan; CX smoke test.' },
    { t: 'Rover Cards aren\'t tied to a unit today', d: 'Spike to link first card of the day to first unit; CX‑created cards use the time selected.' },
    { t: 'Email + CX flow regression', d: 'Existing flow keeps working; landing page filters out units already resolved in‑app.' },
  ]
  return (
    <div>
      <SlideHeader eyebrowText="Risks & mitigations" title="What could break, and how we hedge" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map(({ t, d }) => (
          <div key={t} style={{
            padding: '18px 22px', borderRadius: 10,
            background: stage.card, border: `1px solid ${stage.rule}`,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <p style={{ ...body, fontWeight: 700 }}>{t}</p>
            <p style={muted}>{d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideRollout() {
  const stages = ['10%', '25%', '50%', '100%']
  return (
    <div>
      <SlideHeader eyebrowText="Rollout" title="Gradual, behind a feature flag" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        {stages.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{
              padding: '14px 22px', borderRadius: 99,
              background: i === 3 ? stage.accent : stage.card,
              color: i === 3 ? stage.card : stage.ink,
              border: `1px solid ${i === 3 ? stage.accent : stage.rule}`,
              fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20,
            }}>{s}</div>
            {i < stages.length - 1 && <span style={{ ...muted, fontSize: 22 }}>→</span>}
          </React.Fragment>
        ))}
      </div>
      <p style={{ ...body, maxWidth: 880 }}>
        One business day per stage. The "Action required" email landing page filters out
        units already resolved in‑app, so sitters never see a stale to‑do.
      </p>
    </div>
  )
}

function SlideMetrics() {
  return (
    <div>
      <SlideHeader eyebrowText="Success metrics" title="How we'll know it worked" />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Stat value="↓" label="% share of payment holds in recurring bookings (currently ~10%/wk)" />
        <Stat value="↓" label="% delayed payments in recurring bookings (currently 8–9%/wk)" />
        <Stat value="↓" label="CX ticket volume for missing Rover Cards" />
        <Stat value="↑" label="Qualitative sitter and owner sentiment around recurring" />
      </div>
    </div>
  )
}

function SlideNext() {
  return (
    <div>
      <SlideHeader eyebrowText="What's next" title="Beyond v1" />
      <Bullets items={[
        "Milestone 2 — parity between completed and missed cards, more actions, and clearer sectioning on Home.",
        "Revisit immediate refunds with fee‑impact data from Mode.",
        "Deprecate the Monday \"Action required\" email entirely once in‑app coverage is high.",
        "Make Rover Cards optional for established recurring relationships.",
      ]} />
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${stage.rule}` }}>
        <p style={{ ...muted, marginBottom: 8 }}>Read more</p>
        <p style={{ ...body, fontSize: 18, color: stage.accent }}>
          1P · Functional Specs · RFC · Figma (UX2‑7159) · Q2 design explorations · #temp‑action‑missing‑rover‑cards
        </p>
      </div>
    </div>
  )
}

const SLIDES = [
  SlideTitle, SlideTLDR, SlideProblem, SlideCurrentFlow, SlideNumbers, SlideHypothesis,
  SlideSolution, SlideWalkthrough, SlideDemo, SlideDecisions, SlideRisks,
  SlideRollout, SlideMetrics, SlideNext,
]

export default function DeckScreen({ onClose }) {
  const [i, setI] = useState(0)
  const [scale, setScale] = useState(1)
  const stageRef = useRef(null)
  const total = SLIDES.length
  const Slide = SLIDES[i]

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const calc = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width <= 0 || height <= 0) return
      setScale(Math.min(width / STAGE_W, height / STAGE_H))
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        setI((n) => Math.min(n + 1, total - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        setI((n) => Math.max(n - 1, 0))
      } else if (e.key === 'Home') {
        setI(0)
      } else if (e.key === 'End') {
        setI(total - 1)
      } else if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, total])

  const next = () => setI((n) => Math.min(n + 1, total - 1))
  const prev = () => setI((n) => Math.max(n - 1, 0))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: stage.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: typography.fontFamily,
    }}>
      {/* Top bar */}
      <div style={{
        flexShrink: 0, padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: 'rgba(255,255,255,0.7)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}>
          INCOMPLETE ROVER CARDS · LEADERSHIP REVIEW
        </span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          {i + 1} / {total}
        </span>
        <button onClick={onClose} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
          color: 'rgba(255,255,255,0.85)', padding: '6px 14px', borderRadius: 99,
          fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 13,
          cursor: 'pointer',
        }}>Exit · Esc</button>
      </div>

      {/* Stage — canonical-canvas + scale-to-fit so all slide content
          (text, phone, padding) shrinks proportionally on smaller viewports */}
      <div ref={stageRef} style={{
        flex: 1, minHeight: 0, padding: '0 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: STAGE_W, height: STAGE_H,
          marginLeft: -STAGE_W / 2, marginTop: -STAGE_H / 2,
          background: stage.card, borderRadius: 20,
          padding: '64px 80px', boxSizing: 'border-box',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}>
          <Slide />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0, padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <button onClick={prev} disabled={i === 0} style={navBtn(i === 0)}>← Prev</button>
        <button onClick={next} disabled={i === total - 1} style={navBtn(i === total - 1)}>Next →</button>
      </div>
    </div>
  )
}

function navBtn(disabled) {
  return {
    background: disabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.92)',
    padding: '10px 20px', borderRadius: 99,
    fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
