import { useEffect, useRef, useCallback } from 'react';
import type { MidiInputEvent } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

type Listener = (event: MidiInputEvent) => void;

interface KeyboardInputState {
  enabled: boolean;
}

export const useKeyboardInput = (state: KeyboardInputState) => {
  const listenersRef = useRef<Set<Listener>>(new Set());
  const heldRef = useRef<Set<string>>(new Set());
  const enabledRef = useRef(state.enabled);
  const keyMapRef = useRef<Record<string, number>>({});

  enabledRef.current = state.enabled;

  useEffect(() => {
    const sync = () => {
      keyMapRef.current = useSettingsStore.getState().keyMap;
    };
    sync();
    const unsub = useSettingsStore.subscribe(sync);
    return unsub;
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const note = keyMapRef.current[key];
      if (note === undefined) return;
      if (heldRef.current.has(key)) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      heldRef.current.add(key);
      e.preventDefault();
      const evt: MidiInputEvent = {
        note,
        velocity: 90,
        type: 'noteon',
        time: performance.now() / 1000,
      };
      listenersRef.current.forEach((l) => l(evt));
    };

    const onUp = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;
      const key = e.key.toLowerCase();
      const note = keyMapRef.current[key];
      if (note === undefined) return;
      if (!heldRef.current.has(key)) return;
      heldRef.current.delete(key);
      const evt: MidiInputEvent = {
        note,
        velocity: 0,
        type: 'noteoff',
        time: performance.now() / 1000,
      };
      listenersRef.current.forEach((l) => l(evt));
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      heldRef.current.clear();
    };
  }, []);

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return { subscribe };
};
