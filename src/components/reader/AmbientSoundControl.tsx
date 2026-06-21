"use client";

import { AmbientPlayPill } from "@/components/reader/AmbientPlayPill";
import { AmbientSoundPanel } from "@/components/reader/AmbientSoundPanel";
import type { useAmbientSound } from "@/hooks/useAmbientSound";

export type AmbientSoundApi = ReturnType<typeof useAmbientSound>;

interface AmbientSoundControlProps extends AmbientSoundApi {
  panelClassName?: string;
}

export function AmbientSoundControl({
  panelOpen,
  soundId,
  volume,
  playing,
  activeSound,
  setVolume,
  selectSound,
  togglePanel,
  closePanel,
  panelClassName,
}: AmbientSoundControlProps) {
  return (
    <div className="relative">
      <AmbientPlayPill
        open={panelOpen}
        playing={playing}
        activeSound={activeSound}
        onClick={togglePanel}
      />
      <AmbientSoundPanel
        open={panelOpen}
        soundId={soundId}
        volume={volume}
        playing={playing}
        onSelect={selectSound}
        onVolumeChange={setVolume}
        onClose={closePanel}
        className={panelClassName}
      />
    </div>
  );
}
