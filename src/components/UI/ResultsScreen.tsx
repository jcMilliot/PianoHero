import { useGameStore, selectAccuracy } from '../../stores/gameStore';

const rankFor = (acc: number): string => {
  if (acc >= 95) return 'S';
  if (acc >= 85) return 'A';
  if (acc >= 70) return 'B';
  if (acc >= 50) return 'C';
  return 'D';
};

interface Props {
  onReplay: () => void;
  onChange: () => void;
}

export const ResultsScreen = ({ onReplay, onChange }: Props) => {
  const { score, maxCombo, counts } = useGameStore();
  const accuracy = useGameStore(selectAccuracy);
  const rank = rankFor(accuracy);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-base/90 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-bg-border bg-bg-surface p-8 text-center">
        <div className="font-display text-7xl text-hand-right">{rank}</div>
        <div className="mt-2 text-xs uppercase tracking-widest text-key-white/40">Rang</div>

        <dl className="mt-8 grid grid-cols-2 gap-4 text-left">
          <div>
            <dt className="text-xs uppercase text-key-white/40">Score</dt>
            <dd className="font-display text-2xl">{score.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-key-white/40">Accuracy</dt>
            <dd className="font-display text-2xl">{accuracy.toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-key-white/40">Max combo</dt>
            <dd className="font-display text-2xl">{maxCombo}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-key-white/40">Perfect</dt>
            <dd className="font-display text-2xl text-feedback-perfect">{counts.perfect}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-key-white/40">Good</dt>
            <dd className="font-display text-2xl text-feedback-good">{counts.good}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-key-white/40">Miss</dt>
            <dd className="font-display text-2xl text-feedback-miss">{counts.miss}</dd>
          </div>
        </dl>

        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-lg bg-hand-right px-5 py-2 font-display text-sm text-bg-base"
          >
            Rejouer
          </button>
          <button
            type="button"
            onClick={onChange}
            className="rounded-lg border border-bg-border px-5 py-2 font-display text-sm"
          >
            Autre morceau
          </button>
        </div>
      </div>
    </div>
  );
};
