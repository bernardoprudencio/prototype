import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, typography } from '../tokens'
import {
  BackIcon,
  BlockedIcon,
  BoardingIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  DaycareIcon,
  DropInIcon,
  HouseSitIcon,
  ListIcon,
  PersonIcon,
  WalkingIcon,
} from '../assets/icons'
import { SITTER_PROFILE, getServiceStatusLines } from '../data/sitterProfile'
import ChooseProfileSheet from '../components/ChooseProfileSheet'

// Service id → icon component. Each icon is hardcoded to the color that
// matches its current state (active/away/inactive) in the SITTER_PROFILE data.
const SERVICE_ICON_BY_ID = {
  boarding:      BoardingIcon,
  doggy_daycare: DaycareIcon,
  drop_in:       DropInIcon,
  dog_walking:   WalkingIcon,
  house_sitting: HouseSitIcon,
}

const COLOR_BY_TOKEN = {
  primary: colors.primary,
  secondary: colors.secondary,
  tertiary: colors.tertiary,
}

// ─── Section header (h1) ─────────────────────────────────────────────────────
const SectionHeader = ({ title, rightLinkLabel, onRightLink, topPadding = 24 }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingTop: topPadding,
      paddingBottom: 8,
    }}
  >
    <h1
      style={{
        fontFamily: typography.displayFamily,
        fontWeight: 600,
        fontSize: 20,
        lineHeight: 1.25,
        color: colors.primary,
        margin: 0,
      }}
    >
      {title}
    </h1>
    {rightLinkLabel && (
      <button
        type="button"
        onClick={onRightLink}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: typography.fontFamily,
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1.25,
          color: colors.link,
        }}
      >
        {rightLinkLabel}
      </button>
    )}
  </div>
)

// ─── Sub-section heading (e.g. "Services", "Profile") ────────────────────────
const SubHeading = ({ Icon, title, topPadding = 32 }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      paddingTop: topPadding,
      paddingBottom: 8,
    }}
  >
    <span
      style={{
        display: 'inline-flex',
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={24} color={colors.secondary} />
    </span>
    <span
      style={{
        fontFamily: typography.fontFamily,
        fontWeight: 600,
        fontSize: 16,
        lineHeight: 1.5,
        color: colors.primary,
      }}
    >
      {title}
    </span>
  </div>
)

// ─── Settings row ────────────────────────────────────────────────────────────
// Row-level dividers are intentionally absent — see plan iteration 2a. Section
// boundaries are conveyed by container-level `borderBottom` instead.
const SettingsRow = ({
  leftIcon,
  label,
  labelColor = colors.primary,
  sublabel,
  statusLines,
  rightItem,
  onPress,
}) => (
  <div
    onClick={onPress}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      paddingTop: 16,
      paddingBottom: 16,
      cursor: onPress ? 'pointer' : 'default',
    }}
  >
    {leftIcon && (
      <span
        style={{
          display: 'inline-flex',
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {leftIcon}
      </span>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
      <span
        style={{
          fontFamily: typography.fontFamily,
          fontWeight: 600,
          fontSize: 16,
          lineHeight: 1.25,
          color: labelColor,
        }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.25,
            color: colors.tertiary,
          }}
        >
          {sublabel}
        </span>
      )}
      {statusLines && statusLines.map((line, i) => (
        <span
          key={i}
          style={{
            fontFamily: typography.fontFamily,
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.25,
            color: COLOR_BY_TOKEN[line.color] ?? colors.tertiary,
          }}
        >
          {line.text}
        </span>
      ))}
    </div>
    {rightItem && (
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {rightItem}
      </div>
    )}
  </div>
)

const Chevron = () => <ChevronRightIcon />

// Section divider between top-level sections (Pet sitting / Business /
// About you / Destructive area). 40px of whitespace above and below so each
// section reads as its own block.
const SectionDivider = () => (
  <div
    style={{
      marginTop: 40,
      marginBottom: 40,
      borderTop: `1px solid ${colors.border}`,
      height: 0,
    }}
  />
)

export default function ServiceSettingsScreen() {
  const navigate = useNavigate()
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const onBack = () => navigate('/more')
  const openProfileSheet = () => setProfileSheetOpen(true)
  const closeProfileSheet = () => setProfileSheetOpen(false)
  const noop = () => {}

  const { services, profile, business } = SITTER_PROFILE

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.white }}>
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
          onClick={onBack}
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
          Service settings
        </h1>
      </div>

      {/* ── Body ── */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        {/* ── Pet sitting ── */}
        <div>
          <SectionHeader
            title="Pet sitting"
            rightLinkLabel="View profile"
            onRightLink={openProfileSheet}
            topPadding={40}
          />

          {/* Services sub-heading + 5 service rows */}
          <SubHeading Icon={ListIcon} title="Services" topPadding={32} />
          {services.map((svc) => {
            const ServiceIcon = SERVICE_ICON_BY_ID[svc.id]
            const onRowPress =
              svc.id === 'boarding'
                ? () => navigate('/service-settings/boarding')
                : noop
            return (
              <SettingsRow
                key={svc.id}
                leftIcon={ServiceIcon ? <ServiceIcon /> : null}
                label={svc.label}
                statusLines={getServiceStatusLines(svc)}
                rightItem={<Chevron />}
                onPress={onRowPress}
              />
            )
          })}

          {/* Profile sub-heading */}
          <SubHeading Icon={PersonIcon} title="Profile" topPadding={32} />
          <SettingsRow
            label="Information"
            sublabel="Edit your pet profile information"
            rightItem={<Chevron />}
            onPress={noop}
          />
          <SettingsRow
            label="Photos"
            sublabel="Manage your profile gallery"
            rightItem={<Chevron />}
            onPress={noop}
          />
          <SettingsRow
            label="Testimonials"
            sublabel="Ask people to write about your pet care experience."
            rightItem={profile.testimonialsComplete ? <CheckCircleIcon /> : <Chevron />}
            onPress={noop}
          />
        </div>

        <SectionDivider />

        {/* ── Business ── */}
        <div>
          <SectionHeader title="Business" topPadding={0} />

          <SettingsRow
            label="Availability"
            sublabel="Manage the availability for your pet sitting services"
            rightItem={<Chevron />}
            onPress={noop}
          />
          <SettingsRow
            label="Insights"
            sublabel="Check your profile and business performance"
            rightItem={<Chevron />}
            onPress={noop}
          />
          <SettingsRow
            label="Promote your profile"
            sublabel="Your profile link offers pet parents a $20 off their first booking with Rover."
            rightItem={<Chevron />}
            onPress={noop}
          />
          <SettingsRow
            label="Receive payments"
            sublabel="Update payment details on Stripe"
            rightItem={<Chevron />}
            onPress={noop}
          />
          <SettingsRow
            label="Background check"
            sublabel="You passed the background check"
            rightItem={business.backgroundCheckPassed ? <CheckCircleIcon /> : <Chevron />}
            onPress={noop}
          />
        </div>

        <SectionDivider />

        {/* ── About you ── */}
        <div>
          <SectionHeader
            title="About you"
            rightLinkLabel="View profile"
            onRightLink={noop}
            topPadding={0}
          />

          <SettingsRow
            label="Details"
            sublabel="Address, photo, email and age"
            rightItem={<Chevron />}
            onPress={noop}
          />
          <SettingsRow
            label="Pets"
            sublabel="Add your pets"
            rightItem={<Chevron />}
            onPress={noop}
          />
          <SettingsRow
            label="Phone numbers"
            sublabel="Edit your number and emergency contact"
            rightItem={<Chevron />}
            onPress={noop}
          />
          <SettingsRow
            label="Payment methods"
            sublabel="Default method for payments on Rover"
            rightItem={<Chevron />}
            onPress={noop}
          />
        </div>

        <SectionDivider />

        {/* ── Destructive area (last) ── */}
        <div style={{ paddingBottom: 40 }}>
          <SectionHeader title="Destructive area" topPadding={0} />
          <SettingsRow
            label="Stop providing services"
            labelColor={colors.destructive}
            sublabel="Confirm you no longer want to provide services on Rover"
            rightItem={<BlockedIcon />}
            onPress={noop}
          />
        </div>
      </div>

      {profileSheetOpen && <ChooseProfileSheet onDismiss={closeProfileSheet} />}
    </div>
  )
}
