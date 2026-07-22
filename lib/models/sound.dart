/// Catalog of ambient sounds bundled with the app.
///
/// The "more sounds" entries are sourced from the open-source Noice sound
/// library (https://trynoice.com, https://github.com/trynoice). The original
/// recordings are CC-BY licensed; attribution data is kept alongside each
/// sound and surfaced in the in-app "Sound credits" screen.
class SoundAttribution {
  final String sourceName;
  final String sourceUrl;
  final String author;
  final String authorUrl;
  final String license;
  final String licenseUrl;

  const SoundAttribution({
    required this.sourceName,
    required this.sourceUrl,
    required this.author,
    required this.authorUrl,
    required this.license,
    required this.licenseUrl,
  });
}

class Sound {
  final String id;
  final String name;
  final String asset; // path relative to the assets/ directory
  final String icon;
  final List<SoundAttribution> attributions;

  const Sound({
    required this.id,
    required this.name,
    required this.asset,
    required this.icon,
    this.attributions = const [],
  });
}

const String _ccBy3 = 'https://creativecommons.org/licenses/by/3.0/';
const String _ccBy4 = 'https://creativecommons.org/licenses/by/4.0/';

/// The three original sounds, shown as the featured row.
const List<Sound> kFeaturedSounds = [
  Sound(id: 'rain', name: 'Rain', asset: 'rain.mp3', icon: '🌧️'),
  Sound(id: 'thunder', name: 'Thunder', asset: 'thunder.mp3', icon: '⚡'),
  Sound(id: 'wind', name: 'Wind', asset: 'wind.mp3', icon: '🍃'),
];

/// Additional sounds shown in the "More sounds" section.
const List<Sound> kMoreSounds = [
  Sound(
    id: 'birds',
    name: 'Birds',
    asset: 'sounds/birds.mp3',
    icon: '🐦',
    attributions: [
      SoundAttribution(
        sourceName: 'the morning comes 20-5-11.wav',
        sourceUrl: 'https://freesound.org/s/120905/',
        author: 'Kyster',
        authorUrl: 'https://freesound.org/people/Kyster/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'seashore',
    name: 'Seashore',
    asset: 'sounds/seashore.mp3',
    icon: '🌊',
    attributions: [
      SoundAttribution(
        sourceName: 'oceanwavescrushing.wav',
        sourceUrl: 'https://freesound.org/s/48412/',
        author: 'Luftrum',
        authorUrl: 'https://freesound.org/people/Luftrum/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
      SoundAttribution(
        sourceName: 'calm waves sandy coast 140428_0181.wav',
        sourceUrl: 'https://freesound.org/s/236009/',
        author: 'klankbeeld',
        authorUrl: 'https://freesound.org/people/klankbeeld/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
      SoundAttribution(
        sourceName: 'CalmWaves SandBeach 04 LONG 130430_03.flac',
        sourceUrl: 'https://freesound.org/s/188475/',
        author: 'klankbeeld',
        authorUrl: 'https://freesound.org/people/klankbeeld/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
      SoundAttribution(
        sourceName: 'harbour waves calm 01.wav',
        sourceUrl: 'https://freesound.org/s/169181/',
        author: 'klankbeeld',
        authorUrl: 'https://freesound.org/people/klankbeeld/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'night',
    name: 'Night',
    asset: 'sounds/night.mp3',
    icon: '🌙',
    attributions: [
      SoundAttribution(
        sourceName: 'NC Night Forest.wav',
        sourceUrl: 'https://freesound.org/s/405515/',
        author: 'Lasdimot',
        authorUrl: 'https://freesound.org/people/Lasdimot/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'coffee_shop',
    name: 'Coffee Shop',
    asset: 'sounds/coffee_shop.mp3',
    icon: '☕',
    attributions: [
      SoundAttribution(
        sourceName: 'Coffee shop.aif',
        sourceUrl: 'https://freesound.org/s/255712/',
        author: 'grupo3sonidodiegetico',
        authorUrl: 'https://freesound.org/people/grupo3sonidodiegetico/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'purring_cat',
    name: 'Purring Cat',
    asset: 'sounds/purring_cat.mp3',
    icon: '🐱',
    attributions: [
      SoundAttribution(
        sourceName: 'Cat Purring / Cleaning Fur',
        sourceUrl: 'https://freesound.org/s/332274/',
        author: 'nebulousflynn',
        authorUrl: 'https://freesound.org/people/nebulousflynn/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'fan',
    name: 'Fan',
    asset: 'sounds/fan.mp3',
    icon: '🌀',
    attributions: [
      SoundAttribution(
        sourceName: 'fan.wav',
        sourceUrl: 'https://freesound.org/s/57019/',
        author: 'NoiseCollector',
        authorUrl: 'https://freesound.org/people/NoiseCollector/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'train',
    name: 'Train',
    asset: 'sounds/train.mp3',
    icon: '🚂',
    attributions: [
      SoundAttribution(
        sourceName: 'Train Wheels Ride outside Thailand',
        sourceUrl: 'https://freesound.org/s/170866/',
        author: 'YOH',
        authorUrl: 'https://freesound.org/people/YOH/',
        license: 'CC BY 4.0',
        licenseUrl: _ccBy4,
      ),
      SoundAttribution(
        sourceName: 'Train Horn',
        sourceUrl: 'https://freesound.org/s/248229/',
        author: 'CouleurCasquette',
        authorUrl: 'https://freesound.org/people/CouleurCasquette/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'palm_wind',
    name: 'Palm Wind',
    asset: 'sounds/wind_through_palm_trees.mp3',
    icon: '🌴',
    attributions: [
      SoundAttribution(
        sourceName: 'Palm Trees in the Wind.wav',
        sourceUrl: 'https://freesound.org/s/346106/',
        author: 'StrangeAcoustics',
        authorUrl: 'https://freesound.org/people/StrangeAcoustics/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'village_morning',
    name: 'Village Morning',
    asset: 'sounds/village_morning.mp3',
    icon: '🌅',
    attributions: [
      SoundAttribution(
        sourceName: 'early morning village alem 110417 7am.wav',
        sourceUrl: 'https://freesound.org/s/170930/',
        author: 'klankbeeld',
        authorUrl: 'https://freesound.org/people/klankbeeld/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'creaking_boat',
    name: 'Creaking Boat',
    asset: 'sounds/creaking_boat.mp3',
    icon: '⛵',
    attributions: [
      SoundAttribution(
        sourceName: 'Lake Waves 2.wav',
        sourceUrl: 'https://freesound.org/s/67884/',
        author: 'Benboncan',
        authorUrl: 'https://freesound.org/people/Benboncan/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'heartbeat',
    name: 'Heartbeat',
    asset: 'sounds/heartbeat.mp3',
    icon: '💓',
    attributions: [
      SoundAttribution(
        sourceName: 'Heartbeat_02.wav',
        sourceUrl: 'https://freesound.org/s/216219/',
        author: 'RSilveira_88',
        authorUrl: 'https://freesound.org/people/RSilveira_88/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'wall_clock',
    name: 'Wall Clock',
    asset: 'sounds/wall_clock.mp3',
    icon: '🕰️',
    attributions: [
      SoundAttribution(
        sourceName: 'Wall Clock Ticking.wav',
        sourceUrl: 'https://freesound.org/s/405423/',
        author: 'straget',
        authorUrl: 'https://freesound.org/people/straget/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'office',
    name: 'Office',
    asset: 'sounds/office.mp3',
    icon: '🏢',
    attributions: [
      SoundAttribution(
        sourceName: 'The Office',
        sourceUrl: 'https://freesound.org/s/211945/',
        author: 'qubodup',
        authorUrl: 'https://freesound.org/people/qubodup/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'quiet_conversations',
    name: 'Chatter',
    asset: 'sounds/quiet_conversations.mp3',
    icon: '🗣️',
    attributions: [
      SoundAttribution(
        sourceName: 'Crowd Talking During Interval',
        sourceUrl: 'https://freesound.org/s/163390/',
        author: 'blouhond',
        authorUrl: 'https://freesound.org/people/blouhond/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'air_travel',
    name: 'Air Travel',
    asset: 'sounds/air_travel.mp3',
    icon: '✈️',
    attributions: [
      SoundAttribution(
        sourceName: 'In-flight Ambience - Boeing 737-838',
        sourceUrl: 'https://freesound.org/s/47254/',
        author: 'digifishmusic',
        authorUrl: 'https://freesound.org/people/digifishmusic/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'electric_car',
    name: 'Car Ride',
    asset: 'sounds/electric_car.mp3',
    icon: '🚙',
    attributions: [
      SoundAttribution(
        sourceName: 'hybrid Toyota Yaris drive 190710_0056.flac',
        sourceUrl: 'https://freesound.org/s/476833/',
        author: 'klankbeeld',
        authorUrl: 'https://freesound.org/people/klankbeeld/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
  Sound(
    id: 'wolves',
    name: 'Wolves',
    asset: 'sounds/wolves.mp3',
    icon: '🐺',
    attributions: [
      SoundAttribution(
        sourceName: 'Wolves howling, small pack, frost snapping',
        sourceUrl: 'https://freesound.org/s/243495/',
        author: 'YleArkisto',
        authorUrl: 'https://freesound.org/people/YleArkisto/',
        license: 'CC BY 3.0',
        licenseUrl: _ccBy3,
      ),
    ],
  ),
];

/// Full catalog: featured sounds first, then the extra ones.
final List<Sound> kAllSounds = [...kFeaturedSounds, ...kMoreSounds];
