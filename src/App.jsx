import React, { useState } from 'react'
import { colors, typography } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { ActionSheet } from './components'
import { HomeScreen, ConversationScreen } from './screens'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [actionSheet, setActionSheet] = useState(false)
  const [transition, setTransition] = useState(false)
  const [direction, setDirection] = useState('forward')
  const loadTime = useLoadTime()

  const navigateTo = (target, dir = 'forward') => {
    setDirection(dir)
    setTransition(true)
    setTimeout(() => {
      setScreen(target)
      setTransition(false)
    }, 200)
  }

  return (
    <div className="phone-shell" style={{ fontFamily: typography.fontFamily }}>
      {/* Screen layer */}
      <div style={{
        position: 'absolute', inset: 0,
        transition: 'transform 0.25s ease, opacity 0.2s ease',
        transform: transition
          ? (direction === 'forward' ? 'translateX(-30%)' : 'translateX(30%)')
          : 'translateX(0)',
        opacity: transition ? 0 : 1,
      }}>
        {screen === 'home' && (
          <HomeScreen
            onOpenActionSheet={() => setActionSheet(true)}
            onNavigateConversation={() => navigateTo('conversation', 'forward')}
            loadTime={loadTime}
          />
        )}
        {screen === 'conversation' && (
          <ConversationScreen onBack={() => navigateTo('home', 'back')} />
        )}
      </div>

      {/* Action Sheet overlay */}
      <ActionSheet
        visible={actionSheet}
        onClose={() => setActionSheet(false)}
        onGoToConversation={() => {
          setActionSheet(false)
          setTimeout(() => navigateTo('conversation', 'forward'), 200)
        }}
      />

      {/* Prototype badge */}
      <div className="prototype-badge" style={{
        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.06)', borderRadius: 99, padding: '2px 10px',
        fontSize: 10, fontWeight: 700, color: colors.tertiary, letterSpacing: 0.5,
        textTransform: 'uppercase', pointerEvents: 'none',
      }}>Prototype</div>
    </div>
  )
}
