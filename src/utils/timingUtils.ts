export type Judgment = 'perfect' | 'good' | 'ok' | 'miss';

export const TIMING_WINDOWS = {
  perfect: 0.04,
  good: 0.1,
  ok: 0.18,
} as const;

export const judgeDelta = (deltaSeconds: number): Judgment => {
  const abs = Math.abs(deltaSeconds);
  if (abs <= TIMING_WINDOWS.perfect) return 'perfect';
  if (abs <= TIMING_WINDOWS.good) return 'good';
  if (abs <= TIMING_WINDOWS.ok) return 'ok';
  return 'miss';
};

export const judgmentScore = (j: Judgment): number => {
  switch (j) {
    case 'perfect':
      return 300;
    case 'good':
      return 100;
    case 'ok':
      return 50;
    default:
      return 0;
  }
};

export const comboMultiplier = (combo: number): number => {
  if (combo >= 50) return 8;
  if (combo >= 25) return 4;
  if (combo >= 10) return 2;
  return 1;
};
