import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, typography, radius, shadows } from '../tokens'
import { DropdownSmallIcon } from '../assets/icons'
import { Chip, Button, TabBar } from '../components'
import { CLIENTS, SITTERS, SORT_OPTIONS, sortClients } from '../data/contacts'
import RebookUserCard from './RebookUserCard'

const TAB_PATHS = { home: '/', inbox: '/inbox', rebook: '/contacts', more: '/more' }

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

function SortSheet({ visible, value, onPick, onClose }) {
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
          {SORT_OPTIONS.map(opt => {
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

  const [section, setSection] = useState('clients')
  const [sortOrder, setSortOrder] = useState('alphabetical')
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  const sortedClients = useMemo(() => sortClients(CLIENTS, sortOrder), [sortOrder])
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOrder)?.label

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      {/* ─── Header ─── */}
      <div style={{ borderBottom: `1px solid ${colors.border}`, padding: '24px 16px 16px', flexShrink: 0 }}>
        <h1 style={{
          fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 26,
          lineHeight: 1.25, color: colors.primary, margin: 0,
        }}>
          Contacts
        </h1>
      </div>

      {/* ─── Scroll Content ─── */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Section chips */}
        <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0' }}>
          <Chip
            label="Clients"
            selected={section === 'clients'}
            checkmark
            onClick={() => setSection('clients')}
          />
          <Chip
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

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {(section === 'clients' ? sortedClients : SITTERS).map(c => (
            <RebookUserCard
              key={c.id}
              contact={c}
              onClick={section === 'clients' ? () => navigate(`/contacts/${c.id}`) : undefined}
            />
          ))}
        </div>
      </div>

      <TabBar activeTab="rebook" onTabSelect={onTabSelect} />

      <SortSheet
        visible={sortSheetOpen}
        value={sortOrder}
        onPick={setSortOrder}
        onClose={() => setSortSheetOpen(false)}
      />
    </div>
  )
}
