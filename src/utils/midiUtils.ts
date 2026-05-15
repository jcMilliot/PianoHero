const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const FIRST_NOTE = 21;
export const LAST_NOTE = 108;

export const isBlackKey = (note: number): boolean => {
  const pos = note % 12;
  return [1, 3, 6, 8, 10].includes(pos);
};

export const noteToName = (note: number): string => {
  const octave = Math.floor(note / 12) - 1;
  const name = NOTE_NAMES[note % 12];
  return `${name}${octave}`;
};
