// ─── Service definitions ──────────────────────────────────────────────────────

export const SERVICES = [
  { id: 'boarding',      label: 'Boarding',       icon: '🏠', desc: "Overnight at sitter's home", type: 'overnight' },
  { id: 'house_sitting', label: 'House Sitting',  icon: '🛋️', desc: "Sitter stays at your home",  type: 'overnight' },
  { id: 'doggy_daycare', label: 'Doggy Day Care', icon: '☀️', desc: "Daytime at sitter's home",   type: 'daytime', hourBased: true },
  { id: 'drop_in',       label: 'Drop-In Visit',  icon: '🚪', desc: '30-min visit at your home',  type: 'daytime' },
  { id: 'dog_walking',   label: 'Dog Walking',    icon: '🦮', desc: '30 or 60-min walk',          type: 'daytime' },
]

export const DURATION_SHORT   = [{ label: '30 min', mins: 30 }, { label: '45 min', mins: 45 }, { label: '1 hr', mins: 60 }, { label: '2 hr', mins: 120 }]
export const DURATION_DAYCARE = [{ label: '4 hrs', mins: 240 }, { label: '8 hrs', mins: 480 }, { label: '12 hrs', mins: 720 }]

export const FREQ = [{ id: 'once', label: 'One-time' }, { id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }]

export const WEEKDAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const PET_EMOJIS = ['🐕', '🐈', '🐇', '🐦', '🐠', '🦎', '🐹', '🐾']
