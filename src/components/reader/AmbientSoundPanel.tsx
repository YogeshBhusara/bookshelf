"use client";

import { useEffect, useRef } from "react";
import { AMBIENT_SOUNDS } from "@/constants/ambientSounds";

interface AmbientSoundPanelProps {
  open: boolean;
  soundId: string | null;
  volume: number;
  playing: boolean;
  onSelect: (id: string | null) => void;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
  className?: string;
}

export function AmbientSoundPanel({
  open,
  soundId,
  volume,
  playing,
  onSelect,
  onVolumeChange,
  onClose,
  className,
}: AmbientSoundPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={`reader-ambient absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-line bg-surface-elevated p-3 shadow-lg ${className ?? ""}`}
      role="dialog"
      aria-label="Ambient sounds"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Ambient sounds</p>
          <p className="text-xs text-subtle">Looping ambience while you read</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-xs text-subtle transition hover:bg-control-hover hover:text-foreground"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition ${
            soundId === null
              ? "bg-control-hover text-foreground"
              : "text-secondary hover:bg-control hover:text-foreground"
          }`}
        >
          <span className="text-base leading-none" aria-hidden>
            🔇
          </span>
          <span>Off</span>
        </button>

        {AMBIENT_SOUNDS.map((sound) => {
          const active = soundId === sound.id;
          const isPlaying = active && playing;
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => onSelect(sound.id)}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                active
                  ? "bg-control-hover text-foreground"
                  : "text-secondary hover:bg-control hover:text-foreground"
              }`}
              aria-pressed={active}
            >
              <span className="text-base leading-none" aria-hidden>
                {sound.icon}
              </span>
              <span className="min-w-0 flex-1 truncate">{sound.label}</span>
              {isPlaying ? (
                <span className="text-[10px] uppercase tracking-wide text-subtle">
                  On
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <label className="flex items-center gap-3 text-xs text-secondary">
          <span className="shrink-0">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            disabled={!soundId}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            className="h-1.5 min-w-0 flex-1 accent-[var(--accent)] disabled:opacity-40"
          />
          <span className="w-8 shrink-0 text-right tabular-nums text-subtle">
            {Math.round(volume * 100)}%
          </span>
        </label>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-subtle">
        Sounds from{" "}
        <a
          href="https://mixkit.co/free-sound-effects/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          Mixkit
        </a>{" "}
        (free license)
      </p>
    </div>
  );
}
