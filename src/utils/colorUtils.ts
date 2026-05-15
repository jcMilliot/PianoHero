import type { Hand } from '../types';
import type { Judgment } from './timingUtils';

export const HAND_COLORS: Record<Hand, number> = {
  right: 0x4a9eff,
  left: 0xa855f7,
};

export const JUDGMENT_COLORS: Record<Judgment, number> = {
  perfect: 0x22c55e,
  good: 0xeab308,
  ok: 0x4a9eff,
  miss: 0xef4444,
};

export const KEY_WHITE = 0xe8e8f0;
export const KEY_BLACK = 0x1a1a2e;
export const STRIKE_LINE = 0x4a9eff;

interface ColorStop {
  midi: number;
  color: [number, number, number];
}

const PITCH_STOPS: ColorStop[] = [
  { midi: 24, color: [0xef, 0x44, 0x44] }, // C1 — rouge
  { midi: 48, color: [0xf9, 0x73, 0x16] }, // C3 — orange
  { midi: 60, color: [0xea, 0xb3, 0x08] }, // C4 — jaune
  { midi: 72, color: [0x22, 0xc5, 0x5e] }, // C5 — vert
  { midi: 96, color: [0x4a, 0x9e, 0xff] }, // C7 — bleu
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const pitchColor = (midi: number): number => {
  if (midi <= PITCH_STOPS[0].midi) {
    const [r, g, b] = PITCH_STOPS[0].color;
    return (r << 16) | (g << 8) | b;
  }
  if (midi >= PITCH_STOPS[PITCH_STOPS.length - 1].midi) {
    const [r, g, b] = PITCH_STOPS[PITCH_STOPS.length - 1].color;
    return (r << 16) | (g << 8) | b;
  }
  for (let i = 0; i < PITCH_STOPS.length - 1; i++) {
    const a = PITCH_STOPS[i];
    const b = PITCH_STOPS[i + 1];
    if (midi >= a.midi && midi <= b.midi) {
      const t = (midi - a.midi) / (b.midi - a.midi);
      const r = Math.round(lerp(a.color[0], b.color[0], t));
      const g = Math.round(lerp(a.color[1], b.color[1], t));
      const bl = Math.round(lerp(a.color[2], b.color[2], t));
      return (r << 16) | (g << 8) | bl;
    }
  }
  return 0xffffff;
};
