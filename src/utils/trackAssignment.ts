import type { NoteEvent, ParsedTrack, RawNote, TrackAssignment } from '../types';

export type AssignmentMap = Record<number, TrackAssignment>;

export const autoAssign = (tracks: ParsedTrack[]): AssignmentMap => {
  const map: AssignmentMap = {};
  if (tracks.length === 0) return map;
  if (tracks.length === 1) {
    map[tracks[0].index] = 'right';
    return map;
  }

  const sorted = [...tracks].sort((a, b) => b.averageNote - a.averageNote);
  map[sorted[0].index] = 'right';
  map[sorted[1].index] = 'left';
  for (let i = 2; i < sorted.length; i++) {
    map[sorted[i].index] = 'ignore';
  }
  return map;
};

export const buildNoteEvents = (
  raw: RawNote[],
  assignment: AssignmentMap,
): NoteEvent[] => {
  const out: NoteEvent[] = [];
  for (const n of raw) {
    const a = assignment[n.trackIndex];
    if (!a || a === 'ignore') continue;
    out.push({
      note: n.note,
      time: n.time,
      duration: n.duration,
      track: a,
      velocity: n.velocity,
      trackIndex: n.trackIndex,
    });
  }
  return out;
};
