import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGameStore, selectAccuracy, FEVER_MULTIPLIER } from '../../stores/gameStore';
import { comboMultiplier } from '../../utils/timingUtils';

const FEVER_THRESHOLD = 50;
const NEXT_THRESHOLDS = [10, 25, 50];

const nextThreshold = (combo: number): number => {
  for (const t of NEXT_THRESHOLDS) if (combo < t) return t;
  return FEVER_THRESHOLD;
};

export const ScoreDisplay = () => {
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const phase = useGameStore((s) => s.phase);
  const fever = useGameStore((s) => s.fever);
  const accuracy = useGameStore(selectAccuracy);
  const baseMult = comboMultiplier(combo);
  const totalMult = fever ? baseMult * FEVER_MULTIPLIER : baseMult;

  const multRef = useRef<HTMLSpanElement>(null);
  const lastMult = useRef(totalMult);

  useEffect(() => {
    if (lastMult.current !== totalMult && multRef.current) {
      gsap.fromTo(
        multRef.current,
        { scale: 1.6, color: '#22C55E' },
        { scale: 1, color: 'inherit', duration: 0.45, ease: 'back.out(2)', clearProps: 'color' },
      );
    }
    lastMult.current = totalMult;
  }, [totalMult]);

  if (phase === 'idle') return null;

  const target = nextThreshold(combo);
  const fillPct = Math.min(100, (combo / target) * 100);

  return (
    <div className="pointer-events-none flex flex-col gap-1.5 px-6 py-2">
      <div className="flex items-center gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-key-white/40">Score</div>
          <div className="font-display text-2xl tabular-nums leading-tight">
            {score.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-key-white/40">Combo</div>
          <div className="font-display text-2xl tabular-nums leading-tight">
            {combo}
            {totalMult > 1 && (
              <span
                ref={multRef}
                className={`ml-2 inline-block text-base ${fever ? 'text-feedback-good' : 'text-hand-right'}`}
              >
                ×{totalMult}
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-key-white/40">Accuracy</div>
          <div className="font-display text-2xl tabular-nums leading-tight">
            {accuracy.toFixed(1)}%
          </div>
        </div>
        {fever && (
          <div className="font-display text-base tracking-widest text-feedback-good animate-pulse">
            ★ FEVER ★
          </div>
        )}
      </div>
      <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-bg-border">
        <div
          className={`h-full transition-all duration-150 ${
            fever
              ? 'bg-gradient-to-r from-feedback-good via-hand-right to-feedback-good'
              : combo >= 25
                ? 'bg-gradient-to-r from-hand-right to-feedback-perfect'
                : combo >= 10
                  ? 'bg-hand-right'
                  : 'bg-key-white/40'
          }`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
};
