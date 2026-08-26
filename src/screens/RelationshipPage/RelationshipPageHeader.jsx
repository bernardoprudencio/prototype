import React from 'react'
import { colors, radius, shadows, typography } from '../../tokens'
import { Button } from '../../components'
import { BackIcon } from '../../assets/icons'
import { personPlaceholder } from '../../assets/images'

/**
 * The client identity block, in the two presentations the relationship page has.
 *
 * `variant="bar"` (below 769px) mirrors the RN HeaderRow: a full-bleed white bar
 * with a back arrow + 48px avatar on the left, name and pet names stacked, and
 * the Rebook/Profile buttons below the title row but still inside the bar. This
 * is the app's chrome and carries the only back affordance the screen has.
 *
 * `variant="card"` (769px and up) is the web treatment (Figma 192:15290): the
 * same identity, but as the first card in the page's left column — 64px avatar,
 * no back arrow, no bar. The web navbar above is the navigation, so there is no
 * in-page back control; the browser's own back is the way out, exactly as on
 * production's web relationship page.
 */

const AVATAR = { bar: 48, card: 64 }

function Avatar({ url, size }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', background: colors.bgSecondary, flexShrink: 0,
    }}>
      <img
        src={url || personPlaceholder}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  )
}

const truncate = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

export default function RelationshipPageHeader({
  ownerName, petNames, avatarUrl, onBack, onRebookPress, onProfilePress,
  variant = 'bar',
}) {
  const showButtons = onRebookPress || onProfilePress
  const isCard = variant === 'card'

  // Title is Text size 200 (16px) semibold in the bar (production HeaderRow);
  // the card's own title reads a step larger at 20px, matching the Figma frame.
  const title = (
    <div style={{
      fontFamily: typography.fontFamily,
      fontWeight: 700, fontSize: isCard ? 20 : 16,
      lineHeight: isCard ? '26px' : '20px',
      color: colors.primary, ...truncate,
    }}>
      {ownerName}
    </div>
  )

  // Subtitle — Text size 100 (14px) tertiary in both variants.
  const subtitle = petNames && (
    <div style={{
      fontFamily: typography.fontFamily,
      fontSize: 14, lineHeight: '18px',
      color: colors.tertiary, ...truncate,
    }}>
      {petNames}
    </div>
  )

  const buttons = showButtons && (
    <div style={{
      display: 'flex', gap: 8,
      padding: isCard ? '12px 0 0' : '0 16px 12px',
    }}>
      {onRebookPress && (
        <Button variant="primary" size="small" onClick={onRebookPress}>Rebook</Button>
      )}
      {onProfilePress && (
        <Button variant="default" size="small" onClick={onProfilePress}>Profile</Button>
      )}
    </div>
  )

  if (isCard) {
    return (
      <div style={{
        background: colors.white,
        borderRadius: radius.primary,
        boxShadow: shadows.low,
        padding: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar url={avatarUrl} size={AVATAR.card} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {title}
            {subtitle}
          </div>
        </div>
        {buttons}
      </div>
    )
  }

  return (
    <div style={{
      flexShrink: 0,
      background: colors.white,
      boxShadow: shadows.headerShadow,
      zIndex: 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 8px 8px 4px',
      }}>
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <BackIcon />
        </button>

        <Avatar url={avatarUrl} size={AVATAR.bar} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {title}
          {subtitle}
        </div>
      </div>

      {buttons}
    </div>
  )
}
