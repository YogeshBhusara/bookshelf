export interface AmbientSound {
  id: string;
  label: string;
  icon: string;
  src: string;
  mixkitSlug: string;
}

/** Looping ambience tracks bundled in /public/ambient (Mixkit License). */
export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: "rain",
    label: "Light rain",
    icon: "🌧️",
    src: "/ambient/rain.mp3",
    mixkitSlug: "light-rain-loop",
  },
  {
    id: "forest-rain",
    label: "Forest rain",
    icon: "🌲",
    src: "/ambient/forest-rain.mp3",
    mixkitSlug: "forest-rain-loop",
  },
  {
    id: "ocean",
    label: "Ocean waves",
    icon: "🌊",
    src: "/ambient/ocean.mp3",
    mixkitSlug: "sea-waves-loop",
  },
  {
    id: "wind",
    label: "Windy meadow",
    icon: "🍃",
    src: "/ambient/wind.mp3",
    mixkitSlug: "wind-in-the-forest-loop",
  },
  {
    id: "meadow",
    label: "Summer meadow",
    icon: "🦗",
    src: "/ambient/meadow.mp3",
    mixkitSlug: "summer-night-crickets-loop",
  },
  {
    id: "fireplace",
    label: "Campfire",
    icon: "🔥",
    src: "/ambient/fireplace.mp3",
    mixkitSlug: "campfire-night-wind",
  },
  {
    id: "cafe",
    label: "Café ambience",
    icon: "☕",
    src: "/ambient/cafe.mp3",
    mixkitSlug: "hotel-conversation-and-laughter-with-dining-noise",
  },
  {
    id: "thunder",
    label: "Thunderstorm",
    icon: "⛈️",
    src: "/ambient/thunder.mp3",
    mixkitSlug: "thunderstorm-and-rain-loop",
  },
];

export const AMBIENT_STORAGE_KEY = "bookshelf-ambient";

export const DEFAULT_AMBIENT_VOLUME = 0.45;
