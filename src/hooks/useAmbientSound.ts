"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AMBIENT_SOUNDS,
  AMBIENT_STORAGE_KEY,
  DEFAULT_AMBIENT_VOLUME,
} from "@/constants/ambientSounds";

const FADE_MS = 400;

interface StoredAmbient {
  soundId: string | null;
  volume: number;
}

function readStored(): StoredAmbient {
  if (typeof window === "undefined") {
    return { soundId: null, volume: DEFAULT_AMBIENT_VOLUME };
  }
  try {
    const raw = sessionStorage.getItem(AMBIENT_STORAGE_KEY);
    if (!raw) return { soundId: null, volume: DEFAULT_AMBIENT_VOLUME };
    const parsed = JSON.parse(raw) as Partial<StoredAmbient>;
    const soundId =
      parsed.soundId &&
      AMBIENT_SOUNDS.some((sound) => sound.id === parsed.soundId)
        ? parsed.soundId
        : null;
    const volume =
      typeof parsed.volume === "number"
        ? Math.min(1, Math.max(0, parsed.volume))
        : DEFAULT_AMBIENT_VOLUME;
    return { soundId, volume };
  } catch {
    return { soundId: null, volume: DEFAULT_AMBIENT_VOLUME };
  }
}

function writeStored(state: StoredAmbient) {
  try {
    sessionStorage.setItem(AMBIENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

function cancelFade(fadeRef: React.RefObject<number | null>) {
  if (fadeRef.current !== null) {
    window.clearInterval(fadeRef.current);
    fadeRef.current = null;
  }
}

function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  fadeRef: React.RefObject<number | null>,
  onDone?: () => void,
) {
  cancelFade(fadeRef);
  const steps = 12;
  const stepMs = FADE_MS / steps;
  let step = 0;
  audio.volume = from;

  fadeRef.current = window.setInterval(() => {
    step += 1;
    const t = step / steps;
    audio.volume = from + (to - from) * t;
    if (step >= steps) {
      cancelFade(fadeRef);
      audio.volume = to;
      onDone?.();
    }
  }, stepMs);
}

export function useAmbientSound(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [soundId, setSoundId] = useState<string | null>(
    () => readStored().soundId,
  );
  const [volume, setVolume] = useState(() => readStored().volume);
  const [playing, setPlaying] = useState(false);

  const activeSound = AMBIENT_SOUNDS.find((sound) => sound.id === soundId) ?? null;

  const stopPlayback = useCallback((fade = true) => {
    const audio = audioRef.current;
    if (!audio) {
      setPlaying(false);
      return;
    }
    cancelFade(fadeRef);
    if (!fade) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
      return;
    }
    fadeVolume(audio, audio.volume, 0, fadeRef, () => {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    });
  }, []);

  const startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeSound) return;

    audio.loop = true;
    audio.volume = 0;
    const playPromise = audio.play();
    setPlaying(true);
    playPromise
      .then(() => fadeVolume(audio, 0, volume, fadeRef))
      .catch(() => setPlaying(false));
  }, [activeSound, volume]);

  const selectSound = useCallback(
    (nextId: string | null) => {
      if (nextId === null) {
        stopPlayback(false);
        setSoundId(null);
        setPlaying(false);
        return;
      }

      if (nextId === soundId) {
        if (playing) stopPlayback();
        else startPlayback();
        return;
      }

      stopPlayback(false);
      setSoundId(nextId);
      setPlaying(true);
    },
    [playing, soundId, startPlayback, stopPlayback],
  );

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => !open);
  }, []);

  useEffect(() => {
    writeStored({ soundId, volume });
  }, [soundId, volume]);

  useEffect(() => {
    if (!enabled) {
      stopPlayback(false);
      setPanelOpen(false);
    }
  }, [enabled, stopPlayback]);

  useEffect(() => {
    cancelFade(fadeRef);
    if (!activeSound) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(activeSound.src);
    audio.preload = "auto";
    audioRef.current = audio;

    if (playing && enabled) {
      audio.loop = true;
      audio.volume = 0;
      audio
        .play()
        .then(() => fadeVolume(audio, 0, volume, fadeRef))
        .catch(() => setPlaying(false));
    }

    return () => {
      cancelFade(fadeRef);
      audio.pause();
      audio.src = "";
    };
  }, [activeSound?.id, activeSound?.src, enabled]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playing) return;
    audio.volume = volume;
  }, [volume, playing]);

  useEffect(
    () => () => {
      cancelFade(fadeRef);
      audioRef.current?.pause();
    },
    [],
  );

  return {
    panelOpen,
    soundId,
    volume,
    playing,
    activeSound,
    setVolume,
    selectSound,
    togglePanel,
    closePanel: () => setPanelOpen(false),
    stopPlayback,
  };
}
