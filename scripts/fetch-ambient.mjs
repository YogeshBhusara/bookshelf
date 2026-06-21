#!/usr/bin/env node
/**
 * Downloads Mixkit preview loops into public/ambient/.
 * License: https://mixkit.co/license/ (free for personal & commercial use)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "ambient");

const sounds = [
  {
    id: "rain",
    label: "Light rain",
    icon: "🌧️",
    mixkitId: 2393,
    mixkitSlug: "light-rain-loop",
    file: "rain.mp3",
  },
  {
    id: "forest-rain",
    label: "Forest rain",
    icon: "🌲",
    mixkitId: 1225,
    mixkitSlug: "forest-rain-loop",
    file: "forest-rain.mp3",
  },
  {
    id: "ocean",
    label: "Ocean waves",
    icon: "🌊",
    mixkitId: 1196,
    mixkitSlug: "sea-waves-loop",
    file: "ocean.mp3",
  },
  {
    id: "wind",
    label: "Windy meadow",
    icon: "🍃",
    mixkitId: 1233,
    mixkitSlug: "wind-in-the-forest-loop",
    file: "wind.mp3",
  },
  {
    id: "meadow",
    label: "Summer meadow",
    icon: "🦗",
    mixkitId: 1789,
    mixkitSlug: "summer-night-crickets-loop",
    file: "meadow.mp3",
  },
  {
    id: "fireplace",
    label: "Campfire",
    icon: "🔥",
    mixkitId: 1736,
    mixkitSlug: "campfire-night-wind",
    file: "fireplace.mp3",
  },
  {
    id: "cafe",
    label: "Café ambience",
    icon: "☕",
    mixkitId: 366,
    mixkitSlug: "hotel-conversation-and-laughter-with-dining-noise",
    file: "cafe.mp3",
  },
  {
    id: "thunder",
    label: "Thunderstorm",
    icon: "⛈️",
    mixkitId: 2402,
    mixkitSlug: "thunderstorm-and-rain-loop",
    file: "thunder.mp3",
  },
];

function previewUrl(mixkitId) {
  return `https://assets.mixkit.co/active_storage/sfx/${mixkitId}/${mixkitId}-preview.mp3`;
}

await mkdir(outDir, { recursive: true });

for (const sound of sounds) {
  const url = previewUrl(sound.mixkitId);
  process.stdout.write(`Fetching ${sound.label}… `);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`failed (${res.status})`);
    process.exitCode = 1;
    continue;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(outDir, sound.file), buffer);
  console.log(`${(buffer.length / 1024).toFixed(0)} KB`);
}

const manifest = {
  license: "Mixkit License — https://mixkit.co/license/",
  attribution: "Ambient loops from Mixkit (mixkit.co/free-sound-effects/)",
  sounds: sounds.map(({ id, label, icon, file, mixkitId, mixkitSlug }) => ({
    id,
    label,
    icon,
    file,
    mixkitId,
    mixkitSlug,
    src: `/ambient/${file}`,
  })),
};

await writeFile(
  path.join(outDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`\nWrote ${sounds.length} files to public/ambient/`);
