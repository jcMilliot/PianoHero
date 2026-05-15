import { useCallback, useState } from 'react';
import { Midi } from '@tonejs/midi';
import type { ParsedMidi, ParsedTrack, RawNote } from '../types';

export interface MIDIFileState {
  parsing: boolean;
  error: string | null;
  midi: ParsedMidi | null;
}

const initialState: MIDIFileState = {
  parsing: false,
  error: null,
  midi: null,
};

export const useMIDIFile = () => {
  const [state, setState] = useState<MIDIFileState>(initialState);

  const parseFile = useCallback(async (file: File) => {
    setState({ parsing: true, error: null, midi: null });
    try {
      const buffer = await file.arrayBuffer();
      const midi = new Midi(buffer);

      const rawNotes: RawNote[] = [];
      const rawTracks: ParsedTrack[] = [];

      midi.tracks.forEach((track, index) => {
        if (track.notes.length === 0) return;

        let lowest = Infinity;
        let highest = -Infinity;
        let sum = 0;

        track.notes.forEach((n) => {
          if (n.midi < lowest) lowest = n.midi;
          if (n.midi > highest) highest = n.midi;
          sum += n.midi;
          rawNotes.push({
            note: n.midi,
            time: n.time,
            duration: n.duration,
            velocity: Math.round(n.velocity * 127),
            trackIndex: index,
          });
        });

        rawTracks.push({
          index,
          name: track.name || `Piste ${index + 1}`,
          noteCount: track.notes.length,
          lowestNote: lowest,
          highestNote: highest,
          averageNote: sum / track.notes.length,
        });
      });

      rawNotes.sort((a, b) => a.time - b.time);

      const tempo = midi.header.tempos[0]?.bpm ?? 120;

      const parsed: ParsedMidi = {
        fileName: file.name,
        duration: midi.duration,
        tempo,
        trackCount: rawTracks.length,
        rawNotes,
        rawTracks,
      };

      setState({ parsing: false, error: null, midi: parsed });
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de parsing MIDI.';
      setState({ parsing: false, error: message, midi: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, parseFile, reset };
};
