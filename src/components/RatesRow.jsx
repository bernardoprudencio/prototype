import React from 'react'
import Row from './Row'
import { LockIcon, ChevronRightIcon } from '../assets/icons'
import { colors } from '../tokens'
import { ratesRowCopy, showsPadlock } from '../data/granularRatesCopy'

/**
 * RatesRow — the conversation / booking-details entry point into the rates
 * modal. Title + subtitle per the offer, padlock on `update`/`manage` only,
 * chevron right.
 *
 * Ported from the POC's `ConversationRatesRow.tsx`
 * (01-locked-rates-client-management.md §3.1). Three named offers rather than a
 * description of state, because the row is a way in and not a report: the
 * provider reads it to find out what pressing it will let them do.
 *
 * Built on the shared `Row` primitive — production's row is Kibble's `Row`
 * pattern with a `rightItem`, and this prototype's `Row` is the same shape
 * (bold label, tertiary sublabel, right slot, 56px minimum), so nothing had to
 * be composed by hand.
 *
 * The padlock and the chevron share ONE flex group so both marks line up on the
 * row's right edge. Figma draws no padlock in this node, but the row sits among
 * booking-detail rows that carry no left icon and the padlock is how it reads as
 * a rates row at all — so it shows on the `manage` offer, made to an already-
 * locked client, and stays off the `lock` offer that is offering the lock.
 *
 * The chevron is filled `primary` like this screen's other rows that lead
 * somewhere (BookingDetailsScreen `FlatRow`), not the tertiary default; the
 * padlock takes `secondary` per the POC, which draws it heavier at the same box
 * because its glyph fills the viewBox the chevron only sits inside.
 *
 * Props:
 *   offer       'lock' | 'manage'
 *   clientName  string
 *   lockedAt    Date | null
 *   onPress     () => void
 */
export default function RatesRow({ offer, clientName, lockedAt, onPress }) {
  // The POC reads the locale from `useI18nContext`; this prototype has no i18n
  // context, so `undefined` lets Intl fall back to the runtime's locale.
  const { title, subtitle } = ratesRowCopy(offer, clientName, lockedAt, undefined)

  return (
    <div role="button" aria-label={`${title}, ${subtitle}`}>
      <Row
        label={title}
        sublabel={subtitle}
        onClick={onPress}
        rightItem={
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {showsPadlock(offer) && <LockIcon size={24} color={colors.secondary} />}
            <ChevronRightIcon size={24} color={colors.primary} />
          </div>
        }
      />
    </div>
  )
}
