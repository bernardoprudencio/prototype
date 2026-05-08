/**
 * Static chat history per owner, rendered in ConversationScreen.
 * Each item: { type: 'divider'|'bubble'|'banner'|'gap', ...props }
 */
export const CHAT_HISTORY = {
  owen: [
    { type: 'divider', label: 'Yesterday' },
    { type: 'bubble', text: "Hey! Are we still on for tomorrow at 9?", time: "4:32 PM" },
    { type: 'bubble', text: "Absolutely! See you then 🐾", time: "4:35 PM", isOwner: true, showCheck: true },
    { type: 'divider', label: 'Today' },
    { type: 'bubble', text: "Morning! Leashes are on the hook by the door. Burley's been a bit hyper today 😄", time: "8:52 AM" },
    { type: 'bubble', text: "On my way! Be there in a few.", time: "8:55 AM", isOwner: true, showCheck: true },
    { type: 'gap' },
    { type: 'banner', text: "Walk started at 9:04 AM, Mar 19", link: "See Rover Card" },
    { type: 'gap' },
    { type: 'bubble', text: "Both doing great! Koni's leading the way and Burley found a stick he absolutely won't let go of 😂", time: "9:28 AM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Haha that's so Burley. Thank you for the update!", time: "9:31 AM" },
    { type: 'gap', h: 4 },
    { type: 'banner', text: "Walk ended at 10:01 AM, Mar 19", link: "See Rover Card" },
    { type: 'gap' },
    { type: 'bubble', text: "They look completely worn out, thank you! 🐾", time: "10:05 AM" },
    { type: 'bubble', text: "Ha! They definitely earned it. See you next week!", time: "10:07 AM", isOwner: true, showCheck: true },
  ],
  james: [
    { type: 'divider', label: 'Yesterday' },
    { type: 'bubble', text: "Hey! Are you still on for noon today?", time: "11:30 AM" },
    { type: 'bubble', text: "Yes! Heading over around 11:55.", time: "11:32 AM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Just a heads up — Archie gets a bit shy with strangers at first", time: "11:45 AM" },
    { type: 'bubble', text: "Good to know, I'll take it slow with him 🐾", time: "11:48 AM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "He warms up fast once he's outside. The trail behind the building is his favorite", time: "11:51 AM" },
    { type: 'gap', h: 16 },
    { type: 'banner', text: "Walk started at 12:02 PM, Mar 18", link: "See Rover Card" },
    { type: 'gap', h: 24 },
    { type: 'banner', text: "Walk ended at 12:31 PM, Mar 18", link: "See Rover Card" },
    { type: 'gap', h: 16 },
    { type: 'bubble', text: "Thanks! How did he do?", time: "1:15 PM" },
    { type: 'bubble', text: "He was great once he warmed up! Really loved sniffing around the trail", time: "1:18 PM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Ha, that sounds exactly like him. Thanks again!", time: "1:20 PM" },
  ],
  sarah: [
    { type: 'divider', label: 'Mar 12' },
    { type: 'bubble', text: "Hi! Quick note — Milo's leash is in the basket by the front door", time: "3:42 PM" },
    { type: 'bubble', text: "Perfect, heading over now!", time: "3:45 PM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "He loves the park on Cedar St if you have time 🐾", time: "3:47 PM" },
    { type: 'bubble', text: "We'll definitely head there!", time: "3:48 PM", isOwner: true, showCheck: true },
    { type: 'gap', h: 16 },
    { type: 'banner', text: "Walk started at 4:03 PM, Mar 12", link: "See Rover Card" },
    { type: 'gap', h: 24 },
    { type: 'banner', text: "Walk ended at 4:33 PM, Mar 12", link: "See Rover Card" },
    { type: 'gap', h: 16 },
    { type: 'bubble', text: "Thank you! Was he a good boy?", time: "5:01 PM" },
    { type: 'bubble', text: "He was amazing! Made a few friends at the park 🐾", time: "5:04 PM", isOwner: true, showCheck: true },
    { type: 'bubble', text: "Oh that makes me so happy, thank you!", time: "5:06 PM" },
    { type: 'divider', label: 'Mar 13' },
    { type: 'bubble', text: "Hi! Just checking in — I didn't get a Rover Card notification. Was one started?", time: "10:12 AM" },
  ],
}

/**
 * Per-owner inbox thread metadata.
 * status: 'pending' | 'upcoming' | 'current' | 'past' | 'archived'
 */
export const INBOX_THREADS = [
  {
    ownerId: 'owen',
    status: 'current',
    lastMessage: {
      text: "Ha! They definitely earned it. See you next week!",
      sender: 'you',
      timestamp: 'Today 10:07 AM',
    },
    serviceLabel: 'Dog walking · repeats weekly',
    alert: null,
    unread: false,
  },
  {
    ownerId: 'james',
    status: 'current',
    lastMessage: {
      text: "Ha, that sounds exactly like him. Thanks again!",
      sender: 'James',
      timestamp: 'Yesterday 1:20 PM',
    },
    serviceLabel: 'Dog walking · repeats weekly',
    alert: null,
    unread: false,
  },
  {
    ownerId: 'sarah',
    status: 'current',
    lastMessage: {
      text: "Hi! Just checking in — I didn't get a Rover Card notification. Was one started?",
      sender: 'Sarah',
      timestamp: 'Mar 13 10:12 AM',
    },
    serviceLabel: 'Dog walking · repeats weekly',
    alert: null,
    unread: false,
  },
]
