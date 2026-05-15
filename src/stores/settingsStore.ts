import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Hand } from '../types';

export type HandsDisplay = 'all' | 'right' | 'left';

export const DEFAULT_KEY_MAP: Record<string, number> = {
  q: 60, // C4
  z: 61,
  s: 62, // D4
  e: 63,
  d: 64, // E4
  f: 65, // F4
  t: 66,
  g: 67, // G4
  y: 68,
  h: 69, // A4
  u: 70,
  j: 71, // B4
  k: 72, // C5
  o: 73,
  l: 74, // D5
  p: 75,
  m: 76, // E5
};

interface SettingsState {
  lookAhead: number;
  latencyMs: number;
  audioPreview: boolean;
  audioVolume: number;
  keyboardFallback: boolean;
  keyMap: Record<string, number>;
  handsDisplay: HandsDisplay;
  enableParticles: boolean;
  enableTrails: boolean;
  enableShockwaves: boolean;
  enableFeverMode: boolean;
  enableVignette: boolean;
  showKeyLabels: boolean;

  setLookAhead: (v: number) => void;
  setLatencyMs: (v: number) => void;
  setAudioPreview: (v: boolean) => void;
  setAudioVolume: (v: number) => void;
  setKeyboardFallback: (v: boolean) => void;
  setKeyMap: (m: Record<string, number>) => void;
  rebindKey: (key: string, note: number) => void;
  unbindKey: (key: string) => void;
  resetKeyMap: () => void;
  setHandsDisplay: (v: HandsDisplay) => void;
  setEnableParticles: (v: boolean) => void;
  setEnableTrails: (v: boolean) => void;
  setEnableShockwaves: (v: boolean) => void;
  setEnableFeverMode: (v: boolean) => void;
  setEnableVignette: (v: boolean) => void;
  setShowKeyLabels: (v: boolean) => void;
  resetAll: () => void;
}

const DEFAULTS = {
  lookAhead: 3,
  latencyMs: 0,
  audioPreview: false,
  audioVolume: 0.3,
  keyboardFallback: false,
  keyMap: { ...DEFAULT_KEY_MAP },
  handsDisplay: 'all' as HandsDisplay,
  enableParticles: true,
  enableTrails: true,
  enableShockwaves: true,
  enableFeverMode: true,
  enableVignette: true,
  showKeyLabels: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setLookAhead: (v) => set({ lookAhead: v }),
      setLatencyMs: (v) => set({ latencyMs: v }),
      setAudioPreview: (v) => set({ audioPreview: v }),
      setAudioVolume: (v) => set({ audioVolume: Math.max(0, Math.min(1, v)) }),
      setKeyboardFallback: (v) => set({ keyboardFallback: v }),
      setKeyMap: (m) => set({ keyMap: m }),
      rebindKey: (key, note) =>
        set((s) => {
          const next = { ...s.keyMap };
          for (const k of Object.keys(next)) {
            if (next[k] === note) delete next[k];
          }
          next[key.toLowerCase()] = note;
          return { keyMap: next };
        }),
      unbindKey: (key) =>
        set((s) => {
          const next = { ...s.keyMap };
          delete next[key.toLowerCase()];
          return { keyMap: next };
        }),
      resetKeyMap: () => set({ keyMap: { ...DEFAULT_KEY_MAP } }),
      setHandsDisplay: (v) => set({ handsDisplay: v }),
      setEnableParticles: (v) => set({ enableParticles: v }),
      setEnableTrails: (v) => set({ enableTrails: v }),
      setEnableShockwaves: (v) => set({ enableShockwaves: v }),
      setEnableFeverMode: (v) => set({ enableFeverMode: v }),
      setEnableVignette: (v) => set({ enableVignette: v }),
      setShowKeyLabels: (v) => set({ showKeyLabels: v }),
      resetAll: () => set({ ...DEFAULTS, keyMap: { ...DEFAULT_KEY_MAP } }),
    }),
    {
      name: 'piano-hero-settings',
      version: 1,
    },
  ),
);

export const filterByHand = <T extends { track: Hand }>(
  items: T[],
  display: HandsDisplay,
): T[] => {
  if (display === 'all') return items;
  return items.filter((i) => i.track === display);
};
