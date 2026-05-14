import React, { useState } from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import { colors, textStyles, spacing } from '../tokens'

/**
 * HelpLinkTip — inline link styled like a hyperlink that opens a BottomSheet
 * with tip content (title + body + "Got it" close).
 *
 * Props:
 *   linkLabel  string             — visible link text
 *   tipTitle   string             — heading inside the sheet
 *   tipBody    string | ReactNode — body content inside the sheet
 */
export default function HelpLinkTip({ linkLabel, tipTitle, tipBody }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          ...textStyles.link200,
          color: colors.link,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textDecoration: 'underline',
          display: 'inline',
        }}
      >
        {linkLabel}
      </button>

      {open && (
        <BottomSheet variant="simple" onDismiss={() => setOpen(false)}>
          <div style={{ paddingTop: spacing.sm }}>
            <h2 style={{ ...textStyles.heading300, color: colors.primary, margin: 0, marginBottom: spacing.md }}>
              {tipTitle}
            </h2>

            <div style={{ ...textStyles.paragraph200, color: colors.secondary, marginBottom: spacing.xl }}>
              {tipBody}
            </div>

            <Button variant="primary" size="default" fullWidth onClick={() => setOpen(false)}>
              Got it
            </Button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
