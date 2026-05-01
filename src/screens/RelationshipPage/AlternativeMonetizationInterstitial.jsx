import React from 'react'
import { colors, typography, shadows } from '../../tokens'
import { Button, BulletedParagraphs, DragHandle } from '../../components'

const tiersDoodleSrc = new URL('../../assets/tiers-doodle.svg', import.meta.url).href

export default function AlternativeMonetizationInterstitial({ open, onClose }) {
  if (!open) return null

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.4)',
    }}>
      <div onClick={onClose} style={{ flex: 1 }} />
      <div style={{
        background: colors.white,
        borderRadius: '16px 16px 0 0',
        boxShadow: shadows.medium,
        maxHeight: '85%',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.25s ease-out',
      }}>
        <DragHandle />
        <div className="hide-scrollbar" style={{
          flex: 1, overflowY: 'auto',
          padding: '8px 16px 0',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src={tiersDoodleSrc} alt="" style={{ width: 220, maxWidth: '100%', height: 'auto' }} />
          </div>

          <div style={{
            fontFamily: typography.displayFamily,
            fontWeight: 600, fontSize: 24, lineHeight: '32px',
            color: colors.primary,
          }}>
            How it works
          </div>

          <BulletedParagraphs>
            <BulletedParagraphs.Item>
              <p style={{
                margin: 0,
                fontFamily: typography.fontFamily,
                fontSize: 16, lineHeight: '24px',
                color: colors.primary,
              }}>
                Accept a request from a new or existing client.
              </p>
            </BulletedParagraphs.Item>
            <BulletedParagraphs.Item>
              <p style={{
                margin: 0,
                fontFamily: typography.fontFamily,
                fontSize: 16, lineHeight: '24px',
                color: colors.primary,
              }}>
                Care for pets! Every dollar a client spends with you brings you closer to the next earnings tier with them.
              </p>
            </BulletedParagraphs.Item>
            <BulletedParagraphs.Item>
              <p style={{
                margin: 0, paddingBottom: 16,
                fontFamily: typography.fontFamily,
                fontSize: 16, lineHeight: '24px',
                color: colors.primary,
              }}>
                Each tier you reach unlocks lower fees, so you'll get higher earnings on future bookings with them.
              </p>
            </BulletedParagraphs.Item>
          </BulletedParagraphs>
        </div>

        <div style={{
          padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <Button variant="primary" size="small" fullWidth onClick={onClose}>
            Learn more
          </Button>
          <Button variant="default" size="small" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
