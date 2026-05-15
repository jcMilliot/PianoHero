import { useEffect, useRef, useState, useCallback } from 'react';
import type { MidiInputEvent } from '../types';

export interface MIDIInputState {
  supported: boolean;
  granted: boolean;
  devices: string[];
  error: string | null;
}

type Listener = (event: MidiInputEvent) => void;

export const useMIDIInput = () => {
  const [state, setState] = useState<MIDIInputState>({
    supported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
    granted: false,
    devices: [],
    error: null,
  });

  const listenersRef = useRef<Set<Listener>>(new Set());
  const accessRef = useRef<MIDIAccess | null>(null);

  const handleMessage = useCallback((event: MIDIMessageEvent) => {
    if (!event.data || event.data.length < 3) return;
    const [status, note, velocity] = event.data;
    const command = status & 0xf0;

    let type: MidiInputEvent['type'] | null = null;
    if (command === 0x90 && velocity > 0) type = 'noteon';
    else if (command === 0x80 || (command === 0x90 && velocity === 0)) type = 'noteoff';
    if (!type) return;

    const evt: MidiInputEvent = {
      note,
      velocity,
      type,
      time: performance.now() / 1000,
    };
    listenersRef.current.forEach((l) => l(evt));
  }, []);

  const refreshDevices = useCallback(
    (access: MIDIAccess) => {
      const inputs: string[] = [];
      access.inputs.forEach((input) => {
        inputs.push(input.name ?? 'Unknown device');
        input.onmidimessage = handleMessage;
      });
      setState((s) => ({ ...s, devices: inputs }));
    },
    [handleMessage],
  );

  useEffect(() => {
    if (!state.supported) {
      setState((s) => ({ ...s, error: 'Web MIDI API non supportée par ce navigateur (utilise Chrome ou Edge).' }));
      return;
    }

    let cancelled = false;

    navigator
      .requestMIDIAccess({ sysex: false })
      .then((access) => {
        if (cancelled) return;
        accessRef.current = access;
        setState((s) => ({ ...s, granted: true, error: null }));
        refreshDevices(access);
        access.onstatechange = () => refreshDevices(access);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Accès MIDI refusé.';
        setState((s) => ({ ...s, granted: false, error: message }));
      });

    return () => {
      cancelled = true;
      if (accessRef.current) {
        accessRef.current.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [state.supported, refreshDevices]);

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return { ...state, subscribe };
};
