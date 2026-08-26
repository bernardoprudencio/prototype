import { layout } from '../tokens'

/**
 * The style that drops a page into the web navbar's content column.
 *
 * `WebNavBar` caps its own contents at `layout.contentWidth` and centres them,
 * so any page rendered below the bar has to do the same or it reads as a
 * different, wider document than the navigation above it. Below the wide
 * breakpoint there is no navbar and the app fills the viewport, so this returns
 * `undefined` and the screen's own mobile styles stand.
 *
 * Pass `extra` for whatever the call site needs on the same element (padding,
 * flex). Screens whose element must disappear entirely at narrow width can
 * spread this over a `{ display: 'contents' }` default instead.
 */
export const webColumn = (isWide, extra) => (isWide
  ? { maxWidth: layout.contentWidth, width: '100%', margin: '0 auto', ...extra }
  : undefined)
