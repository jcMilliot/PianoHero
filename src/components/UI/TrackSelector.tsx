import type { ParsedTrack, TrackAssignment } from '../../types';
import { noteToName } from '../../utils/midiUtils';
import type { AssignmentMap } from '../../utils/trackAssignment';

interface Props {
  tracks: ParsedTrack[];
  assignment: AssignmentMap;
  onChange: (next: AssignmentMap) => void;
}

const OPTIONS: { value: TrackAssignment; label: string; cls: string }[] = [
  { value: 'right', label: 'Main D', cls: 'bg-hand-right/30 text-hand-right border-hand-right/40' },
  { value: 'left', label: 'Main G', cls: 'bg-hand-left/30 text-hand-left border-hand-left/40' },
  { value: 'ignore', label: 'Ignorer', cls: 'bg-bg-border/40 text-key-white/50 border-bg-border' },
];

export const TrackSelector = ({ tracks, assignment, onChange }: Props) => {
  const update = (idx: number, value: TrackAssignment) => {
    onChange({ ...assignment, [idx]: value });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-widest text-key-white/40">Pistes</h3>
      {tracks.map((t) => {
        const current = assignment[t.index] ?? 'ignore';
        return (
          <div
            key={t.index}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-bg-border px-4 py-2 text-sm"
          >
            <div className="flex-1 min-w-[180px]">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-key-white/50">
                {t.noteCount} notes — {noteToName(t.lowestNote)} → {noteToName(t.highestNote)}
              </div>
            </div>
            <div className="flex gap-1">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update(t.index, opt.value)}
                  className={`
                    rounded-md border px-3 py-1 text-xs font-display transition-colors
                    ${current === opt.value ? opt.cls : 'border-bg-border text-key-white/60 hover:bg-bg-surface'}
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
