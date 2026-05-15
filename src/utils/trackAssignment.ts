import type { Hand, NoteEvent, ParsedTrack, RawNote, TrackAssignment } from '../types';

export type AssignmentMap = Record<number, TrackAssignment>;

// MIDI note 60 = middle C, used as split point for single-track hand separation
const SPLIT_NOTE = 60;

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

const isSingleTrack = (raw: RawNote[], assignment: AssignmentMap): boolean => {
  const activeIndices = new Set(
    raw.map((n) => n.trackIndex).filter((i) => assignment[i] && assignment[i] !== 'ignore'),
  );
  return activeIndices.size === 1;
};

export const buildNoteEvents = (
  raw: RawNote[],
  assignment: AssignmentMap,
): NoteEvent[] => {
  const singleTrack = isSingleTrack(raw, assignment);
  const out: NoteEvent[] = [];

  for (const n of raw) {
    const a = assignment[n.trackIndex];
    if (!a || a === 'ignore') continue;

    // For single-track MIDIs, split by pitch instead of track assignment
    const hand: Hand = singleTrack
      ? n.note >= SPLIT_NOTE ? 'right' : 'left'
      : (a as Hand);

    out.push({
      note: n.note,
      time: n.time,
      duration: n.duration,
      track: hand,
      velocity: n.velocity,
      trackIndex: n.trackIndex,
    });
  }
  return out;
};
