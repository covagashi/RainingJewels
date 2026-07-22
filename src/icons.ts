import {
  AudioLines,
  AudioWaveform,
  Bell,
  Bird,
  BookOpen,
  Bug,
  Building2,
  Car,
  Cat,
  Clock,
  CloudLightning,
  CloudRain,
  Coffee,
  Fan,
  Fish,
  Flame,
  HeartPulse,
  Leaf,
  LucideIcon,
  MessagesSquare,
  Moon,
  PawPrint,
  Plane,
  Sailboat,
  Snowflake,
  Sunrise,
  TrainFront,
  TreePalm,
  Droplets,
  Waves,
  Wind,
} from 'lucide-react-native';

/**
 * Line-icon per sound id (replaces the emoji glyphs, which render with
 * platform-specific colors that clash with the monochrome palette).
 * Consumers: PlayerScreen tiles, CreditsModal entries.
 */
export const SOUND_ICONS: Record<string, LucideIcon> = {
  rain: CloudRain,
  thunder: CloudLightning,
  wind: Wind,
  birds: Bird,
  seashore: Waves,
  night: Moon,
  coffee_shop: Coffee,
  purring_cat: Cat,
  fan: Fan,
  train: TrainFront,
  palm_wind: TreePalm,
  village_morning: Sunrise,
  creaking_boat: Sailboat,
  heartbeat: HeartPulse,
  wall_clock: Clock,
  office: Building2,
  quiet_conversations: MessagesSquare,
  air_travel: Plane,
  electric_car: Car,
  wolves: PawPrint,
  campfire: Flame,
  crickets: Bug,
  water_stream: Droplets,
  soft_wind: Leaf,
  wind_chimes: Bell,
  walking_in_snow: Snowflake,
  public_library: BookOpen,
  scuba_diving: Fish,
  white_noise: AudioWaveform,
  pink_noise: AudioLines,
  brownian_noise: AudioLines,
};

/** Fallback for any sound id missing from the map. */
export const DEFAULT_SOUND_ICON: LucideIcon = AudioWaveform;

export function getSoundIcon(id: string): LucideIcon {
  return SOUND_ICONS[id] ?? DEFAULT_SOUND_ICON;
}
