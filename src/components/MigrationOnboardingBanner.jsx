import React from 'react'
import { colors, radius, typography } from '../tokens'
import { CatPeekIcon } from '../assets/icons'
import Button from './Button'

// CIAF Migration Onboarding card. Renders for sitters who just claimed their
// Rover account from Cat in a Flat (the UK cat-sitting marketplace Rover
// acquired in Oct 2024). Production: a custom bordered Box (NOT the Kibble
// Alert/Banner) with a peeking-cat SVG top-right, heading, sub-heading, three
// bullet items, and a Dismiss button.
//
// Production source:
//   src/frontend/react-lib/src/pages/provider-profile/HubPage/components/
//     MigrationOnboarding/MigrationOnboarding.tsx
export default function MigrationOnboardingBanner({ copy, onDismiss }) {
  if (!copy) return null
  const { heading, subheading, bullets = [], dismissLabel = 'Dismiss' } = copy

  return (
    <div
      style={{
        position: 'relative',
        background: '#FFFFFF',
        border: `1px solid ${colors.border}`,
        borderRadius: radius.primary,
        padding: 20,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      {/* Cat-peek mascot, top-right corner. */}
      <div
        style={{
          position: 'absolute',
          top: -8,
          right: 12,
          width: 72,
          height: 72,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <CatPeekIcon size={72} color={colors.primary} />
      </div>

      <div style={{ paddingRight: 80 }}>
        {heading && (
          <p
            style={{
              fontFamily: typography.fontFamily,
              fontWeight: 600,
              fontSize: 18,
              lineHeight: 1.25,
              color: colors.primary,
              margin: 0,
            }}
          >
            {heading}
          </p>
        )}
        {subheading && (
          <p
            style={{
              fontFamily: typography.fontFamily,
              fontWeight: 400,
              fontSize: 14,
              lineHeight: 1.5,
              color: colors.primary,
              margin: '4px 0 0',
            }}
          >
            {subheading}
          </p>
        )}
      </div>

      {bullets.length > 0 && (
        <ul
          style={{
            margin: '16px 0 0',
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {bullets.map((b, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  marginTop: 8,
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: colors.primary,
                }}
                aria-hidden="true"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {b.href ? (
                  <a
                    href={b.href}
                    target={b.href.startsWith('http') ? '_blank' : '_self'}
                    rel={b.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                    style={{
                      fontFamily: typography.fontFamily,
                      fontWeight: 600,
                      fontSize: 14,
                      lineHeight: 1.25,
                      color: colors.link,
                      textDecoration: 'underline',
                    }}
                  >
                    {b.title}
                  </a>
                ) : (
                  <span
                    style={{
                      fontFamily: typography.fontFamily,
                      fontWeight: 600,
                      fontSize: 14,
                      lineHeight: 1.25,
                      color: colors.primary,
                    }}
                  >
                    {b.title}
                  </span>
                )}
                <p
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: colors.primary,
                    margin: '4px 0 0',
                  }}
                >
                  {b.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="default" size="small" onClick={onDismiss}>
          {dismissLabel}
        </Button>
      </div>
    </div>
  )
}
