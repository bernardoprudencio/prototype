// Sitter More menu — mirrors the production RxN sitter menu (Support Hub variant).
// Source: roverdotcom/web src/frontend/reactNativeApp/src/pages/more-menu/hooks/useSitterMenu.ts
// Icons sourced from roverdotcom/web src/frontend/icons/svg, brought into our icon library.
// Items intentionally skipped (require runtime conditions that don't apply in a prototype):
//   - Trainer profile, Pet Care credits / Bright Horizons, Stripe / under-review / needs-changes
//     warnings, Impressum, Global announcement.

import {
  SearchIcon, SettingsIcon, CreditCardIcon, ChartIcon,
  FavoriteIcon, PersonIcon, PetsIcon, HelpBubbleIcon, PromoIcon, EditIcon,
} from '../assets/icons'
import stackedCoinsImg from '../assets/img/graphic_stacked_coins.png'

const noop = () => {}

export const SITTER_MORE_MENU_BANNER = {
  title: 'Reach new clients',
  body: 'Give pet parents a $20 credit to try Rover.',
  image: stackedCoinsImg,
  onPress: noop,
}

export const SITTER_MORE_MENU = [
  {
    items: [
      { Icon: SearchIcon, title: 'Book a new service', onPress: noop },
    ],
  },
  {
    title: 'Your business',
    items: [
      { Icon: EditIcon,       title: 'Service settings',     onPress: noop },
      { Icon: CreditCardIcon, title: 'Payments',             onPress: noop },
      { Icon: ChartIcon,      title: 'Insights',             onPress: noop },
      { Icon: FavoriteIcon,   title: 'Promote your profile', onPress: noop },
    ],
  },
  {
    title: 'You',
    items: [
      { Icon: PersonIcon,      title: 'Profile',                    onPress: noop },
      { Icon: PetsIcon,        title: 'Your pets',                  onPress: noop },
      { Icon: SettingsIcon,    title: 'Settings',                   onPress: noop },
      { Icon: HelpBubbleIcon,  title: 'Help Center & Rover Support',onPress: noop },
    ],
  },
  {
    title: 'Promos',
    items: [
      { Icon: PromoIcon,      title: 'Apply promo codes',  onPress: noop },
    ],
  },
]
