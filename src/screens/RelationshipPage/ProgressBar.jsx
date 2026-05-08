import React from 'react'
import { colors } from '../../tokens'

const BAR_HEIGHT = 8
const BAR_RADIUS = 2

// One progress segment. Completed (dark green) sits left, pending (light green)
// sits to its right. Right-most filled portion gets a rounded right edge.
const Segment = ({ completedPct, pendingPct }) => (
  <div style={{
    flex: 1,
    height: BAR_HEIGHT,
    background: colors.bgTertiary,
    borderRadius: BAR_RADIUS,
    position: 'relative',
    overflow: 'hidden',
  }}>
    {completedPct > 0 && (
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${completedPct}%`,
        background: colors.success,
        ...(pendingPct === 0 ? { borderRadius: '0 2px 2px 0' } : null),
      }} />
    )}
    {pendingPct > 0 && (
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: `${completedPct}%`,
        width: `${pendingPct}%`,
        background: colors.successLight,
        borderRadius: '0 2px 2px 0',
      }} />
    )}
  </div>
)

export default function ProgressBar({ tiers, earnings }) {
  const completed = parseFloat(earnings.completed.amount)
  const pending = parseFloat(earnings.pending.amount)
  const total = completed + pending

  const t1Threshold = tiers[0].threshold ? parseFloat(tiers[0].threshold.amount) : 0
  const t2RawAmount = (tiers[1].threshold?.amount ?? '0').replace('+', '')
  const t2Threshold = parseFloat(t2RawAmount)

  const showTwoSections = total > t1Threshold || completed > t1Threshold

  if (!showTwoSections) {
    let completedPct = 0
    let pendingPct = 0
    if (t1Threshold > 0) {
      const t1Completed = Math.min(completed, t1Threshold)
      completedPct = (t1Completed / t1Threshold) * 100
      const remaining = t1Threshold - t1Completed
      const t1Pending = Math.min(pending, remaining)
      pendingPct = (t1Pending / t1Threshold) * 100
    }
    return (
      <div style={{ width: '100%' }}>
        <Segment completedPct={completedPct} pendingPct={pendingPct} />
      </div>
    )
  }

  const t1Completed = Math.min(completed, t1Threshold)
  const seg1CompletedPct = t1Threshold > 0 ? (t1Completed / t1Threshold) * 100 : 0
  const t1Pending = Math.min(pending, Math.max(0, t1Threshold - t1Completed))
  const seg1PendingPct = t1Threshold > 0 ? (t1Pending / t1Threshold) * 100 : 0

  const t2Range = t2Threshold - t1Threshold
  const t2Completed = Math.max(0, completed - t1Threshold)
  const seg2CompletedPct = t2Range > 0 ? (t2Completed / t2Range) * 100 : 0
  const totalInTier2 = Math.max(0, total - t1Threshold)
  const t2Pending = totalInTier2 - t2Completed
  const seg2PendingPct = t2Range > 0 ? (t2Pending / t2Range) * 100 : 0

  return (
    <div style={{ display: 'flex', gap: 4, width: '100%' }}>
      <Segment completedPct={seg1CompletedPct} pendingPct={seg1PendingPct} />
      <Segment completedPct={seg2CompletedPct} pendingPct={seg2PendingPct} />
    </div>
  )
}
