import { create } from 'zustand';
import type { GamePhase } from '../types';
import type { Judgment } from '../utils/timingUtils';

interface JudgmentCounts {
  perfect: number;
  good: number;
  ok: number;
  miss: number;
}

interface GameState {
  phase: GamePhase;
  score: number;
  combo: number;
  maxCombo: number;
  counts: JudgmentCounts;
  totalNotes: number;
  fever: boolean;
  feverEnabled: boolean;

  setPhase: (phase: GamePhase) => void;
  setFeverEnabled: (v: boolean) => void;
  reset: (totalNotes: number) => void;
  registerJudgment: (j: Judgment, points: number) => void;
}

const FEVER_THRESHOLD = 50;
export const FEVER_MULTIPLIER = 3;

const emptyCounts: JudgmentCounts = { perfect: 0, good: 0, ok: 0, miss: 0 };

export const useGameStore = create<GameState>((set) => ({
  phase: 'idle',
  score: 0,
  combo: 0,
  maxCombo: 0,
  counts: { ...emptyCounts },
  totalNotes: 0,
  fever: false,
  feverEnabled: true,

  setPhase: (phase) => set({ phase }),
  setFeverEnabled: (v) => set({ feverEnabled: v, fever: v ? false : false }),

  reset: (totalNotes) =>
    set({
      phase: 'ready',
      score: 0,
      combo: 0,
      maxCombo: 0,
      counts: { ...emptyCounts },
      totalNotes,
      fever: false,
    }),

  registerJudgment: (j, points) =>
    set((s) => {
      const combo = j === 'miss' ? 0 : s.combo + 1;
      const fever = s.feverEnabled && combo >= FEVER_THRESHOLD;
      return {
        score: s.score + points,
        combo,
        maxCombo: Math.max(s.maxCombo, combo),
        counts: { ...s.counts, [j]: s.counts[j] + 1 },
        fever,
      };
    }),
}));

export const selectAccuracy = (s: GameState): number => {
  const judged = s.counts.perfect + s.counts.good + s.counts.ok + s.counts.miss;
  if (judged === 0) return 0;
  return ((s.counts.perfect + s.counts.good) / judged) * 100;
};
