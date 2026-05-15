import { useEffect, useMemo, useRef } from 'react';
import type { NoteEvent } from '../types';
import { useGameStore } from '../stores/gameStore';
import {
  TIMING_WINDOWS,
  judgeDelta,
  judgmentScore,
  comboMultiplier,
  type Judgment,
} from '../utils/timingUtils';

export interface FeedbackEvent {
  judgment: Judgment;
  note: number;
  x: number;
  hand: 'right' | 'left';
}

interface EngineHandle {
  audioCtx: AudioContext;
  startAt: number | null;
  notes: NoteEvent[];
  missCursor: number;
  judgedNotes: Set<NoteEvent>;
}

interface UseGameEngineArgs {
  onFeedback?: (e: FeedbackEvent) => void;
  onHit?: (note: NoteEvent, j: Judgment) => void;
  latencyOffsetMs: number;
}

export interface GameEngineApi {
  loadNotes: (notes: NoteEvent[]) => void;
  start: () => Promise<void>;
  stop: () => void;
  currentTime: () => number | null;
  getAudioContext: () => AudioContext | null;
  getStartAt: () => number | null;
  handleNoteOn: (
    noteNumber: number,
    lookup: (note: number, time: number, window: number) => NoteEvent | null,
    now: number,
  ) => NoteEvent | null;
  tickMisses: (now: number) => void;
}

export const useGameEngine = ({
  onFeedback,
  onHit,
  latencyOffsetMs,
}: UseGameEngineArgs): GameEngineApi => {
  const handleRef = useRef<EngineHandle | null>(null);
  if (handleRef.current === null) {
    handleRef.current = {
      audioCtx: new AudioContext(),
      startAt: null,
      notes: [],
      missCursor: 0,
      judgedNotes: new Set(),
    };
  }

  const latencyRef = useRef(latencyOffsetMs);
  latencyRef.current = latencyOffsetMs;

  const onFeedbackRef = useRef(onFeedback);
  onFeedbackRef.current = onFeedback;
  const onHitRef = useRef(onHit);
  onHitRef.current = onHit;

  useEffect(() => {
    const ctx = handleRef.current?.audioCtx;
    return () => {
      ctx?.close().catch(() => undefined);
      handleRef.current = null;
    };
  }, []);

  const api = useMemo<GameEngineApi>(() => {
    const registerJudgment = (j: Judgment, points: number) =>
      useGameStore.getState().registerJudgment(j, points);

    return {
      loadNotes: (notes) => {
        const h = handleRef.current;
        if (!h) return;
        h.notes = notes;
        h.missCursor = 0;
        h.judgedNotes.clear();
      },

      start: async () => {
        const h = handleRef.current;
        if (!h) return;
        if (h.audioCtx.state === 'suspended') await h.audioCtx.resume();
        h.startAt = h.audioCtx.currentTime + 1.5;
        h.missCursor = 0;
        h.judgedNotes.clear();
        useGameStore.getState().setPhase('playing');
      },

      stop: () => {
        const h = handleRef.current;
        if (!h) return;
        h.startAt = null;
        useGameStore.getState().setPhase('finished');
      },

      currentTime: () => {
        const h = handleRef.current;
        if (!h || h.startAt === null) return null;
        return h.audioCtx.currentTime - h.startAt + latencyRef.current / 1000;
      },

      getAudioContext: () => handleRef.current?.audioCtx ?? null,
      getStartAt: () => handleRef.current?.startAt ?? null,

      handleNoteOn: (noteNumber, lookup, now) => {
        const h = handleRef.current;
        if (!h || h.startAt === null) return null;
        const target = lookup(noteNumber, now, TIMING_WINDOWS.ok);
        if (!target) return null;
        const judgment = judgeDelta(now - target.time);
        if (judgment === 'miss') return null;
        h.judgedNotes.add(target);
        const state = useGameStore.getState();
        const baseMult = comboMultiplier(state.combo);
        const feverMult = state.fever ? 3 : 1;
        const points = judgmentScore(judgment) * baseMult * feverMult;
        registerJudgment(judgment, points);
        onHitRef.current?.(target, judgment);
        onFeedbackRef.current?.({
          judgment,
          note: noteNumber,
          x: 0,
          hand: target.track,
        });
        return target;
      },

      tickMisses: (now) => {
        const h = handleRef.current;
        if (!h) return;
        const missThreshold = TIMING_WINDOWS.ok;
        while (h.missCursor < h.notes.length) {
          const note = h.notes[h.missCursor];
          if (note.time > now - missThreshold) break;
          if (!h.judgedNotes.has(note)) {
            registerJudgment('miss', 0);
            onFeedbackRef.current?.({
              judgment: 'miss',
              note: note.note,
              x: 0,
              hand: note.track,
            });
          }
          h.missCursor++;
        }

        if (
          h.startAt !== null &&
          h.notes.length > 0 &&
          now > h.notes[h.notes.length - 1].time + h.notes[h.notes.length - 1].duration + 1
        ) {
          h.startAt = null;
          useGameStore.getState().setPhase('finished');
        }
      },
    };
  }, []);

  return api;
};
