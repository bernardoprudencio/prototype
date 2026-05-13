import React, { useEffect, useRef, useState } from 'react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import Chip from './Chip'
import { colors, typography } from '../tokens'
import {
  FAMILY_LABEL,
  FAMILY_ORDER,
  PRESET_LABEL,
  PRESET_ORDER,
  SERVICE_FAMILY,
  SERVICE_STATE,
  getFamilyServices,
  isFamilyInGeo,
} from '../data/sitterServices'

const Header = () => (
  <div style={{ paddingTop: 8, paddingBottom: 16 }}>
    <h2
      style={{
        margin: 0,
        fontFamily: typography.fontFamily,
        fontWeight: 600,
        fontSize: 20,
        lineHeight: 1.25,
        color: colors.primary,
      }}
    >
      Configure variants
    </h2>
    <div
      style={{
        marginTop: 4,
        fontFamily: typography.fontFamily,
        fontWeight: 400,
        fontSize: 14,
        lineHeight: 1.25,
        color: colors.tertiary,
      }}
    >
      Dev only — not in spec
    </div>
  </div>
)

const SectionLabel = ({ children, topPadding = 24 }) => (
  <div
    style={{
      paddingTop: topPadding,
      paddingBottom: 8,
      fontFamily: typography.fontFamily,
      fontWeight: 600,
      fontSize: 16,
      lineHeight: 1.25,
      color: colors.primary,
    }}
  >
    {children}
  </div>
)

const SubLabel = ({ children, topPadding = 16 }) => (
  <div
    style={{
      paddingTop: topPadding,
      paddingBottom: 4,
      fontFamily: typography.fontFamily,
      fontWeight: 600,
      fontSize: 14,
      lineHeight: 1.25,
      color: colors.tertiary,
    }}
  >
    {children}
  </div>
)

const ConfigRow = ({ label, children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingTop: 6,
      paddingBottom: 6,
    }}
  >
    <span
      style={{
        fontFamily: typography.fontFamily,
        fontWeight: 400,
        fontSize: 14,
        lineHeight: 1.25,
        color: colors.primary,
        flex: 1,
        minWidth: 0,
      }}
    >
      {label}
    </span>
    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{children}</div>
  </div>
)

export default function ServiceVariantConfigSheet({
  serviceStates,
  familyInGeo,
  onChangeServiceStates,
  onChangeFamilyInGeo,
  onApplyPreset,
  onReset,
  onDismiss,
}) {
  const [lastAppliedPreset, setLastAppliedPreset] = useState(null)
  const flashTimeoutRef = useRef(null)

  useEffect(
    () => () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current)
      }
    },
    [],
  )

  const setServiceState = (id, state) =>
    onChangeServiceStates({ ...serviceStates, [id]: state })

  const setFamilyGeo = (family, value) =>
    onChangeFamilyInGeo({ ...familyInGeo, [family]: value })

  const toggleFamilyGeo = (family, inGeo) => {
    setFamilyGeo(family, inGeo)
    if (!inGeo) {
      const services = getFamilyServices(family)
      const nextStates = { ...serviceStates }
      services.forEach((svc) => {
        nextStates[svc.id] = SERVICE_STATE.INACTIVE
      })
      onChangeServiceStates(nextStates)
    }
  }

  const handlePresetTap = (key) => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current)
    }
    setLastAppliedPreset(key)
    onApplyPreset(key)
    flashTimeoutRef.current = setTimeout(() => {
      setLastAppliedPreset(null)
      flashTimeoutRef.current = null
    }, 300)
  }

  return (
    <BottomSheet variant="full" onDismiss={onDismiss} header={<Header />}>
      {/* Geo availability */}
      <SectionLabel topPadding={8}>Geo availability</SectionLabel>
      {FAMILY_ORDER.filter((f) => f !== SERVICE_FAMILY.PET_SITTING).map((family) => {
        const inGeo = !!familyInGeo[family]
        return (
          <ConfigRow key={family} label={FAMILY_LABEL[family]}>
            <Chip
              label="In geo"
              selected={inGeo}
              checkmark
              size="small"
              onClick={() => toggleFamilyGeo(family, true)}
            />
            <Chip
              label="Not in geo"
              selected={!inGeo}
              checkmark
              size="small"
              onClick={() => toggleFamilyGeo(family, false)}
            />
          </ConfigRow>
        )
      })}

      {/* Quick presets */}
      <SectionLabel>Quick presets</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {PRESET_ORDER.map((key) => (
          <Chip
            key={key}
            label={PRESET_LABEL[key]}
            size="small"
            selected={lastAppliedPreset === key}
            onClick={() => handlePresetTap(key)}
          />
        ))}
      </div>

      {/* Per-service state */}
      <SectionLabel>Per-service state</SectionLabel>
      {FAMILY_ORDER.map((family) => {
        const services = getFamilyServices(family)
        return (
          <div key={family}>
            <SubLabel>{FAMILY_LABEL[family]}</SubLabel>
            {services.map((svc) => {
              const active = serviceStates[svc.id] === SERVICE_STATE.ACTIVE
              return (
                <ConfigRow key={svc.id} label={svc.label}>
                  <Chip
                    label="Active"
                    selected={active}
                    checkmark
                    size="small"
                    disabled={!isFamilyInGeo(family, familyInGeo)}
                    onClick={() => setServiceState(svc.id, SERVICE_STATE.ACTIVE)}
                  />
                  <Chip
                    label="Inactive"
                    selected={!active}
                    checkmark
                    size="small"
                    disabled={!isFamilyInGeo(family, familyInGeo)}
                    onClick={() => setServiceState(svc.id, SERVICE_STATE.INACTIVE)}
                  />
                </ConfigRow>
              )
            })}
          </div>
        )
      })}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 24,
          paddingBottom: 8,
        }}
      >
        <Button variant="flat" size="small" onClick={onReset}>
          Reset to default
        </Button>
        <Button variant="default" size="small" onClick={onDismiss}>
          Done
        </Button>
      </div>
    </BottomSheet>
  )
}
