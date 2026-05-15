import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { colors, typography, textStyles } from '../tokens'
import { BackIcon } from '../assets/icons'
import { getPlaceholderContent } from '../data/placeholderRoutes'
import Button from '../components/Button'

// ─────────────────────────────────────────────────────────────────────────────
// Generic "you'd find X here" destination used by every clickable row on the
// Service settings screen that isn't wired to a real detail screen. Keeps
// unmoderated user-testing participants from hitting dead taps — each row
// lands somewhere they can read, recognize the area, and back out from.
// ─────────────────────────────────────────────────────────────────────────────

export default function PlaceholderScreen() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { title, description } = getPlaceholderContent(slug)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.white,
      }}
    >
      {/* ── Sticky header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 56,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: `1px solid ${colors.border}`,
          background: colors.white,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
          }}
        >
          <BackIcon />
        </button>
        <h1
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 600,
            fontSize: 17,
            lineHeight: 1.25,
            color: colors.primary,
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {/* ── Body ── */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 32,
          paddingBottom: 24,
        }}
      >
        {/* Title + description, centered vertically and horizontally. */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              ...textStyles.display400,
              fontFamily: typography.displayFamily,
              color: colors.primary,
              margin: 0,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              ...textStyles.paragraph200,
              fontFamily: typography.fontFamily,
              color: colors.secondary,
              margin: 0,
              maxWidth: 320,
            }}
          >
            {description}
          </p>
        </div>

        {/* Bottom CTA + footnote — explicit "Go back" affords participants
            who may not notice the header chevron. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            paddingTop: 24,
          }}
        >
          <Button variant="primary" size="default" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <span style={{ ...textStyles.text100, color: colors.tertiary }}>
            Prototype placeholder
          </span>
        </div>
      </div>
    </div>
  )
}
