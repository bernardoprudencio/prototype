/**
 * The app tab bar's id → route map, in one place.
 *
 * `TabBar` renders five tabs and calls `onTabSelect(id)`; every screen that
 * hosts it then translates that id to a route. Five screens did that with five
 * separately-maintained copies of the same object — three named `TAB_PATHS`
 * consts (`HomeScreen`, `RebookScreen`, `MoreScreen`) and two inline literals
 * (`InboxScreen`, `DashboardScreen`) — and all five omitted `calendar`, so the
 * CALENDAR tab has been silently inert since it was declared: every call site
 * guards with `if (path)`, so a missing entry is a no-op rather than an error.
 *
 * Hoisted here so the next tab added to `TabBar` cannot repeat that. Keys match
 * `TabBar.jsx`'s `TABS` ids exactly.
 */
export const TAB_PATHS = {
  home: '/',
  inbox: '/inbox',
  calendar: '/calendar',
  rebook: '/contacts',
  more: '/more',
}

export default TAB_PATHS
