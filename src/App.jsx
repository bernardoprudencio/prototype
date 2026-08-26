import React, { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { typography } from './tokens'
import { useLoadTime } from './hooks/useLoadTime'
import { formatActionTimestamp } from './hooks/useDate'
import { ActionSheet, ReviewSheet, SlideOverlay, WebNavBar } from './components'
import { HomeScreen, ConversationScreen, BookingDetailsScreen, ScheduleScreen, EditTemplateScreen, CurrentWeekScreen, ModifyBookingScreen, RebookScreen, MoreScreen, RelationshipPage, InboxScreen, ScheduleOverlay, TestingModeScreen, ServiceSettingsScreen, ServiceSettingsLayout, BusinessPane, AboutYouPane, OtherServicesPane, BoardingSettingsScreen, FamilyServicesScreen, FamilyProfileScreen, PresentationsScreen, DeckScreen, MgmtHubDeckScreen, StubScreen, DashboardScreen, CalendarScreen } from './screens'
import { petImages } from './assets/images'
import { useApp } from './context/AppContext'
import { useIsWide } from './lib/useMediaQuery'
import { WEB_STUB_PAGES } from './data/webNavItems'

export default function App() {
  const navigate = useNavigate()
  const { setResolvedCards, scheduleMode } = useApp()

  const [sheetItem, setSheetItem]             = useState(null)
  const [reviewSheetCard, setReviewSheetCard] = useState(null)

  const loadTime = useLoadTime()
  const isWide = useIsWide()

  const handleComplete = (card) => {
    const ts = formatActionTimestamp()
    setResolvedCards(prev => ({ ...prev, [card.id]: { resolution: 'completed', timestamp: ts } }))
    setReviewSheetCard(null)
    navigate(`/conversation/${card.clientKey}`, {
      state: { type: 'incomplete', cardId: card.id, card },
    })
  }

  const handleCancelRefund = (card) => {
    const ts = formatActionTimestamp()
    setResolvedCards(prev => ({ ...prev, [card.id]: { resolution: 'cancelled', timestamp: ts } }))
    setReviewSheetCard(null)
    navigate(`/conversation/${card.clientKey}`, {
      state: { type: 'incomplete', cardId: card.id, card },
    })
  }

  const openIncompleteSheet = (card) => setSheetItem({
    type: 'incomplete',
    label: card.label,
    sublabel: card.sublabel,
    petImages: [petImages[card.petKey]],
    firstName: card.client.split(' ')[0],
    card,
  })

  const openTodaySheet = (walk) => setSheetItem({
    type: 'today',
    label: `Dog Walking: ${walk.owner.petNames}`,
    sublabel: `Today · ${walk.timeRange}`,
    petImages: walk.owner.petImages,
    firstName: walk.owner.name.split(' ')[0],
    owner: walk.owner,
  })

  // One element, two addresses — `/` below the wide breakpoint and `/home` at
  // every width. Its sheet callbacks stay wired to the ActionSheet/ReviewSheet
  // below exactly as before.
  const home = (
    <HomeScreen
      loadTime={loadTime}
      onOpenActionSheet={openIncompleteSheet}
      onOpenReviewSheet={(card) => setReviewSheetCard(card)}
      onOpenTodaySheet={openTodaySheet}
    />
  )

  return (
    <div className="app-shell" style={{ fontFamily: typography.fontFamily }}>
      {/* ── Navigation model is chosen by width ──
           At the wide breakpoint the app becomes web: rover.com's desktop navbar
           sits above the content and `TabBar` stands itself down. Below it, this
           renders nothing and the app's bottom tab bar is the nav. */}
      {isWide && <WebNavBar />}

      {/* ── Content pane ──
           `position: relative` here rather than on `.app-shell` is what keeps the
           `SlideOverlay` routes (absolute, inset 0) inside the pane instead of
           over the navbar. `minHeight: 0` is load-bearing: every screen root is
           `height: 100%` with its own inner scroller, and without it this flex
           child refuses to shrink and those scrollers never engage. */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
      {/* ── Tab routes (base layer) ── */}
      <Routes>
        {/* The landing page is chosen by width. Production has two distinct
            surfaces here and neither is the other's responsive variant: the web
            landing for a logged-in sitter is the dashboard at `/account/`
            (`account/urls.py:28`), while `HomeScreen` is the app's home. Both
            keep a dedicated address below so either is reachable at any width. */}
        <Route path="/" element={isWide ? <DashboardScreen /> : home} />
        <Route path="/home" element={home} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/contacts" element={<RebookScreen />} />
        {/* Sitter-wide calendar. A base-layer tab route, not an overlay, so it
            leaves the zIndex ladder alone. */}
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/more" element={<MoreScreen />} />
        {/* The active filter is a URL segment, matching production
            (useWebState.ts:10-20). Optional, so a bare /inbox still resolves to
            Primary and every existing link keeps working. */}
        <Route path="/inbox/:slug?" element={<InboxScreen />} />
        {/* Boarding has no desktop frame — it stays a full-bleed page outside
            the two-pane shell. */}
        <Route path="/service-settings/boarding" element={<BoardingSettingsScreen />} />
        {/* Web navbar destinations that exist in production but have no
            prototype screen yet. Reachable from the avatar dropdown at wide
            width; each is where the real web screen lands later. */}
        {WEB_STUB_PAGES.map(({ path, title }) => (
          <Route key={path} path={path} element={<StubScreen title={title} />} />
        ))}
        <Route path="/service-settings" element={<ServiceSettingsLayout />}>
          <Route index element={<ServiceSettingsScreen />} />
          <Route path="services/:family" element={<FamilyServicesScreen />} />
          <Route path="profile/:family" element={<FamilyProfileScreen />} />
          <Route path="business" element={<BusinessPane />} />
          <Route path="about" element={<AboutYouPane />} />
          <Route path="other" element={<OtherServicesPane />} />
        </Route>
      </Routes>

      {/* ── Conversation overlay (z-10) ── */}
      <Routes>
        {/* A thread opened for one specific booking keeps its opk in the URL, so
            the conversation stays resolved while /details sits on top of it. */}
        <Route path="/conversation/:ownerId/thread/:conversationOpk/*" element={
          <SlideOverlay zIndex={10}>
            <ConversationScreen />
          </SlideOverlay>
        } />
        <Route path="/conversation/:ownerId/*" element={
          <SlideOverlay zIndex={10}>
            <ConversationScreen />
          </SlideOverlay>
        } />
      </Routes>

      {/* ── Booking details (z-20, over the conversation).
           Production's /account/conversations/<opk>/details page.

           Below the breakpoint only. At wide width the details live in the
           conversation's own left rail, and this address renders nothing —
           which makes it visually identical to the conversation URL underneath
           it. That is production's behaviour, not a shortcut:
           ConversationDetailsPage.tsx:24 early-returns on `!isSmDown` before it
           ever consults the route match, and the thread pane only hides itself
           below 992px (ConversationPageContent.tsx:179). The route stays
           declared so navigating here at wide is a legal no-op rather than a
           blank screen. ── */}
      <Routes>
        <Route path="/conversation/:ownerId/thread/:conversationOpk/details" element={
          isWide ? null : (
            <SlideOverlay zIndex={20}>
              <BookingDetailsScreen />
            </SlideOverlay>
          )
        } />
      </Routes>

      {/* ── Relationship page overlay (z-10, sibling of conversation) ── */}
      <Routes>
        <Route path="/contacts/:ownerId" element={
          <SlideOverlay zIndex={10}>
            <RelationshipPage />
          </SlideOverlay>
        } />
        <Route path="*" element={null} />
      </Routes>

      {/* ── Testing mode overlay (z-15) ── */}
      <Routes>
        <Route path="/testing-mode" element={
          <SlideOverlay zIndex={15}>
            <TestingModeScreen />
          </SlideOverlay>
        } />
      </Routes>

      {/* ── Presentations list overlay (z-15) ── */}
      <Routes>
        <Route path="/presentations" element={
          <SlideOverlay zIndex={15}>
            <PresentationsScreen />
          </SlideOverlay>
        } />
      </Routes>

      {/* ── Deck (full-viewport, breaks out of phone shell via its own fixed positioning) ── */}
      <Routes>
        <Route path="/presentations/leadership-review" element={
          <DeckScreen onClose={() => navigate('/presentations')} />
        } />
        <Route path="/presentations/mgmt-hub-migration" element={
          <MgmtHubDeckScreen onClose={() => navigate('/presentations')} />
        } />
      </Routes>

      {/* ── Schedule + CurrentWeek + ModifyBooking (z-20 siblings).
           In Modification mode, /schedule renders ScheduleScreen (5-week calendar).
           In Agenda mode, /schedule renders ScheduleOverlay (RelationshipManagement + sheets).
           /modify is the one-time (non-recurring) counterpart: production picks
           between ModifyBookingProviderButton and ModifyScheduleProviderButton on
           `is_recurring` (booking_ctas.py:265-267), so the two never coexist for
           one client and they belong at the same layer. ── */}
      <Routes>
        <Route path="/conversation/:ownerId/schedule" element={
          <SlideOverlay zIndex={20}>
            {scheduleMode === 'agenda' ? <ScheduleOverlay /> : <ScheduleScreen />}
          </SlideOverlay>
        } />
        <Route path="/conversation/:ownerId/current-week" element={
          <SlideOverlay zIndex={20}>
            <CurrentWeekScreen />
          </SlideOverlay>
        } />
        {/* Two paths, one screen — mirroring the details route above. A thread
            opened for one specific booking keeps its opk in the URL so the
            modify page acts on *that* conversation; the bare path is the
            fallback for conversations opened without an opk (HomeScreen's
            incomplete cards). Production is always per-conversation. */}
        <Route path="/conversation/:ownerId/thread/:conversationOpk/modify" element={
          <SlideOverlay zIndex={20}>
            <ModifyBookingScreen />
          </SlideOverlay>
        } />
        <Route path="/conversation/:ownerId/modify" element={
          <SlideOverlay zIndex={20}>
            <ModifyBookingScreen />
          </SlideOverlay>
        } />
      </Routes>

      {/* ── EditTemplate (z-30, on top of Schedule) ── */}
      <Routes>
        <Route path="/conversation/:ownerId/schedule/edit-template" element={
          <SlideOverlay zIndex={30}>
            <EditTemplateScreen />
          </SlideOverlay>
        } />
      </Routes>

      </div>

      {/* ── Global modals (outside the content pane — they cover the navbar) ── */}
      <ActionSheet
        visible={!!sheetItem}
        type={sheetItem?.type}
        label={sheetItem?.label}
        sublabel={sheetItem?.sublabel}
        petImages={sheetItem?.petImages}
        firstName={sheetItem?.firstName}
        onClose={() => setSheetItem(null)}
        onGoToConversation={() => {
          const item = sheetItem
          setSheetItem(null)
          if (item.type === 'incomplete') {
            navigate(`/conversation/${item.card.clientKey}`, {
              state: { type: 'incomplete', cardId: item.card.id, card: item.card },
            })
          } else {
            const ownerId = item.owner?.id ?? 'owen'
            navigate(`/conversation/${ownerId}`, { state: { type: 'today' } })
          }
        }}
        onReschedule={() => {
          const ownerId = sheetItem.owner?.id ?? 'owen'
          setSheetItem(null)
          navigate(`/conversation/${ownerId}/current-week`, { state: { type: 'today' } })
        }}
        onReviewAndComplete={() => {
          const card = sheetItem.card
          setSheetItem(null)
          setTimeout(() => setReviewSheetCard(card), 200)
        }}
      />

      <ReviewSheet
        visible={!!reviewSheetCard}
        card={reviewSheetCard}
        onClose={() => setReviewSheetCard(null)}
        onComplete={() => handleComplete(reviewSheetCard)}
        onCancelRefund={() => handleCancelRefund(reviewSheetCard)}
      />
    </div>
  )
}
