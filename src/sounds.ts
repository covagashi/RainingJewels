import { AudioSource } from 'expo-audio';

export interface SoundAttribution {
  sourceName: string;
  sourceUrl: string;
  author: string;
  authorUrl: string;
  license: string;
  licenseUrl: string;
}

export interface Sound {
  id: string;
  name: string;
  icon: string;
  source: AudioSource;
  attributions: SoundAttribution[];
}

const CC_BY_3 = 'https://creativecommons.org/licenses/by/3.0/';
const CC_BY_4 = 'https://creativecommons.org/licenses/by/4.0/';
const GPL_3 = 'https://www.gnu.org/licenses/gpl-3.0.html';

/** Attribution for sounds recorded/produced by the Noice project itself. */
const NOICE_GPL = (soundName: string): SoundAttribution => ({
  sourceName: `${soundName} — Noice sound library`,
  sourceUrl: 'https://github.com/trynoice',
  author: 'Noice',
  authorUrl: 'https://trynoice.com',
  license: 'GPL-3.0',
  licenseUrl: GPL_3,
});

/** The three original sounds, shown as the featured row. */
export const FEATURED_SOUNDS: Sound[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: '🌧️',
    source: require('../assets/sounds/rain.mp3'),
    attributions: [],
  },
  {
    id: 'thunder',
    name: 'Thunder',
    icon: '⚡',
    source: require('../assets/sounds/thunder.mp3'),
    attributions: [],
  },
  {
    id: 'wind',
    name: 'Wind',
    icon: '🍃',
    source: require('../assets/sounds/wind.mp3'),
    attributions: [],
  },
];

/**
 * Additional sounds shown in the "More sounds" section.
 *
 * Sourced from the open-source Noice sound library
 * (https://trynoice.com, https://github.com/trynoice); original recordings
 * are CC-BY licensed and were edited into seamless loops by the Noice
 * project. Attributions are shown in the in-app "Sound credits" screen.
 */
export const MORE_SOUNDS: Sound[] = [
  {
    id: 'birds',
    name: 'Birds',
    icon: '🐦',
    source: require('../assets/sounds/birds.mp3'),
    attributions: [
      {
        sourceName: 'the morning comes 20-5-11.wav',
        sourceUrl: 'https://freesound.org/s/120905/',
        author: 'Kyster',
        authorUrl: 'https://freesound.org/people/Kyster/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'seashore',
    name: 'Seashore',
    icon: '🌊',
    source: require('../assets/sounds/seashore.mp3'),
    attributions: [
      {
        sourceName: 'oceanwavescrushing.wav',
        sourceUrl: 'https://freesound.org/s/48412/',
        author: 'Luftrum',
        authorUrl: 'https://freesound.org/people/Luftrum/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
      {
        sourceName: 'calm waves sandy coast 140428_0181.wav',
        sourceUrl: 'https://freesound.org/s/236009/',
        author: 'klankbeeld',
        authorUrl: 'https://freesound.org/people/klankbeeld/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
      {
        sourceName: 'CalmWaves SandBeach 04 LONG 130430_03.flac',
        sourceUrl: 'https://freesound.org/s/188475/',
        author: 'klankbeeld',
        authorUrl: 'https://freesound.org/people/klankbeeld/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
      {
        sourceName: 'harbour waves calm 01.wav',
        sourceUrl: 'https://freesound.org/s/169181/',
        author: 'klankbeeld',
        authorUrl: 'https://freesound.org/people/klankbeeld/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'night',
    name: 'Night',
    icon: '🌙',
    source: require('../assets/sounds/night.mp3'),
    attributions: [
      {
        sourceName: 'NC Night Forest.wav',
        sourceUrl: 'https://freesound.org/s/405515/',
        author: 'Lasdimot',
        authorUrl: 'https://freesound.org/people/Lasdimot/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'coffee_shop',
    name: 'Coffee Shop',
    icon: '☕',
    source: require('../assets/sounds/coffee_shop.mp3'),
    attributions: [
      {
        sourceName: 'Coffee shop.aif',
        sourceUrl: 'https://freesound.org/s/255712/',
        author: 'grupo3sonidodiegetico',
        authorUrl: 'https://freesound.org/people/grupo3sonidodiegetico/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'purring_cat',
    name: 'Purring Cat',
    icon: '🐱',
    source: require('../assets/sounds/purring_cat.mp3'),
    attributions: [
      {
        sourceName: 'Cat Purring / Cleaning Fur',
        sourceUrl: 'https://freesound.org/s/332274/',
        author: 'nebulousflynn',
        authorUrl: 'https://freesound.org/people/nebulousflynn/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'fan',
    name: 'Fan',
    icon: '🌀',
    source: require('../assets/sounds/fan.mp3'),
    attributions: [
      {
        sourceName: 'fan.wav',
        sourceUrl: 'https://freesound.org/s/57019/',
        author: 'NoiseCollector',
        authorUrl: 'https://freesound.org/people/NoiseCollector/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'train',
    name: 'Train',
    icon: '🚂',
    source: require('../assets/sounds/train.mp3'),
    attributions: [
      {
        sourceName: 'Train Wheels Ride outside Thailand',
        sourceUrl: 'https://freesound.org/s/170866/',
        author: 'YOH',
        authorUrl: 'https://freesound.org/people/YOH/',
        license: 'CC BY 4.0',
        licenseUrl: CC_BY_4,
      },
      {
        sourceName: 'Train Horn',
        sourceUrl: 'https://freesound.org/s/248229/',
        author: 'CouleurCasquette',
        authorUrl: 'https://freesound.org/people/CouleurCasquette/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'palm_wind',
    name: 'Palm Wind',
    icon: '🌴',
    source: require('../assets/sounds/wind_through_palm_trees.mp3'),
    attributions: [
      {
        sourceName: 'Palm Trees in the Wind.wav',
        sourceUrl: 'https://freesound.org/s/346106/',
        author: 'StrangeAcoustics',
        authorUrl: 'https://freesound.org/people/StrangeAcoustics/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'village_morning',
    name: 'Village Morning',
    icon: '🌅',
    source: require('../assets/sounds/village_morning.mp3'),
    attributions: [
      {
        sourceName: 'early morning village alem 110417 7am.wav',
        sourceUrl: 'https://freesound.org/s/170930/',
        author: 'klankbeeld',
        authorUrl: 'https://freesound.org/people/klankbeeld/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'creaking_boat',
    name: 'Creaking Boat',
    icon: '⛵',
    source: require('../assets/sounds/creaking_boat.mp3'),
    attributions: [
      {
        sourceName: 'Lake Waves 2.wav',
        sourceUrl: 'https://freesound.org/s/67884/',
        author: 'Benboncan',
        authorUrl: 'https://freesound.org/people/Benboncan/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    icon: '💓',
    source: require('../assets/sounds/heartbeat.mp3'),
    attributions: [
      {
        sourceName: 'Heartbeat_02.wav',
        sourceUrl: 'https://freesound.org/s/216219/',
        author: 'RSilveira_88',
        authorUrl: 'https://freesound.org/people/RSilveira_88/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'wall_clock',
    name: 'Wall Clock',
    icon: '🕰️',
    source: require('../assets/sounds/wall_clock.mp3'),
    attributions: [
      {
        sourceName: 'Wall Clock Ticking.wav',
        sourceUrl: 'https://freesound.org/s/405423/',
        author: 'straget',
        authorUrl: 'https://freesound.org/people/straget/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'office',
    name: 'Office',
    icon: '🏢',
    source: require('../assets/sounds/office.mp3'),
    attributions: [
      {
        sourceName: 'The Office',
        sourceUrl: 'https://freesound.org/s/211945/',
        author: 'qubodup',
        authorUrl: 'https://freesound.org/people/qubodup/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'quiet_conversations',
    name: 'Chatter',
    icon: '🗣️',
    source: require('../assets/sounds/quiet_conversations.mp3'),
    attributions: [
      {
        sourceName: 'Crowd Talking During Interval',
        sourceUrl: 'https://freesound.org/s/163390/',
        author: 'blouhond',
        authorUrl: 'https://freesound.org/people/blouhond/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'air_travel',
    name: 'Air Travel',
    icon: '✈️',
    source: require('../assets/sounds/air_travel.mp3'),
    attributions: [
      {
        sourceName: 'In-flight Ambience - Boeing 737-838',
        sourceUrl: 'https://freesound.org/s/47254/',
        author: 'digifishmusic',
        authorUrl: 'https://freesound.org/people/digifishmusic/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'electric_car',
    name: 'Car Ride',
    icon: '🚙',
    source: require('../assets/sounds/electric_car.mp3'),
    attributions: [
      {
        sourceName: 'hybrid Toyota Yaris drive 190710_0056.flac',
        sourceUrl: 'https://freesound.org/s/476833/',
        author: 'klankbeeld',
        authorUrl: 'https://freesound.org/people/klankbeeld/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'wolves',
    name: 'Wolves',
    icon: '🐺',
    source: require('../assets/sounds/wolves.mp3'),
    attributions: [
      {
        sourceName: 'Wolves howling, small pack, frost snapping',
        sourceUrl: 'https://freesound.org/s/243495/',
        author: 'YleArkisto',
        authorUrl: 'https://freesound.org/people/YleArkisto/',
        license: 'CC BY 3.0',
        licenseUrl: CC_BY_3,
      },
    ],
  },
  {
    id: 'campfire',
    name: 'Campfire',
    icon: '🔥',
    source: require('../assets/sounds/campfire.mp3'),
    attributions: [NOICE_GPL('Campfire')],
  },
  {
    id: 'crickets',
    name: 'Crickets',
    icon: '🦗',
    source: require('../assets/sounds/crickets.mp3'),
    attributions: [NOICE_GPL('Crickets')],
  },
  {
    id: 'water_stream',
    name: 'Stream',
    icon: '🏞️',
    source: require('../assets/sounds/water_stream.mp3'),
    attributions: [NOICE_GPL('Water Stream')],
  },
  {
    id: 'soft_wind',
    name: 'Soft Wind',
    icon: '🍂',
    source: require('../assets/sounds/soft_wind.mp3'),
    attributions: [NOICE_GPL('Soft Wind')],
  },
  {
    id: 'wind_chimes',
    name: 'Wind Chimes',
    icon: '🎐',
    source: require('../assets/sounds/wind_chimes.mp3'),
    attributions: [NOICE_GPL('Wind Chimes')],
  },
  {
    id: 'walking_in_snow',
    name: 'Snow Walk',
    icon: '❄️',
    source: require('../assets/sounds/walking_in_snow.mp3'),
    attributions: [NOICE_GPL('Walking in Snow')],
  },
  {
    id: 'public_library',
    name: 'Library',
    icon: '📚',
    source: require('../assets/sounds/public_library.mp3'),
    attributions: [NOICE_GPL('Public Library')],
  },
  {
    id: 'scuba_diving',
    name: 'Scuba',
    icon: '🤿',
    source: require('../assets/sounds/scuba_diving.mp3'),
    attributions: [NOICE_GPL('Scuba Diving')],
  },
  {
    id: 'white_noise',
    name: 'White Noise',
    icon: '🌫️',
    source: require('../assets/sounds/white_noise.mp3'),
    attributions: [NOICE_GPL('White Noise')],
  },
  {
    id: 'pink_noise',
    name: 'Pink Noise',
    icon: '🌸',
    source: require('../assets/sounds/pink_noise.mp3'),
    attributions: [NOICE_GPL('Pink Noise')],
  },
  {
    id: 'brownian_noise',
    name: 'Brown Noise',
    icon: '🟤',
    source: require('../assets/sounds/brownian_noise.mp3'),
    attributions: [NOICE_GPL('Brownian Noise')],
  },
];

export const ALL_SOUNDS: Sound[] = [...FEATURED_SOUNDS, ...MORE_SOUNDS];
