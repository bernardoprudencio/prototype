import React, { useEffect, useMemo, useState } from 'react'
import { colors, radius, spacing, textStyles } from '../../tokens'
import { useApp } from '../../context/AppContext'
import { SETTINGS } from '../../data/calendarCopy'
import {
  CALENDAR_SETTINGS_SERVICES, SETTINGS_DAY_KEYS, SETTINGS_OVERRIDE_KEYS,
} from '../../data/calendarData'
import { ChevronDownIcon, ChevronUpIcon } from '../../assets/icons'
import Button from '../../components/Button'
import Chip from '../../components/Chip'
import Select from '../../components/Select'
import Stepper from '../../components/Stepper'
import SwitchField from '../../components/SwitchField'
import { CAL_COLORS } from './calendarTheme'
import CalendarPanelShell from './CalendarPanelShell'

/**
 * Port of `components/AvailabilitySettingsPanel.tsx` — the sitter's standing
 * per-service availability rules, as opposed to the day-level edits the
 * calendar grid makes.
 *
 * Source: roverdotcom/web @ origin/ai-pilot-web-calendar
 *   .../NewCalendarPage/components/AvailabilitySettingsPanel.tsx
 *
 * The behaviour worth preserving is the draft model (`:380-470`). Every control
 * writes into `localOverrides`, keyed by service slug and holding **only** the
 * keys that differ from what the server sent — nothing PATCHes per interaction.
 * Save then fires one request per genuinely-changed service, in parallel;
 * successes splice into the cache, failures stay as drafts so the sitter's
 * typing is never thrown away, and the panel only closes once nothing failed.
 * That is why `saveError` and the panel staying open are one behaviour, not two.
 *
 * `useAccordion = services.length > 2` (`:508`): with one or two services the
 * cards all render open and lose their chevrons, because collapsing two things
 * costs more than it saves. Above that, one card is open at a time and the
 * first service starts expanded.
 *
 * The prototype's "request" is synchronous, so failure has to be asked for: the
 * `calendarSaveFails` dev flag makes every service fail, which is what exercises
 * the drafts-survive-a-failure path. Committed values live in
 * `AppContext.calendarServiceSettings`, the analogue of the POC's query cache.
 */

// `OVERNIGHT_SLUGS` + `LEAD_TIME_OPTIONS` (:127-142). Overnight services can
// ask for up to two weeks of notice; daytime ones stop at a week.
const OVERNIGHT_SLUGS = new Set(['overnight-boarding', 'overnight-traveling'])
const OVERNIGHT_LEAD_DAYS = [0, 1, 2, 3, 7, 14]
const DAYTIME_LEAD_DAYS = [0, 1, 2, 3, 5, 7]

// `leadTimeLabel` (:113-121).
function leadTimeLabel(days) {
  if (days === 0) return SETTINGS.leadTimeSameDay
  if (days === 1) return SETTINGS.leadTimeOneDay
  if (days === 7) return SETTINGS.leadTimeOneWeek
  if (days === 14) return SETTINGS.leadTimeTwoWeeks
  return SETTINGS.leadTimeDays(days)
}

function leadTimeOptions(slug) {
  const days = OVERNIGHT_SLUGS.has(slug) ? OVERNIGHT_LEAD_DAYS : DAYTIME_LEAD_DAYS
  return days.map((d) => ({ value: String(d), label: leadTimeLabel(d) }))
}

// `diffFromServer` (:432-447) — narrows a draft to the keys that actually moved,
// so an untouched service is never PATCHed and a toggled-and-untoggled one is
// treated as untouched.
function diffFromServer(server, draft) {
  const out = {}
  SETTINGS_OVERRIDE_KEYS.forEach((key) => {
    if (draft[key] !== undefined && draft[key] !== server[key]) out[key] = draft[key]
  })
  return out
}

function ServiceControls({ service, onChange }) {
  const {
    serviceSlug: slug, serviceTitle: name,
    canUpdateAcceptingRecurringClients: canRecur, spacesAvailableText,
  } = service

  const selectedDays = SETTINGS_DAY_KEYS.filter((d) => service[d])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SwitchField
        primaryLabel={SETTINGS.away}
        secondaryLabel={SETTINGS.awayBody}
        useBoldPrimaryLabel
        checked={service.isAway}
        id={`${slug}-away`}
        onChange={(next) => onChange({ isAway: next })}
      />

      {/* `:213-262` — a service that supports recurring clients splits the one
          switch into two; the rest keep the single "New customers" row with its
          own body copy. */}
      {canRecur ? (
        <>
          <SwitchField
            primaryLabel={SETTINGS.oneTime}
            useBoldPrimaryLabel
            checked={service.isAcceptingNewCustomers}
            id={`${slug}-one-time`}
            onChange={(next) => onChange({ isAcceptingNewCustomers: next })}
          />
          <SwitchField
            primaryLabel={SETTINGS.weekly}
            useBoldPrimaryLabel
            checked={service.isAcceptingNewRecurringClients}
            id={`${slug}-weekly`}
            onChange={(next) => onChange({ isAcceptingNewRecurringClients: next })}
          />
        </>
      ) : (
        <SwitchField
          primaryLabel={SETTINGS.newCustomers}
          secondaryLabel={SETTINGS.newCustomersBody}
          useBoldPrimaryLabel
          checked={service.isAcceptingNewCustomers}
          id={`${slug}-new-customers`}
          onChange={(next) => onChange({ isAcceptingNewCustomers: next })}
        />
      )}

      {/* `:265-288` — the stepper only exists for services that can hold more
          than one booking at a time, and `spacesAvailableText` is the server's
          own way of saying so. */}
      {spacesAvailableText && (
        <div>
          <div style={{ ...textStyles.text100Semibold, color: colors.primary, marginBottom: 4 }}>
            {SETTINGS.spacesAvailable}
          </div>
          <div style={{ ...textStyles.paragraph100, color: colors.tertiary, marginBottom: 8 }}>
            {spacesAvailableText}
          </div>
          <Stepper
            value={service.spacesAvailable}
            minValue={0}
            maxValue={99}
            onDecrement={() => onChange({ spacesAvailable: service.spacesAvailable - 1 })}
            onIncrement={() => onChange({ spacesAvailable: service.spacesAvailable + 1 })}
          />
        </div>
      )}

      {/* `:290-320` — seven single-letter chips, Monday-first, multi-select.
          `selectedIcon={null}` in the POC: a checkmark inside a one-letter chip
          would push the letter out, so selection reads from the fill alone. */}
      <div>
        <div style={{ ...textStyles.text100Semibold, color: colors.primary, marginBottom: 4 }}>
          {SETTINGS.dailyAvailability}
        </div>
        <div style={{ ...textStyles.paragraph100, color: colors.tertiary, marginBottom: 8 }}>
          {SETTINGS.dailyPrompt}
        </div>
        <div role="group" aria-label={SETTINGS.dailyAvailability} style={{ display: 'flex', gap: 4 }}>
          {SETTINGS_DAY_KEYS.map((day) => (
            <div key={day} role="checkbox" aria-checked={!!service[day]} aria-label={day}>
              <Chip
                label={SETTINGS.dayLetters[day]}
                size="small"
                selected={!!service[day]}
                onClick={() => onChange({ [day]: !service[day] })}
              />
            </div>
          ))}
        </div>
        {selectedDays.length === 0 && (
          <div style={{ ...textStyles.paragraph100, color: colors.destructive, marginTop: 4 }}>
            {SETTINGS.dailyError}
          </div>
        )}
      </div>

      <Select
        label={SETTINGS.leadTime}
        id={`${slug}-lead-time`}
        ariaLabel={SETTINGS.leadTimeFor(name)}
        value={String(service.leadTimeDays)}
        options={leadTimeOptions(slug)}
        placeholder={SETTINGS.leadTimePlaceholder}
        onChange={(next) => onChange({ leadTimeDays: Number(next) })}
      />
    </div>
  )
}

export default function AvailabilitySettingsPanel({ isOpen, onClose }) {
  const { calendarServiceSettings, commitCalendarServiceSettings, calendarSaveFails } = useApp()

  const [drafts, setDrafts] = useState({})
  const [saveError, setSaveError] = useState(false)
  const [expanded, setExpanded] = useState(CALENDAR_SETTINGS_SERVICES[0]?.serviceSlug ?? null)

  // `:398-404` — drafts are abandoned on close, so reopening always shows the
  // committed state rather than a stale half-edit.
  useEffect(() => {
    if (isOpen) return
    setDrafts({})
    setSaveError(false)
    setExpanded(CALENDAR_SETTINGS_SERVICES[0]?.serviceSlug ?? null)
  }, [isOpen])

  // The committed layer stands in for the POC's query cache; drafts sit above it.
  const server = useMemo(() => CALENDAR_SETTINGS_SERVICES.map((svc) => ({
    ...svc, ...calendarServiceSettings[svc.serviceSlug],
  })), [calendarServiceSettings])

  const services = server.map((svc) => ({ ...svc, ...drafts[svc.serviceSlug] }))

  // `hasInvalidDays` (:456-461) — a service with no days is not saveable, and
  // the gate is panel-wide because Save is panel-wide.
  const hasInvalidDays = services.some((svc) => SETTINGS_DAY_KEYS.every((d) => !svc[d]))

  const useAccordion = services.length > 2

  const patchDraft = (slug, patch) => {
    setDrafts((prev) => ({ ...prev, [slug]: { ...prev[slug], ...patch } }))
    setSaveError(false)
  }

  const handleSave = () => {
    const failed = {}
    let anyFailed = false

    server.forEach((base, i) => {
      const diff = diffFromServer(base, services[i])
      if (Object.keys(diff).length === 0) return
      if (calendarSaveFails) {
        // The POC keeps a failed service's draft so nothing typed is lost.
        failed[base.serviceSlug] = drafts[base.serviceSlug]
        anyFailed = true
        return
      }
      commitCalendarServiceSettings(base.serviceSlug, diff)
    })

    setDrafts(failed)
    setSaveError(anyFailed)
    if (!anyFailed) onClose()
  }

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* `:620-628` — the error sits directly above the buttons that produced
          it, and is announced. */}
      {saveError && (
        <div role="alert" style={{ ...textStyles.paragraph100, color: colors.destructive }}>
          {SETTINGS.saveError}
        </div>
      )}
      <Button
        variant={hasInvalidDays ? 'disabled' : 'primary'}
        size="small"
        fullWidth
        ariaLabel={SETTINGS.saveAria}
        onClick={hasInvalidDays ? undefined : handleSave}
      >
        {SETTINGS.save}
      </Button>
      <Button variant="flat" size="small" fullWidth ariaLabel={SETTINGS.discardAria} onClick={onClose}>
        {SETTINGS.close}
      </Button>
    </div>
  )

  return (
    <CalendarPanelShell isOpen={isOpen} title={SETTINGS.title} onClose={onClose} footer={footer}>
      {services.length === 0 ? (
        <p style={{ ...textStyles.paragraph200, color: colors.secondary, margin: 0 }}>
          {SETTINGS.noServices}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {services.map((svc) => {
            const open = !useAccordion || expanded === svc.serviceSlug
            return (
              <section
                key={svc.serviceSlug}
                style={{
                  border: `1px solid ${CAL_COLORS.border}`,
                  borderRadius: radius.primary,
                  padding: spacing.md,
                }}
              >
                {useAccordion ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setExpanded(open ? null : svc.serviceSlug)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', gap: 8, padding: 0,
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ ...textStyles.text200Semibold, color: colors.primary }}>
                      {svc.serviceTitle}
                    </span>
                    {open
                      ? <ChevronUpIcon size={20} color={colors.link} />
                      : <ChevronDownIcon size={20} color={colors.link} />}
                  </button>
                ) : (
                  <h3 style={{ ...textStyles.text200Semibold, color: colors.primary, margin: 0 }}>
                    {svc.serviceTitle}
                  </h3>
                )}
                {open && (
                  <div style={{ marginTop: 12 }}>
                    <ServiceControls
                      service={svc}
                      onChange={(patch) => patchDraft(svc.serviceSlug, patch)}
                    />
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </CalendarPanelShell>
  )
}
