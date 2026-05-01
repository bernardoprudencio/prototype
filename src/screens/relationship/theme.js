import { colors, typography, textStyles } from '../../tokens'

export const fontFamily = typography.fontFamily

// Local token aliases — all values sourced from central tokens (Phase 7: no hardcoded hex values)
export const R = {
  brand:       colors.brand,           brandLight:  colors.successBgLight,
  navy:        colors.primary,         navyMid:     colors.secondary,
  gray:        colors.tertiary,        grayMid:     colors.navigation,
  grayLight:   colors.disabledText,    border:      colors.borderInteractive,
  separator:   colors.border,          bg:          colors.bgSecondary,
  bgTertiary:  colors.bgTertiary,      white:       colors.white,
  blue:        colors.link,            blueLight:   colors.bgInfo,
  green:       colors.brand,           greenLight:  colors.successBgLight,
  success:     colors.success,   successBorder: colors.borderSuccess,
  red:         colors.destructive,     redLight:    colors.errorBgLight,    errorBorder: colors.borderError,
  highlight:   colors.border,
  amber:       colors.cautionText,           amberLight:  colors.yellow100,
  amberBorder: colors.borderCaution,     purple:      colors.brandSafety,
  purpleLight: colors.bgInfo,     cardBorder:  colors.border,
  disabled:    colors.bgTertiary,      disabledText:colors.disabledText,
}

export const labelSt = {
  ...textStyles.heading100,
  display: 'block', color: R.navyMid, marginBottom: 4,
}
