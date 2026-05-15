export type Hand = 'right' | 'left';
export type TrackAssignment = Hand | 'ignore';

export interface NoteEvent {
  note: number;
  time: number;
  duration: number;
  track: Hand;
  velocity: number;
  trackIndex: number;
}

export interface RawNote {
  note: number;
  time: number;
  duration: number;
  velocity: number;
  trackIndex: number;
}

export interface ParsedMidi {
  fileName: string;
  duration: number;
  tempo: number;
  trackCount: number;
  rawNotes: RawNote[];
  rawTracks: ParsedTrack[];
}

export interface ParsedTrack {
  index: number;
  name: string;
  noteCount: number;
  lowestNote: number;
  highestNote: number;
  averageNote: number;
}

export type GamePhase = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'finished';

export interface MidiInputEvent {
  note: number;
  velocity: number;
  type: 'noteon' | 'noteoff';
  time: number;
}
