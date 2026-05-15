import { useCallback, useEffect, useRef } from 'react';
import type { NoteEvent } from '../types';

const midiToFreq = (note: number): number => 440 * Math.pow(2, (note - 69) / 12);

export interface AudioPreviewApi {
  setEnabled: (enabled: boolean) => void;
  setVolume: (v: number) => void;
  schedule: (notes: NoteEvent[], audioCtx: AudioContext, startAt: number) => void;
  stop: () => void;
}

interface ScheduledVoice {
  osc: OscillatorNode;
  gain: GainNode;
}

export const useAudioPreview = (): AudioPreviewApi => {
  const enabledRef = useRef(false);
  const volumeRef = useRef(0.3);
  const voicesRef = useRef<ScheduledVoice[]>([]);
  const masterRef = useRef<GainNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const stop = useCallback(() => {
    const now = ctxRef.current?.currentTime ?? 0;
    for (const v of voicesRef.current) {
      try {
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setValueAtTime(v.gain.gain.value, now);
        v.gain.gain.linearRampToValueAtTime(0, now + 0.05);
        v.osc.stop(now + 0.06);
      } catch {
        // already stopped
      }
    }
    voicesRef.current = [];
  }, []);

  const schedule = useCallback(
    (notes: NoteEvent[], audioCtx: AudioContext, startAt: number) => {
      stop();
      if (!enabledRef.current) return;
      ctxRef.current = audioCtx;

      if (!masterRef.current || masterRef.current.context !== audioCtx) {
        const m = audioCtx.createGain();
        m.connect(audioCtx.destination);
        masterRef.current = m;
      }
      masterRef.current.gain.value = volumeRef.current;

      for (const n of notes) {
        const onTime = startAt + n.time;
        const offTime = onTime + n.duration;
        if (offTime < audioCtx.currentTime) continue;

        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = midiToFreq(n.note);

        const gain = audioCtx.createGain();
        const peak = (n.velocity / 127) * 0.6;
        gain.gain.setValueAtTime(0, onTime);
        gain.gain.linearRampToValueAtTime(peak, onTime + 0.01);
        gain.gain.linearRampToValueAtTime(peak * 0.7, onTime + 0.05);
        gain.gain.setValueAtTime(peak * 0.7, Math.max(onTime + 0.05, offTime - 0.05));
        gain.gain.linearRampToValueAtTime(0, offTime);

        osc.connect(gain);
        gain.connect(masterRef.current);
        osc.start(onTime);
        osc.stop(offTime + 0.05);

        voicesRef.current.push({ osc, gain });
      }
    },
    [stop],
  );

  const setEnabled = useCallback(
    (e: boolean) => {
      enabledRef.current = e;
      if (!e) stop();
    },
    [stop],
  );

  const setVolume = useCallback((v: number) => {
    volumeRef.current = Math.max(0, Math.min(1, v));
    if (masterRef.current) masterRef.current.gain.value = volumeRef.current;
  }, []);

  useEffect(() => {
    return () => {
      stop();
      masterRef.current?.disconnect();
      masterRef.current = null;
    };
  }, [stop]);

  return { setEnabled, setVolume, schedule, stop };
};
