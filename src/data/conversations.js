/**
 * Per-owner inbox thread metadata.
 * Derived from the hardcoded conversation threads in ConversationScreen.jsx.
 * Update both files together when conversation content changes.
 *
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
