import React from 'react'

/**
 * The empty state's illustration — a port of the POC's `DayCycleIllustration`
 * (`components/DayCycleIllustration.tsx`) frozen at its resting frame.
 *
 * The POC animates a celestial body along a parabolic arc on a 24s loop, driven
 * by three `@keyframes` blocks (`calendarCycleTravel` / `Rays` / `Bite`) that
 * Kibble's `sx` prop injects into a stylesheet. This prototype styles inline and
 * adds no CSS files, and `@keyframes` cannot be expressed in a `style` prop — so
 * what ports is the frame the POC itself shows to reduced-motion users: its
 * `@media (prefers-reduced-motion: reduce)` branch pins the travel translate to
 * (0, 0), the rays to `scale(1)`, and the bite to `opacity: 0`, which by the
 * component's own docstring is pixel-identical to `@rover/icons` `day.svg`.
 *
 * Every path below is that verbatim day.svg geometry: 8 ray paths, the evenodd
 * donut disc (outer r=5, inner r=3, centred at (16, 9)), and the horizon pair
 * painted last. The bite circle is dropped rather than rendered at zero opacity.
 */
export default function DayIllustration({ size = 24, color = '#404347' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 32 32" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Rays */}
      <path d="M16 0C15.4477 0 15 0.447715 15 1V2C15 2.55228 15.4477 3 16 3C16.5523 3 17 2.55228 17 2V1C17 0.447715 16.5523 0 16 0Z" fill={color} />
      <path d="M15 16C15 15.4477 15.4477 15 16 15C16.5523 15 17 15.4477 17 16V17C17 17.5523 16.5523 18 16 18C15.4477 18 15 17.5523 15 17V16Z" fill={color} />
      <path d="M22.3639 2.63603C21.9734 2.24551 21.3402 2.24551 20.9497 2.63603L20.2426 3.34314C19.8521 3.73366 19.8521 4.36683 20.2426 4.75735C20.6331 5.14788 21.2663 5.14788 21.6568 4.75735L22.3639 4.05024C22.7545 3.65972 22.7545 3.02656 22.3639 2.63603Z" fill={color} />
      <path d="M10.3431 13.2426C10.7336 12.8521 11.3668 12.8521 11.7573 13.2426C12.1478 13.6332 12.1478 14.2663 11.7573 14.6568L11.0502 15.3639C10.6597 15.7545 10.0265 15.7545 9.636 15.3639C9.24548 14.9734 9.24548 14.3403 9.636 13.9497L10.3431 13.2426Z" fill={color} />
      <path d="M7 9C7 9.55229 7.44772 10 8 10H9C9.55228 10 10 9.55229 10 9C10 8.44771 9.55229 8 9 8H8C7.44772 8 7 8.44771 7 9Z" fill={color} />
      <path d="M22.9999 10C22.4476 10 21.9999 9.55229 21.9999 9C21.9999 8.44771 22.4476 8 22.9999 8H23.9999C24.5522 8 24.9999 8.44771 24.9999 9C24.9999 9.55229 24.5522 10 23.9999 10H22.9999Z" fill={color} />
      <path d="M9.63603 2.63606C9.24551 3.02659 9.24551 3.65975 9.63603 4.05028L10.3431 4.75738C10.7337 5.14791 11.3668 5.14791 11.7574 4.75738C12.1479 4.36686 12.1479 3.73369 11.7574 3.34317L11.0502 2.63606C10.6597 2.24554 10.0266 2.24554 9.63603 2.63606Z" fill={color} />
      <path d="M20.2426 14.6568C19.852 14.2663 19.852 13.6331 20.2426 13.2426C20.6331 12.8521 21.2663 12.8521 21.6568 13.2426L22.3639 13.9497C22.7544 14.3402 22.7544 14.9734 22.3639 15.3639C21.9734 15.7544 21.3402 15.7544 20.9497 15.3639L20.2426 14.6568Z" fill={color} />
      {/* Disc */}
      <path fillRule="evenodd" clipRule="evenodd" d="M16 4C13.2385 4 11 6.23858 11 9C11 11.7614 13.2385 14 16 14C18.7614 14 21 11.7614 21 9C21 6.23858 18.7614 4 16 4ZM13 9C13 7.34315 14.3431 6 16 6C17.6568 6 19 7.34315 19 9C19 10.6569 17.6568 12 16 12C14.3431 12 13 10.6569 13 9Z" fill={color} />
      {/* Horizon lines — painted last so the disc appears to sit behind them */}
      <path d="M19.6472 23.0956C17.1658 24.2721 14.3063 24.3073 11.7976 23.1922L11.5629 23.0879C9.24761 22.0587 6.6726 21.7945 4.20151 22.3325L1.7767 22.8604C1.24622 22.9759 0.908332 23.5064 1.02201 24.0454C1.13569 24.5844 1.65788 24.9277 2.18836 24.8122L4.61316 24.2842C6.68173 23.8339 8.83729 24.0551 10.7754 24.9166L11.0101 25.0209C14.036 26.3659 17.4851 26.3234 20.478 24.9044C22.283 24.0486 24.3065 23.789 26.2642 24.1619L29.8365 24.8424C30.3697 24.944 30.883 24.5871 30.983 24.0454C31.083 23.5036 30.7318 22.9821 30.1985 22.8805L26.6263 22.2C24.265 21.7502 21.8243 22.0634 19.6472 23.0956Z" fill={color} />
      <path d="M19.6472 27.0956C17.1658 28.2721 14.3063 28.3073 11.7976 27.1922L11.5629 27.0879C9.24761 26.0587 6.6726 25.7945 4.20151 26.3325L1.7767 26.8604C1.24622 26.9759 0.908332 27.5064 1.02201 28.0454C1.13569 28.5844 1.65788 28.9277 2.18836 28.8122L4.61316 28.2842C6.68173 27.8339 8.83729 28.0551 10.7754 28.9166L11.0101 29.0209C14.036 30.3659 17.4851 30.3234 20.478 28.9044C22.283 28.0486 24.3065 27.789 26.2642 28.1619L29.8365 28.8424C30.3697 28.944 30.883 28.5871 30.983 28.0454C31.083 27.5036 30.7318 26.9821 30.1985 26.8805L26.6263 26.2C24.265 25.7502 21.8243 26.0634 19.6472 27.0956Z" fill={color} />
    </svg>
  )
}
