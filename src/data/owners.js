import { peopleImages, petImages } from '../assets/images'

export const PROTO_TODAY = new Date()

export const OWNERS = {
  owen: {
    id: 'owen',
    name: 'Owen O.',
    image: peopleImages.owen,
    service: 'Weekly 60 min walks',
    serviceDuration: 60,
    petNames: 'Koni, Burley',
    petImages: [petImages.koni, petImages.burley],
    address: '123 Fourth Ave, Seattle, WA',
    template: [
      { day: 'Monday',    time: '9:00 AM' },
      { day: 'Wednesday', time: '9:00 AM' },
      { day: 'Friday',    time: '9:00 AM' },
    ],
  },
  james: {
    id: 'james',
    name: 'James T.',
    image: peopleImages.james,
    service: 'Weekly 30 min walks',
    serviceDuration: 30,
    petNames: 'Archie',
    petImages: [petImages.archie],
    address: '450 Pine St, Seattle, WA',
    template: [
      { day: 'Tuesday',  time: '2:00 PM' },
      { day: 'Thursday', time: '2:00 PM' },
    ],
  },
  sarah: {
    id: 'sarah',
    name: 'Sarah S.',
    image: peopleImages.sarah,
    service: 'Weekly 30 min walks',
    serviceDuration: 30,
    petNames: 'Milo',
    petImages: [petImages.milo],
    address: '88 Union St, Seattle, WA',
    template: [
      { day: 'Monday',    time: '4:00 PM' },
      { day: 'Wednesday', time: '4:00 PM' },
      { day: 'Friday',    time: '4:00 PM' },
    ],
  },
}

export const PETS_SEED = [
  { id: 1, name: 'Louie', breed: 'German Shepherd', emoji: '🐕' },
  { id: 2, name: 'Mochi', breed: 'Scottish Fold',   emoji: '🐈' },
]
