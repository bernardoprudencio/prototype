import React from 'react'
import { colors, typography } from '../tokens'

/**
 * Placeholder for a web navbar destination that exists in production but has no
 * prototype screen yet (Calendar, Insights, Payments, Settings, Your Pets,
 * Photos — see `WEB_STUB_PAGES` in `src/data/webNavItems.js`).
 *
 * Every dropdown row leading somewhere keeps the nav honest, and each of these
 * is the obvious place to drop the real web screen in later.
 *
 * Uses the same skeleton as the tab screens: a `height: 100%` flex column with a
 * `flexShrink: 0` bordered header, so it sits inside the app shell's content
 * pane the same way every other page does.
 */
export default function StubScreen({ title, note = 'Not built in this prototype yet.' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
      <div style={{ borderBottom: `1px solid ${colors.border}`, padding: '24px 16px 16px', flexShrink: 0 }}>
        <h1 style={{
          fontFamily: typography.displayFamily, fontWeight: 600, fontSize: 26,
          lineHeight: 1.25, color: colors.primary, margin: 0,
        }}>
          {title}
        </h1>
      </div>

      <div className="hide-scrollbar" style={{
        flex: 1, overflowY: 'auto', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <p style={{
          fontFamily: typography.fontFamily, fontSize: 16, lineHeight: 1.5,
          color: colors.tertiary, margin: 0, textAlign: 'center',
        }}>
          {note}
        </p>
      </div>
    </div>
  )
}
