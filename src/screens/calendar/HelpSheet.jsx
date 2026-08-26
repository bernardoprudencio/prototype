import React from 'react'
import { colors, textStyles } from '../../tokens'
import { HELP } from '../../data/calendarCopy'
import Button from '../../components/Button'
import CalendarLegendContent from './CalendarLegendContent'
import CalendarPanelShell from './CalendarPanelShell'

/**
 * Port of `components/NewCalendarHelpSheet.tsx` — the merged help surface the
 * header's Help icon opens.
 *
 * Source: roverdotcom/web @ origin/ai-pilot-web-calendar
 *   .../NewCalendarPage/components/NewCalendarHelpSheet.tsx
 *
 * Four blocks in one order (`:48-87`): the beta welcome paragraph, a "What's
 * new" heading over three bullets, `CalendarLegendContent` — which carries the
 * two instruction paragraphs *and* the colour legend — and a feedback
 * paragraph with an inline mailto. The footer is a single full-width primary
 * "Got it".
 *
 * The `maxHeight` body cap and the modal/sheet fork both live in
 * `CalendarPanelShell`, which is where the POC's three copies of that chrome
 * converge.
 */
export default function HelpSheet({ isOpen, onClose }) {
  return (
    <CalendarPanelShell
      isOpen={isOpen}
      title={HELP.title}
      onClose={onClose}
      footer={(
        <Button variant="primary" size="small" fullWidth ariaLabel={HELP.dismiss} onClick={onClose}>
          {HELP.dismiss}
        </Button>
      )}
    >
      <p style={{ ...textStyles.paragraph200, color: colors.primary, margin: '0 0 24px' }}>
        {HELP.betaBody}
      </p>
      <h3 style={{ ...textStyles.heading200, color: colors.primary, margin: '0 0 12px' }}>
        {HELP.whatsNew}
      </h3>
      {/* `paddingLeft: '1.25rem'` (:70) — the POC keeps the native list
          markers and only pulls the indent in. */}
      <ul style={{ paddingLeft: '1.25rem', margin: '0 0 24px' }}>
        {HELP.bullets.map((bullet) => (
          <li key={bullet} style={{ ...textStyles.text200, color: colors.primary }}>
            {bullet}
          </li>
        ))}
      </ul>
      <CalendarLegendContent />
      <p style={{ ...textStyles.paragraph200, color: colors.primary, margin: '24px 0 0' }}>
        {HELP.feedbackLead}
        <a href={`mailto:${HELP.feedbackEmail}`} style={{ color: colors.link }}>
          {HELP.feedbackEmail}
        </a>
        {HELP.feedbackTail}
      </p>
    </CalendarPanelShell>
  )
}
