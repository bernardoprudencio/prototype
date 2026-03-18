import React from 'react'
import { colors } from '../tokens'

const c = colors

export const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6" stroke={c.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const ChevronUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18 15L12 9L6 15" stroke={c.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M9 18L15 12L9 6" stroke={c.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const MoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="5" r="1.5" fill={c.primary}/>
    <circle cx="12" cy="12" r="1.5" fill={c.primary}/>
    <circle cx="12" cy="19" r="1.5" fill={c.primary}/>
  </svg>
)

export const MapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" stroke={c.primary} strokeWidth="1.5"/>
    <circle cx="12" cy="10" r="3" stroke={c.primary} strokeWidth="1.5"/>
  </svg>
)

export const PawIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M5.5 10.5C6.5 9 9.5 9 10.5 10.5C11.5 12 10 14 8 14C6 14 4.5 12 5.5 10.5Z" stroke={c.primary} strokeWidth="1.2"/>
    <ellipse cx="4" cy="7" rx="1.5" ry="2" stroke={c.primary} strokeWidth="1.2"/>
    <ellipse cx="7" cy="5" rx="1.3" ry="1.8" stroke={c.primary} strokeWidth="1.2"/>
    <ellipse cx="9.5" cy="5" rx="1.3" ry="1.8" stroke={c.primary} strokeWidth="1.2"/>
    <ellipse cx="12" cy="7" rx="1.5" ry="2" stroke={c.primary} strokeWidth="1.2"/>
  </svg>
)

export const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#D59418" strokeWidth="1.5"/>
    <path d="M12 6V12L16 14" stroke="#D59418" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const EditIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8L6.5 11.5L13 5" stroke={c.tertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const HomeFilledIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill={c.primary}/>
  </svg>
)

export const HomeOutlineIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={c.tertiary} strokeWidth="1.5"/>
  </svg>
)

export const InboxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={c.tertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke={c.tertiary} strokeWidth="1.5"/>
    <path d="M16 2v4M8 2v4M3 10h18" stroke={c.tertiary} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const RebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M17 1l4 4-4 4" stroke={c.tertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 11V9a4 4 0 014-4h14" stroke={c.tertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 23l-4-4 4-4" stroke={c.tertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 13v2a4 4 0 01-4 4H3" stroke={c.tertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const MoreTabIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="5" cy="12" r="1.5" stroke={c.tertiary} strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="1.5" stroke={c.tertiary} strokeWidth="1.5"/>
    <circle cx="19" cy="12" r="1.5" stroke={c.tertiary} strokeWidth="1.5"/>
  </svg>
)

export const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={c.secondary} strokeWidth="1.5"/>
    <circle cx="8.5" cy="8.5" r="1.5" stroke={c.secondary} strokeWidth="1.5"/>
    <path d="M21 15l-5-5L5 21" stroke={c.secondary} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
