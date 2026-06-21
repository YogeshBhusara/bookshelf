"use client";

import type { AmbientSound } from "@/constants/ambientSounds";

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

interface AmbientPlayPillProps {
  open: boolean;
  playing: boolean;
  activeSound: AmbientSound | null;
  onClick: () => void;
}

/** Compact play/pause pill matching AddBookButton styling. */
export function AmbientPlayPill({
  open,
  playing,
  activeSound,
  onClick,
}: AmbientPlayPillProps) {
  const label = activeSound?.label ?? "Ambience";
  const showPause = playing && activeSound;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={showPause ? `Pause ${label}` : `Play ambient sounds`}
      aria-expanded={open}
      title={showPause ? `Playing ${label}` : "Ambient sounds while you read"}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition ${
        open || playing
          ? "border-strong bg-control-hover text-foreground"
          : "border-line bg-control text-secondary hover:border-strong hover:bg-control-hover hover:text-foreground"
      }`}
    >
      <span className="text-secondary">{showPause ? <PauseIcon /> : <PlayIcon />}</span>
      <span className="max-w-[7rem] truncate">{label}</span>
    </button>
  );
}
