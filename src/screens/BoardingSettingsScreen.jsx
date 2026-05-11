import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, typography, textStyles } from '../tokens'
import { BackIcon } from '../assets/icons'
import RadioRow from '../components/RadioRow'
import Chip from '../components/Chip'
import Button from '../components/Button'
import { BOARDING_SETTINGS, CANCELLATION_POLICY_OPTIONS } from '../data/sitterProfile'

// ─── Local switch ────────────────────────────────────────────────────────────
// Mobile iOS-style toggle. Track + thumb, color-shifts on the `on` state.
// Sized to match Kibble StatusSwitch in roverdotcom/web.
const Switch = ({ on, onChange }) => (
  <div
    role="switch"
    aria-checked={on}
    onClick={() => onChange?.(!on)}
    style={{
      width: 44,
      height: 26,
      borderRadius: 99999,
      background: on ? colors.success : colors.borderInteractive,
      position: 'relative',
      flexShrink: 0,
      cursor: 'pointer',
      transition: 'background 0.15s',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 2,
        left: on ? 20 : 2,
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: colors.white,
        boxShadow: '0px 1px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.15s',
      }}
    />
  </div>
)

// ─── Section header (h2) ─────────────────────────────────────────────────────
// Matches the "SectionHeader" used in roverdotcom/web ServiceForm sections —
// large heading + thin 1px bottom border to mark the section's start.
const SectionHeader = ({ children }) => (
  <h2
    style={{
      ...textStyles.heading300,
      color: colors.primary,
      margin: 0,
      paddingTop: 32,
      paddingBottom: 12,
      borderBottom: `1px solid ${colors.border}`,
    }}
  >
    {children}
  </h2>
)

// ─── Sub-header (label-style) ────────────────────────────────────────────────
// Mirrors prod's SubHeader.tsx — heading-200 text used to group rows inside a
// section.
const SubHeader = ({ children }) => (
  <div
    style={{
      ...textStyles.heading200,
      color: colors.primary,
      paddingTop: 16,
      paddingBottom: 8,
    }}
  >
    {children}
  </div>
)

const Sublabel = ({ children }) => (
  <span
    style={{
      ...textStyles.text100,
      color: colors.tertiary,
      display: 'block',
      marginTop: 4,
    }}
  >
    {children}
  </span>
)

// ─── Switch row (used by Search Settings + Always available + auto-update) ──
const SwitchRow = ({ label, description, on, onChange }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      paddingTop: 16,
      paddingBottom: 16,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          ...textStyles.text200Semibold,
          color: colors.primary,
        }}
      >
        {label}
      </div>
      {description && <Sublabel>{description}</Sublabel>}
    </div>
    <Switch on={on} onChange={onChange} />
  </div>
)

// ─── Display row (used for read-only-style rows w/ a chevron-ish affordance) ──
const DisplayRow = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      paddingTop: 14,
      paddingBottom: 14,
      borderBottom: `1px solid ${colors.border}`,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...textStyles.text200Semibold, color: colors.primary }}>{label}</div>
    </div>
    <div style={{ ...textStyles.text200, color: colors.tertiary, flexShrink: 0 }}>{value}</div>
  </div>
)

// ─── Stepper (Spaces available) ──────────────────────────────────────────────
const Stepper = ({ value, onChange, min = 1, max = 10 }) => {
  const dec = () => onChange?.(Math.max(min, value - 1))
  const inc = () => onChange?.(Math.min(max, value + 1))
  const baseBtn = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: `2px solid ${colors.borderInteractive}`,
    background: colors.white,
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button type="button" onClick={dec} style={baseBtn} aria-label="Decrease">−</button>
      <span style={{ ...textStyles.text200Semibold, color: colors.primary, minWidth: 16, textAlign: 'center' }}>
        {value}
      </span>
      <button type="button" onClick={inc} style={baseBtn} aria-label="Increase">+</button>
    </div>
  )
}

// Day-of-week chip data; order matches prod (Mon → Sun).
const DAYS = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function BoardingSettingsScreen() {
  const navigate = useNavigate()
  const onBack = () => navigate('/service-settings')

  // Seed local form state from mock; toggles update the visual only.
  const [active, setActive] = useState(BOARDING_SETTINGS.active)
  const [isAway, setIsAway] = useState(BOARDING_SETTINGS.isAway)
  const [newCustomers, setNewCustomers] = useState(BOARDING_SETTINGS.isAcceptingNewCustomers)
  const [recurringClients, setRecurringClients] = useState(
    BOARDING_SETTINGS.isAcceptingNewRecurringClients
  )
  const [dogCareEnabled, setDogCareEnabled] = useState(BOARDING_SETTINGS.dogCareEnabled)
  const [catCareEnabled, setCatCareEnabled] = useState(BOARDING_SETTINGS.petPreferences.cats)
  const [autoUpdateRates, setAutoUpdateRates] = useState(BOARDING_SETTINGS.autoUpdateAdditionalRates)
  const [showAdditionalRates, setShowAdditionalRates] = useState(false)
  const [alwaysAvailable, setAlwaysAvailable] = useState(
    BOARDING_SETTINGS.availabilityPreferences.isAlwaysAvailable
  )
  const [daysOfWeek, setDaysOfWeek] = useState(
    BOARDING_SETTINGS.availabilityPreferences.daysOfWeek
  )
  const [spacesAvailable, setSpacesAvailable] = useState(
    BOARDING_SETTINGS.availabilityPreferences.spacesAvailable
  )
  const [dogSizes, setDogSizes] = useState({
    small: BOARDING_SETTINGS.petPreferences.smallDogs,
    medium: BOARDING_SETTINGS.petPreferences.mediumDogs,
    large: BOARDING_SETTINGS.petPreferences.largeDogs,
    giant: BOARDING_SETTINGS.petPreferences.giantDogs,
  })
  const [cancellationPolicy, setCancellationPolicy] = useState(
    BOARDING_SETTINGS.cancellationPolicy
  )

  const toggleDay = (key) =>
    setDaysOfWeek((d) => ({ ...d, [key]: !d[key] }))
  const toggleDogSize = (key) =>
    setDogSizes((s) => ({ ...s, [key]: !s[key] }))

  const noop = () => {}

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.white,
      }}
    >
      {/* ── Sticky header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 56,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: `1px solid ${colors.border}`,
          background: colors.white,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
          }}
        >
          <BackIcon />
        </button>
        <h1
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 600,
            fontSize: 17,
            lineHeight: 1.25,
            color: colors.primary,
            margin: 0,
          }}
        >
          Boarding Settings
        </h1>
      </div>

      {/* ── Body ── */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 96, // leaves room for the fixed Save footer
        }}
      >
        {/* Service description */}
        <div
          style={{
            ...textStyles.text200,
            color: colors.tertiary,
            paddingTop: 16,
          }}
        >
          {BOARDING_SETTINGS.description}
        </div>

        {/* ── 1. Search Settings ────────────────────────────────────────── */}
        <SectionHeader>Search Settings</SectionHeader>
        <SwitchRow
          label="Active"
          description="New and past pet parents can discover you in search and request to book for this service."
          on={active}
          onChange={setActive}
        />
        <SwitchRow
          label="Away"
          description="If you want to take a break from receiving requests, or if you will be unable to respond for a period of time, mark yourself as Away."
          on={isAway}
          onChange={setIsAway}
        />
        <SwitchRow
          label="New customers"
          description="Receive requests from pet parents you haven't booked with before."
          on={newCustomers}
          onChange={setNewCustomers}
        />
        <SwitchRow
          label="Weekly care for new customers"
          description="Allow new pet parents to book recurring weekly stays."
          on={recurringClients}
          onChange={setRecurringClients}
        />

        {/* ── 2. Pet care ───────────────────────────────────────────────── */}
        <SectionHeader>Pet care</SectionHeader>
        <Sublabel>Select at least one type of pet you want to care for.</Sublabel>
        <SwitchRow label="Dogs" on={dogCareEnabled} onChange={setDogCareEnabled} />
        <SwitchRow label="Cats" on={catCareEnabled} onChange={setCatCareEnabled} />

        {/* ── 3. Rates ──────────────────────────────────────────────────── */}
        <SectionHeader>Rates</SectionHeader>
        <SubHeader>Set your base rate</SubHeader>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            paddingTop: 4,
            paddingBottom: 16,
          }}
        >
          <span style={{ ...textStyles.display400, color: colors.primary }}>
            ${BOARDING_SETTINGS.baseRate}
          </span>
          <span style={{ ...textStyles.text200, color: colors.tertiary }}>
            per {BOARDING_SETTINGS.baseRateUnit}
          </span>
        </div>
        <SwitchRow
          label="Update additional rates automatically"
          description="This automatically updates your additional rates using your base rate."
          on={autoUpdateRates}
          onChange={setAutoUpdateRates}
        />
        <button
          type="button"
          onClick={() => setShowAdditionalRates((v) => !v)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            ...textStyles.link200Semibold,
            color: colors.link,
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          {showAdditionalRates ? 'Hide additional rates' : 'Show additional rates'}
        </button>
        {showAdditionalRates && (
          <div style={{ paddingTop: 8 }}>
            {BOARDING_SETTINGS.additionalRates.map((rate) => (
              <div
                key={rate.slug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  paddingTop: 12,
                  paddingBottom: 12,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>
                      {rate.label}
                    </span>
                    {rate.isNew && (
                      <span
                        style={{
                          ...textStyles.text100Semibold,
                          color: colors.link,
                          background: colors.bgInfo,
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <Sublabel>
                    {rate.isFree
                      ? 'Offered for free'
                      : `$${rate.price} per ${rate.unit}`}
                  </Sublabel>
                </div>
                <Switch on={rate.active} onChange={noop} />
              </div>
            ))}
          </div>
        )}

        {/* ── 4. Availability ───────────────────────────────────────────── */}
        <SectionHeader>Availability</SectionHeader>
        <SwitchRow
          label="Always available"
          description="Pet parents can book you any day of the week."
          on={alwaysAvailable}
          onChange={setAlwaysAvailable}
        />
        <SubHeader>Days available</SubHeader>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 16 }}>
          {DAYS.map((d) => (
            <Chip
              key={d.key}
              label={d.label}
              selected={daysOfWeek[d.key]}
              onClick={() => toggleDay(d.key)}
              size="small"
            />
          ))}
        </div>
        <DisplayRow
          label="Time alone"
          value={`${BOARDING_SETTINGS.preferences.timeAloneHours} hrs`}
        />
        <DisplayRow
          label="Advance notice"
          value={`${BOARDING_SETTINGS.availabilityPreferences.leadTimeHours} hrs`}
        />

        {/* ── 5. About your home ────────────────────────────────────────── */}
        <SectionHeader>About your home</SectionHeader>
        <DisplayRow label="Home" value={BOARDING_SETTINGS.preferences.homeType} />
        <DisplayRow label="Yard" value={BOARDING_SETTINGS.preferences.yardType} />
        <SubHeader>What owners can expect</SubHeader>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 16 }}>
          {BOARDING_SETTINGS.preferences.ownersExpect.map((opt) => (
            <Chip key={opt} label={opt} selected onClick={noop} />
          ))}
        </div>
        <SubHeader>Hosting options</SubHeader>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 16 }}>
          {BOARDING_SETTINGS.preferences.hostingOptions.map((opt) => (
            <Chip key={opt} label={opt} selected onClick={noop} />
          ))}
        </div>

        {/* ── 6. Pet preferences ────────────────────────────────────────── */}
        <SectionHeader>Pet preferences</SectionHeader>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingTop: 16,
            paddingBottom: 16,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...textStyles.text200Semibold, color: colors.primary }}>
              Spaces available
            </div>
            <Sublabel>Number of pets you can host at one time.</Sublabel>
          </div>
          <Stepper value={spacesAvailable} onChange={setSpacesAvailable} />
        </div>
        <SubHeader>Dog sizes</SubHeader>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 16 }}>
          <Chip label="Small (0–15 lbs)" selected={dogSizes.small} onClick={() => toggleDogSize('small')} />
          <Chip label="Medium (16–40 lbs)" selected={dogSizes.medium} onClick={() => toggleDogSize('medium')} />
          <Chip label="Large (41–100 lbs)" selected={dogSizes.large} onClick={() => toggleDogSize('large')} />
          <Chip label="Giant (101+ lbs)" selected={dogSizes.giant} onClick={() => toggleDogSize('giant')} />
        </div>

        {/* ── 7. Cancellation Policy ────────────────────────────────────── */}
        <SectionHeader>Cancellation Policy</SectionHeader>
        {CANCELLATION_POLICY_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            value={opt.value}
            selected={cancellationPolicy}
            onSelect={setCancellationPolicy}
          />
        ))}
        <Sublabel>
          Your selected policy applies to all bookings of this service. Pet parents see this policy
          before they book.
        </Sublabel>
      </div>

      {/* ── Fixed Save footer ───────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          background: colors.white,
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button variant="primary" size="default" onClick={noop}>
          Save
        </Button>
      </div>
    </div>
  )
}
