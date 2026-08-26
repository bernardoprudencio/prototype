import React from 'react'
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { colors, layout } from '../tokens'
import {
  FAMILY_LABEL,
  FAMILY_PROFILE_REVIEW_ROW,
  SERVICE_FAMILY,
  getFamilyProfileRows,
} from '../data/sitterServices'
import Button from '../components/Button'
import { Chevron, SettingsRow, SubPageHeader } from '../components/hubUI'
import FamilyPaneHeader from './FamilyPaneHeader'
import { useApp } from '../context/AppContext'

/**
 * `/service-settings/profile/:family` — the family's profile rows plus a
 * pinned "View {family} profile" action. Figma 582:57749 (pet sitting),
 * 1194:52491 (training), 1194:52281 (grooming).
 *
 * The "Review" badge lands on the family's designated row
 * (`FAMILY_PROFILE_REVIEW_ROW`) while that family's attention banner is on.
 * Training is the only family with a profile-scoped banner today.
 */
export default function FamilyProfileScreen() {
  const navigate = useNavigate()
  const { family } = useParams()
  const { showTrainingCredentialsUploadBanner } = useApp()
  const { isWide } = useOutletContext()

  const rows = getFamilyProfileRows(family)
  if (!FAMILY_LABEL[family] || rows.length === 0) {
    return <Navigate to="/service-settings" replace />
  }

  const label = FAMILY_LABEL[family]
  const reviewRowId =
    family === SERVICE_FAMILY.TRAINING && showTrainingCredentialsUploadBanner
      ? FAMILY_PROFILE_REVIEW_ROW[family]
      : null
  const noop = () => {}

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isWide ? 'auto' : '100%',
        background: colors.white,
      }}
    >
      {isWide ? (
        <FamilyPaneHeader family={family} activeTab="profile" />
      ) : (
        <SubPageHeader title={`${label} profile`} onBack={() => navigate('/service-settings')} />
      )}

      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: isWide ? 'visible' : 'auto',
          paddingLeft: isWide ? 0 : 16,
          paddingRight: isWide ? 0 : 16,
        }}
      >
        <div style={{ maxWidth: layout.contentWidth, width: '100%', margin: '0 auto', paddingTop: 8, paddingBottom: isWide ? 0 : 40 }}>
          {rows.map((row) => (
            <SettingsRow
              key={row.id}
              label={row.label}
              sublabel={row.sublabel}
              needsReview={row.id === reviewRowId}
              rightItem={<Chevron />}
              onPress={noop}
            />
          ))}
        </div>
      </div>

      {/* Pinned footer action — full-width outlined pill, no top rule
          (Figma 607:42368). */}
      <div
        style={{
          padding: isWide ? '12px 0' : '12px 16px',
          background: colors.white,
          display: 'flex',
          flexShrink: 0,
        }}
      >
        <Button variant="default" fullWidth={!isWide} onClick={noop}>
          {`View ${label.toLowerCase()} profile`}
        </Button>
      </div>
    </div>
  )
}
