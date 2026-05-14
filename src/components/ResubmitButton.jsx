import React from 'react'
import Button from './Button'

/**
 * ResubmitButton — production "Resubmit Profile" CTA shown when
 * `profileReviewStatus === 'borderline'`.
 *
 * Props:
 *   onClick  () => void
 */
export default function ResubmitButton({ onClick }) {
  return (
    <Button variant="primary" onClick={onClick}>
      Resubmit Profile
    </Button>
  )
}
