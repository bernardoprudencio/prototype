import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, typography, radius, shadows, layout } from '../tokens'
import { DropdownSmallIcon } from '../assets/icons'
import { Chip, Button, TabBar } from '../components'
import { useIsWide } from '../lib/useMediaQuery'
import { useApp } from '../context/AppContext'
import { CLIENTS, SITTERS, sortClients, sortOptionsFor, withAltMonetization } from '../data/contacts'
import RebookUserCard from './RebookUserCard'
import { TAB_PATHS } from '../lib/tabPaths'


const RadioMark = ({ selected }) => (
  <div style={{
    width: 20, height: 20, borderRadius: '50%',
    border: `2px solid ${selected ? colors.link : colors.borderInteractive}`,
    background: colors.white, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {selected && (
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors.link }} />
    )}
  </div>
)

function SortSheet({ visible, value, options, onPick, onClose }) {
  const [draft, setDraft] = useState(value)

  if (!visible) return null

  const handleApply = () => {
    onPick(draft)
    onClose()
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.3)',
    }}>
      <div onClick={onClose} style={{ flex: 1 }} />
      <div style={{
        background: colors.white, borderRadius: '8px 8px 0 0',
        boxShadow: shadows.medium, padding: '0 16px 24px',
        animation: 'slideUp 0.25s ease-out',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, marginBottom: 16 }}>
          <div style={{ width: 36, height: 5, borderRadius: 35, background: colors.borderInteractive }} />
        </div>

        <h2 style={{
          fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 16, lineHeight: 1.25,
          color: colors.primary, margin: '0 0 24px 4px',
        }}>
          Sort by
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {options.map(opt => {
            const selected = draft === opt.value
            return (
              <div
                key={opt.value}
                onClick={() => setDraft(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', cursor: 'pointer',
                }}
              >
                <span style={{
                  fontFamily: typography.fontFamily, fontSize: 16, lineHeight: '24px',
                  color: colors.primary, flex: 1,
                }}>
                  {opt.label}
                </span>
                <RadioMark selected={selected} />
              </div>
            )
          })}
        </div>

        <div style={{ paddingTop: 24 }}>
          <Button variant="primary" fullWidth onClick={handleApply}>See results</Button>
        </div>
      </div>
    </div>
  )
}

export default function RebookScreen() {
  const navigate = useNavigate()
  const onTabSelect = (id) => {
    const path = TAB_PATHS[id]
    if (path) navigate(path)
  }

  const isWide = useIsWide()

  const { altMonetizationRollout } = useApp()

  const [section, setSection] = useState('clients')
  const [storedSortOrder, setSortOrder] = useState('alphabetical')
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  // The GBV/tier sort only exists while the alt-monetization rollout is on
  // (production gates the whole graduated-take-rate surface on
  // `is_rollout_alt_monetisation`, views.py:1011-1013). `storedSortOrder` can
  // still be holding `gbv_progress` from before the flag was turned off, so
  // fall back rather than showing the sheet a selected option it does not list.
  const sortOptions = sortOptionsFor(altMonetizationRollout)
  const sortOrder = sortOptions.some(o => o.value === storedSortOrder)
    ? storedSortOrder
    : 'alphabetical'

  // Off-rollout the cards must not show tier names or GBV progress either, so
  // every client is projected through the same gate.
  const sortedClients = useMemo(
    () => sortClients(CLIENTS, sortOrder).map(c => withAltMonetization(c, altMonetizationRollout)),
    [sortOrder, altMonetizationRollout],
  )
  const currentSortLabel = sortOptions.find(o => o.value === sortOrder)?.label

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* ─── Header ─── */}
      <div style={{
        borderBottom: `1px solid ${colors.border}`, flexShrink: 0,
        padding: isWide ? '24px 0 16px' : '24px 16px 16px',
      }}>
        {/* The rule stays full-bleed; the title moves onto the same left edge as
            the card grid below it. */}
        <div style={isWide ? { maxWidth: layout.contentWidth, margin: '0 auto', padding: '0 16px' } : undefined}>
          <h1 style={{
            fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 26,
            lineHeight: 1.25, color: colors.primary, margin: 0,
          }}>
            Contacts
          </h1>
        </div>
      </div>

      {/* ─── Scroll Content ─── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {/* At wide width everything under the header shares one 1140 column, so
            the chips and the sort row line up with the card grid. */}
        <div style={isWide ? { maxWidth: layout.contentWidth, margin: '0 auto' } : undefined}>
        {/* Section chips */}
        <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0' }}>
          <Chip
            size="small"
            label="Clients"
            selected={section === 'clients'}
            checkmark
            onClick={() => setSection('clients')}
          />
          <Chip
            size="small"
            label="Sitters"
            selected={section === 'sitters'}
            checkmark
            onClick={() => setSection('sitters')}
          />
        </div>

        {/* Sort row (clients only) */}
        {section === 'clients' && (
          <div
            role="button"
            onClick={() => setSortSheetOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', cursor: 'pointer',
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <DropdownSmallIcon size={24} />
            <span style={{
              fontFamily: typography.fontFamily, fontWeight: 600, fontSize: 14, lineHeight: '20px',
              color: colors.primary,
            }}>
              {currentSortLabel}
            </span>
          </div>
        )}

        {/* List — a stacked list of rows below the breakpoint, a two-column card
            grid above it (RebookPageBase.tsx:20-29, minus production's
            three-column step at 1140px, which would need a second breakpoint). */}
        <div style={isWide ? {
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, padding: 16,
        } : { display: 'flex', flexDirection: 'column' }}>
          {(section === 'clients' ? sortedClients : SITTERS).map(c => (
            <RebookUserCard
              key={c.id}
              contact={c}
              isWide={isWide}
              onClick={section === 'clients' ? () => navigate(`/contacts/${c.id}`) : undefined}
            />
          ))}
        </div>
        </div>
      </div>

      <TabBar activeTab="rebook" onTabSelect={onTabSelect} />

      <SortSheet
        visible={sortSheetOpen}
        value={sortOrder}
        options={sortOptions}
        onPick={setSortOrder}
        onClose={() => setSortSheetOpen(false)}
      />
    </div>
  )
}
