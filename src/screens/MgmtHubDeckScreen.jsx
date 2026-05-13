import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { colors, typography } from '../tokens'

// Lets a deeply-nested ScreenshotCard open the full-size image overlay,
// which lives outside the scaled slide stage so it isn't shrunk along with it.
const LightboxCtx = createContext(() => {})

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
  fontSize: 18,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: stage.accent,
  margin: 0,
}

const body = {
  fontFamily: typography.fontFamily,
  fontSize: 28,
  lineHeight: 1.45,
  color: stage.ink,
  margin: 0,
}

const muted = {
  fontFamily: typography.fontFamily,
  fontSize: 22,
  lineHeight: 1.5,
  color: stage.muted,
  margin: 0,
}

const Bullets = ({ items }) => (
  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <span style={{
          flexShrink: 0, width: 10, height: 10, borderRadius: 99,
          background: stage.accent, marginTop: 18,
        }} />
        <span style={body}>{item}</span>
      </li>
    ))}
  </ul>
)

const Stat = ({ value, label }) => (
  <div style={{
    background: stage.card, border: `1px solid ${stage.rule}`, borderRadius: 12,
    padding: '32px 28px', flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    <p style={{ ...titleFont, fontSize: 64, lineHeight: 1, margin: 0 }}>{value}</p>
    <p style={{ ...muted, fontSize: 20 }}>{label}</p>
  </div>
)

const SlideHeader = ({ eyebrowText, title }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
    {eyebrowText && <p style={eyebrow}>{eyebrowText}</p>}
    <h2 style={{ ...titleFont, fontSize: 52, lineHeight: 1.1, margin: 0 }}>{title}</h2>
  </div>
)

// Event date — anchored to the May 14, 2026 leadership review.
// Not derived from `new Date()` because it represents the calendar date of
// the talk itself, not "today".
const EVENT_DATE = 'May 14, 2026'

function SlideTitle() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center', height: '100%' }}>
      <p style={eyebrow}>Product & Design Leadership Review</p>
      <h1 style={{ ...titleFont, fontSize: 84, lineHeight: 1.05, margin: 0 }}>
        Management hub migration<br/>to SSR and RxN
      </h1>
      <p style={{ ...body, fontSize: 30, color: stage.muted }}>{EVENT_DATE}</p>
    </div>
  )
}

const ScreenshotCard = ({ src, label }) => {
  const [errored, setErrored] = useState(false)
  const openLightbox = useContext(LightboxCtx)
  const canOpen = !errored
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: stage.card,
      border: `1px solid ${stage.rule}`,
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    }}>
      <button
        type="button"
        onClick={canOpen ? () => openLightbox({ src, label }) : undefined}
        disabled={!canOpen}
        style={{
          flex: 1, minHeight: 0, background: '#F4F5F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          padding: 0, border: 0,
          cursor: canOpen ? 'zoom-in' : 'default',
          width: '100%',
        }}
        title={canOpen ? 'Click to view larger' : undefined}
      >
        {errored ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <p style={{ ...muted, fontSize: 14, margin: 0 }}>Drop screenshot at</p>
            <p style={{
              ...body, fontSize: 13, margin: '4px 0 0',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: stage.accent,
            }}>{src.replace(import.meta.env.BASE_URL, '')}</p>
          </div>
        ) : (
          <img
            src={src}
            alt={label}
            onError={() => setErrored(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        )}
      </button>
      <p style={{
        ...muted, fontSize: 16, padding: '10px 12px', textAlign: 'center',
        borderTop: `1px solid ${stage.rule}`, margin: 0, fontWeight: 600, color: stage.ink,
      }}>{label}</p>
    </div>
  )
}

function SlideToday() {
  // Screenshots live in public/mgmt-hub-deck/ and are served at <BASE_URL>mgmt-hub-deck/*.
  // The slide falls back to a labeled placeholder if an image is missing.
  const base = import.meta.env.BASE_URL
  return (
    <div>
      <SlideHeader eyebrowText="Current state" title={`What /provider-profile is today`} />
      <div style={{ display: 'flex', gap: 32, alignItems: 'stretch', height: 'calc(100% - 110px)' }}>
        <div style={{ flex: '0 0 46%', minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <Bullets items={[
            "A legacy Django web page serving two audiences — prospective sitters in SSU, existing sitters in the Management hub.",
            "Embedded inside the mobile apps as a web view, on top of a stack that's hard to iterate on.",
            "Some order exists, but it gets messy — sitters can't find simple things (editing your address is buried inside Basic info), and the section order zigzags (pet sitting → training → pet sitting again).",
            "Modules underneath are owned by multiple teams across the org, so we can't migrate them in one go.",
          ]} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 16 }}>
          <ScreenshotCard src={`${base}mgmt-hub-deck/mgmt-hub.png`} label="Existing sitters · Management hub" />
          <ScreenshotCard src={`${base}mgmt-hub-deck/ssu.png`} label="Prospective sitters · SSU" />
        </div>
      </div>
    </div>
  )
}

function SlideOwnership() {
  // Grouping mirrors the proposed Mgmt hub IA so this slide also
  // previews the structure we land on later.
  const groups = [
    {
      header: 'Service settings & profile',
      modules: [
        { name: 'Service settings', owner: 'Sitter Experience' },
        { name: 'Profile · Details', owner: 'Sitter Experience' },
        { name: 'Profile · Photos', owner: 'Sitter Experience' },
        { name: 'Profile · Your pets', owner: 'Sitter Experience' },
        { name: 'Profile · Testimonials', owner: 'Sitter Experience' },
      ],
    },
    {
      header: 'User & Account info',
      modules: [
        { name: 'Basic info', owner: 'TSO' },
        { name: 'Phone numbers', owner: 'TSO' },
        { name: 'Background check', owner: 'TSO' },
        { name: 'Survey / quiz', owner: 'TSO' },
      ],
    },
    {
      header: 'Business',
      modules: [
        { name: 'Sitter insights', owner: 'Sitter Experience' },
        { name: 'Calendar', owner: 'Sitter Experience' },
        { name: 'Payments', owner: 'Payments' },
        { name: 'Payouts', owner: 'Payments' },
        { name: 'Promote', owner: 'Growth' },
        { name: 'Stop providing services', owner: 'Sitter Experience' },
      ],
    },
  ]
  return (
    <div>
      <SlideHeader eyebrowText="Module ownership" title="Why we migrate the shell, not the modules" />
      <p style={{ ...body, fontSize: 24, color: stage.muted, marginBottom: 24, maxWidth: 1200 }}>
        Module ownership is distributed across the org. M1 ships the shell (IA, nav, visual) and
        leaves each module to the team that owns it — keeping blast radius small.
      </p>
      <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
        {groups.map(({ header, modules }) => (
          <div key={header} style={{
            flex: 1, minWidth: 0, padding: 22, borderRadius: 12,
            background: stage.card, border: `1px solid ${stage.rule}`,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <p style={{ ...eyebrow, fontSize: 14, color: stage.accent }}>{header}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modules.map(({ name, owner }) => (
                <div key={name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12,
                }}>
                  <span style={{ ...body, fontSize: 18, fontWeight: 600 }}>{name}</span>
                  <span style={{ ...muted, fontSize: 14 }}>{owner}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideNumbers() {
  return (
    <div>
      <SlideHeader eyebrowText="By the numbers" title="One of the most-visited sitter surfaces" />
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <Stat value="125k" label="weekly unique visits to /provider-profile" />
        <Stat value="#1" label="Service settings — the most-visited module on the page" />
        <Stat value="#2 / #3" label="Account info and Profile details follow" />
        <Stat value="60%" label="of unmigrated eyeballs sit under Sitter Experience surfaces" />
      </div>
    </div>
  )
}

function SlideMilestones() {
  const milestones = [
    {
      tag: 'M1 — this work',
      title: 'Migrate the Management hub shell',
      desc: 'Move the wrapper page from legacy Django web to SSR + RxN. Modules stay unchanged — they keep their current implementations and rendering.',
      accent: true,
    },
    {
      tag: 'M2+',
      title: 'Migrate individual modules',
      desc: 'In partnership with each owning team, sequentially port each module behind the new shell.',
    },
    {
      tag: 'Later',
      title: 'Rethink the SSU experience',
      desc: 'Decouple SSU from /provider-profile entirely and shorten the flow to better nurture new sitters into top providers.',
    },
  ]
  return (
    <div>
      <SlideHeader eyebrowText="Migration milestones" title="From legacy Django to SSR + RxN, in phases" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        {milestones.map(({ tag, title, desc, accent }) => (
          <div key={tag} style={{
            padding: '20px 24px', borderRadius: 12,
            background: stage.card,
            border: `1px solid ${accent ? stage.accent : stage.rule}`,
            borderLeft: `6px solid ${accent ? stage.accent : stage.rule}`,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <p style={{
              ...muted, fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: accent ? stage.accent : stage.muted, margin: 0,
            }}>{tag}</p>
            <p style={{ ...body, fontWeight: 700, fontSize: 24 }}>{title}</p>
            <p style={{ ...muted, fontSize: 20 }}>{desc}</p>
          </div>
        ))}
      </div>
      <div style={{ paddingTop: 18, borderTop: `1px solid ${stage.rule}` }}>
        <p style={{ ...eyebrow, fontSize: 14, color: stage.accent, marginBottom: 10 }}>Why SSR + RxN matters</p>
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ flex: 1 }}>
            <p style={{ ...body, fontWeight: 700, fontSize: 18 }}>Better IA</p>
            <p style={{ ...muted, fontSize: 16 }}>Unlocks the grouping we need to fix the "long list" problem.</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ ...body, fontWeight: 700, fontSize: 18 }}>Newer UI</p>
            <p style={{ ...muted, fontSize: 16 }}>Modern visual system, consistent with the rest of the migrated surfaces.</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ ...body, fontWeight: 700, fontSize: 18 }}>Native in-app nav</p>
            <p style={{ ...muted, fontSize: 16 }}>Drilling into a screen and pressing back no longer closes the web view.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SlideIA() {
  const groups = [
    {
      label: 'Service settings & profile',
      desc: 'Everything pet parents see — the public-facing shop window.',
      modules: ['Service settings', 'Profile details', 'Photos', 'Your pets', 'Testimonials'],
    },
    {
      label: 'User & Account info',
      desc: 'Identity, contact, and trust — required to operate on Rover.',
      modules: ['Basic info', 'Phone numbers', 'Background check', 'Survey / quiz'],
    },
    {
      label: 'Business',
      desc: 'Running your business — money, calendar, growth, the off switch.',
      modules: ['Sitter insights', 'Calendar', 'Payments', 'Payouts', 'Promote', 'Stop providing services'],
    },
  ]
  return (
    <div>
      <SlideHeader eyebrowText="Mgmt hub design" title="New information architecture" />
      <p style={{ ...body, fontSize: 24, color: stage.muted, marginBottom: 28, maxWidth: 1200 }}>
        Three clear groups replace the single flat list. Each group has a purpose a sitter can recognize at a glance.
      </p>
      <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
        {groups.map(({ label, desc, modules }, idx) => (
          <div key={label} style={{
            flex: 1, minWidth: 0, padding: 24, borderRadius: 12,
            background: stage.card, border: `1px solid ${stage.rule}`,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 99,
              background: stage.accent, color: stage.card,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 20,
            }}>{idx + 1}</div>
            <p style={{ ...body, fontWeight: 700, fontSize: 22 }}>{label}</p>
            <p style={{ ...muted, fontSize: 17 }}>{desc}</p>
            <div style={{ height: 1, background: stage.rule, margin: '4px 0' }} />
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {modules.map((m) => (
                <li key={m} style={{ ...muted, fontSize: 16, color: stage.ink }}>· {m}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideDesignChanges() {
  const changes = [
    {
      t: 'More relevant grouping',
      d: 'Service settings & profile · User & Account info · Business — groups that match how sitters actually think about their account.',
    },
    {
      t: 'Stronger "needs attention" affordance',
      d: 'Incomplete or required fields surface at the module level — making it obvious what to do next, instead of buried inside.',
    },
    {
      t: 'Built on Kibble components',
      d: 'The new shell uses our design system end-to-end — consistent with the rest of the migrated surfaces, faster to iterate.',
    },
  ]
  const moves = [
    'Expansion services now sit below Pet sitting (instead of zigzagging in the middle of the list).',
    'Craigslist module is removed — long-tail usage with no measurable funnel impact.',
    '"View profile" is split into contextual entry points, instead of one global access at the top.',
  ]
  return (
    <div>
      <SlideHeader eyebrowText="Mgmt hub design" title="Key changes vs. today" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 22 }}>
        {changes.map(({ t, d }) => (
          <div key={t} style={{
            padding: '20px 24px', borderRadius: 12,
            background: stage.card, border: `1px solid ${stage.rule}`,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <p style={{ ...body, fontWeight: 700, fontSize: 22 }}>{t}</p>
            <p style={{ ...muted, fontSize: 18 }}>{d}</p>
          </div>
        ))}
      </div>
      <div style={{
        padding: '20px 24px', borderRadius: 12,
        background: stage.card, border: `1px solid ${stage.rule}`,
        borderLeft: `6px solid ${stage.accent}`,
      }}>
        <p style={{ ...eyebrow, fontSize: 14, color: stage.accent, marginBottom: 12 }}>What's moving</p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {moves.map((m) => (
            <li key={m} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, marginTop: 12,
                width: 6, height: 6, borderRadius: 99, background: stage.accent,
              }} />
              <span style={{ ...body, fontSize: 20 }}>{m}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SlideDemo() {
  // Live demo: prototype iframe (left, phone) + Figma embed (right, rectangle).
  // Each has its own "Open full" affordance to break out into a new tab.
  const protoSrc = 'https://bernardoprudencio.github.io/prototype/#/service-settings'
  const figmaFrameUrl = 'https://www.figma.com/design/x1xUx02kgeKrRgSeVXF7bV/-UX2-2136--Provider-settings?node-id=6-17693'
  const figmaEmbedSrc = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(figmaFrameUrl)}`
  const [reloadKey, setReloadKey] = useState(0)

  const openBtn = (href, label) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      style={{
        background: stage.card,
        border: `1px solid ${stage.rule}`,
        borderRadius: 99,
        padding: '8px 18px',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 16,
        color: stage.ink, textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>↗</span>
      {label}
    </a>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 20 }}>
      <div>
        <p style={eyebrow}>Live demo</p>
        <h2 style={{ ...titleFont, fontSize: 44, lineHeight: 1.1, margin: '6px 0 0' }}>
          Prototype on the left, Figma frame on the right
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 36, flex: 1, minHeight: 0, alignItems: 'stretch' }}>
        {/* Prototype column */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 360,
            height: 720,
            background: '#1F2124',
            borderRadius: 36, overflow: 'hidden',
            border: '10px solid #1F2124',
            boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
          }}>
            <iframe
              key={reloadKey}
              src={protoSrc}
              title="Service settings prototype"
              style={{
                width: '100%', height: '100%',
                border: 0, background: '#fff', display: 'block',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setReloadKey(k => k + 1)}
              style={{
                background: stage.card,
                border: `1px solid ${stage.rule}`,
                borderRadius: 99,
                padding: '8px 16px',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 16,
                color: stage.ink, cursor: 'pointer',
              }}
              title="Reload the prototype without restarting the deck"
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>↻</span>
              Reload
            </button>
            {openBtn(protoSrc, 'Open full')}
          </div>
        </div>

        {/* Figma column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          <div style={{
            flex: 1, minHeight: 0,
            background: stage.card,
            borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${stage.rule}`,
            boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
          }}>
            <iframe
              src={figmaEmbedSrc}
              title="Mgmt hub Figma frame"
              allowFullScreen
              style={{
                width: '100%', height: '100%',
                border: 0, display: 'block',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {openBtn(figmaFrameUrl, 'Open in Figma')}
          </div>
        </div>
      </div>
    </div>
  )
}

function SlideGTMAsk() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', gap: 32 }}>
      <p style={eyebrow}>Go-to-market — rollout</p>
      <h1 style={{ ...titleFont, fontSize: 72, lineHeight: 1.1, margin: 0, maxWidth: 1200 }}>
        Roll it out progressively.<br/>
        <span style={{ color: stage.accent }}>No A/B test.</span>
      </h1>
      <div style={{ display: 'flex', gap: 20, maxWidth: 1200 }}>
        <div style={{
          flex: 1, padding: '20px 24px', borderRadius: 12,
          background: stage.card, border: `1px solid ${stage.rule}`,
        }}>
          <p style={{ ...body, fontWeight: 700, fontSize: 22 }}>Web first, then apps</p>
          <p style={{ ...muted, fontSize: 18, marginTop: 6 }}>
            The smaller surface goes first. We watch it in production, fix anything we find, and only then expose the 80% of traffic that's in-app.
          </p>
        </div>
        <div style={{
          flex: 1, padding: '20px 24px', borderRadius: 12,
          background: stage.card, border: `1px solid ${stage.rule}`,
        }}>
          <p style={{ ...body, fontWeight: 700, fontSize: 22 }}>De-risked before launch</p>
          <p style={{ ...muted, fontSize: 18, marginTop: 6 }}>
            Unmoderated UserTesting pass on the new hub before we cut traffic. Catches usability regressions A/B can't.
          </p>
        </div>
      </div>
    </div>
  )
}

function SlideDeRisk() {
  const Card = ({ eyebrowText, title, children, accent }) => (
    <div style={{
      padding: '22px 24px', borderRadius: 12,
      background: stage.card,
      border: `1px solid ${accent ? stage.accent : stage.rule}`,
      borderLeft: `6px solid ${accent ? stage.accent : stage.rule}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <p style={{ ...eyebrow, fontSize: 14, color: stage.accent }}>{eyebrowText}</p>
      <p style={{ ...body, fontWeight: 700, fontSize: 22 }}>{title}</p>
      {children}
    </div>
  )
  return (
    <div>
      <SlideHeader eyebrowText="Plan & alternatives" title="What supports the no-A/B call" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card eyebrowText="Pre-launch" title="Unmoderated UserTesting">
          <p style={{ ...muted, fontSize: 18 }}>
            Existing sitters complete top tasks (edit service settings, find payouts, update profile). We watch for findability and confusion before we ship.
          </p>
          <p style={{ ...muted, fontSize: 16, color: stage.accent, fontWeight: 600 }}>
            Decision criteria: any task with &gt;1 fail blocks rollout until fixed.
          </p>
        </Card>
        <Card eyebrowText="Post-launch monitoring" title="Per-module traffic + task completion">
          <p style={{ ...muted, fontSize: 18 }}>
            Watch every module's traffic to catch visibility drops — especially for lower-volume modules like training and grooming.
          </p>
          <p style={{ ...muted, fontSize: 18 }}>
            Track completion on the top tasks named in the 1P (edit service settings, edit profile, edit payment methods).
          </p>
        </Card>
        <Card eyebrowText="Rollout shape" title="Web first, Apps second" accent>
          <p style={{ ...muted, fontSize: 18 }}>
            Ship to web first, then apps. Lets us catch issues on the smaller surface before exposing the bigger one.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...titleFont, fontSize: 36, lineHeight: 1, color: stage.accent }}>20%</span>
              <span style={{ ...muted, fontSize: 14 }}>of /provider-profile traffic is web</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...titleFont, fontSize: 36, lineHeight: 1 }}>80%</span>
              <span style={{ ...muted, fontSize: 14 }}>is in-app — the bigger blast radius</span>
            </div>
          </div>
        </Card>
        <Card eyebrowText="Considered & discarded" title="Split tech migration from UI improvement">
          <p style={{ ...muted, fontSize: 18 }}>
            We considered shipping the SSR + RxN migration first with no IA changes, then a second rollout for the redesign.
          </p>
          <p style={{ ...muted, fontSize: 16, color: stage.accent, fontWeight: 600 }}>
            Rejected: ~2× the work for the same end result, since both pass through the same surface.
          </p>
        </Card>
      </div>
    </div>
  )
}

function SlideWhatWeNeed() {
  return (
    <div>
      <SlideHeader eyebrowText="What we need from you" title="The ask" />
      <div style={{
        padding: '24px 28px', borderRadius: 12,
        background: stage.card,
        border: `2px solid ${stage.accent}`,
        marginBottom: 28, maxWidth: 1280,
      }}>
        <p style={{ ...body, fontSize: 30, fontWeight: 700 }}>
          Feedback on the progressive roll-out approach — Web first, Apps second, no A/B test.
        </p>
      </div>
      <Bullets items={[
        "Greenlight the unmoderated UserTesting plan as our pre-launch validation.",
        "Align on the monitoring metrics that would trigger a rollback (per-module traffic + key task completion).",
      ]} />
    </div>
  )
}

const SLIDES = [
  SlideTitle,
  SlideToday,
  SlideOwnership,
  SlideNumbers,
  SlideMilestones,
  SlideIA,
  SlideDesignChanges,
  SlideDemo,
  SlideGTMAsk,
  SlideDeRisk,
  SlideWhatWeNeed,
]

export default function MgmtHubDeckScreen({ onClose }) {
  const [i, setI] = useState(0)
  const [scale, setScale] = useState(1)
  const [lightbox, setLightbox] = useState(null)
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
      if (e.key === 'Escape') {
        if (lightbox) setLightbox(null)
        else onClose?.()
        return
      }
      if (lightbox) return
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
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, total, lightbox])

  const next = () => setI((n) => Math.min(n + 1, total - 1))
  const prev = () => setI((n) => Math.max(n - 1, 0))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: stage.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: typography.fontFamily,
    }}>
      <div style={{
        flexShrink: 0, padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: 'rgba(255,255,255,0.7)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}>
          MANAGEMENT HUB MIGRATION · LEADERSHIP REVIEW
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
          <LightboxCtx.Provider value={setLightbox}>
            <Slide />
          </LightboxCtx.Provider>
        </div>
      </div>

      <div style={{
        flexShrink: 0, padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <button onClick={prev} disabled={i === 0} style={navBtn(i === 0)}>← Prev</button>
        <button onClick={next} disabled={i === total - 1} style={navBtn(i === total - 1)}>Next →</button>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(5, 8, 16, 0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 48, zIndex: 10,
            cursor: 'zoom-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            }}
          >
            <img
              src={lightbox.src}
              alt={lightbox.label}
              style={{
                maxWidth: '90vw', maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 12,
                boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
                background: '#fff',
              }}
            />
            <p style={{
              ...muted, color: 'rgba(255,255,255,0.85)', fontSize: 16, margin: 0, fontWeight: 600,
            }}>{lightbox.label}</p>
          </div>
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'rgba(255,255,255,0.92)',
              padding: '8px 16px', borderRadius: 99,
              fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Close · Esc
          </button>
        </div>
      )}
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
