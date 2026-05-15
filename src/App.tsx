import { useEffect, useMemo, useState } from 'react';
import { useMIDIInput } from './hooks/useMIDIInput';
import { useMIDIFile } from './hooks/useMIDIFile';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import { SongImporter } from './components/UI/SongImporter';
import { SongLibrary } from './components/UI/SongLibrary';
import { ScoreDisplay } from './components/UI/ScoreDisplay';
import { ResultsScreen } from './components/UI/ResultsScreen';
import { TrackSelector } from './components/UI/TrackSelector';
import { HelpModal } from './components/UI/HelpModal';
import { SettingsPanel } from './components/UI/SettingsPanel';
import { GameCanvas } from './components/GameCanvas/GameCanvas';
import { useGameStore } from './stores/gameStore';
import { useSettingsStore, filterByHand } from './stores/settingsStore';
import { autoAssign, buildNoteEvents, type AssignmentMap } from './utils/trackAssignment';
import { FIRST_NOTE, LAST_NOTE } from './utils/midiUtils';

type View = 'home' | 'play';

const VIEWPORT_PADDING = 4;

function App() {
  const midiInput = useMIDIInput();
  const midiFile = useMIDIFile();
  const phase = useGameStore((s) => s.phase);
  const reset = useGameStore((s) => s.reset);

  const lookAhead = useSettingsStore((s) => s.lookAhead);
  const latencyMs = useSettingsStore((s) => s.latencyMs);
  const audioPreviewEnabled = useSettingsStore((s) => s.audioPreview);
  const audioVolume = useSettingsStore((s) => s.audioVolume);
  const keyboardFallback = useSettingsStore((s) => s.keyboardFallback);
  const handsDisplay = useSettingsStore((s) => s.handsDisplay);
  const feverModeEnabled = useSettingsStore((s) => s.enableFeverMode);
  const setFeverEnabled = useGameStore((s) => s.setFeverEnabled);

  useEffect(() => {
    setFeverEnabled(feverModeEnabled);
  }, [feverModeEnabled, setFeverEnabled]);

  const [view, setView] = useState<View>('home');
  const [assignment, setAssignment] = useState<AssignmentMap>({});
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);

  const keyboardInput = useKeyboardInput({ enabled: keyboardFallback });

  useEffect(() => {
    if (midiFile.midi) {
      const auto = autoAssign(midiFile.midi.rawTracks);
      setAssignment(auto);
    }
  }, [midiFile.midi]);

  const notes = useMemo(() => {
    if (!midiFile.midi) return [];
    const all = buildNoteEvents(midiFile.midi.rawNotes, assignment);
    return filterByHand(all, handsDisplay);
  }, [midiFile.midi, assignment, handsDisplay]);

  const viewportRange = useMemo(() => {
    if (notes.length === 0) {
      return { firstNote: FIRST_NOTE, lastNote: LAST_NOTE };
    }
    let lo = Infinity;
    let hi = -Infinity;
    for (const n of notes) {
      if (n.note < lo) lo = n.note;
      if (n.note > hi) hi = n.note;
    }
    return {
      firstNote: Math.max(FIRST_NOTE, Math.floor(lo) - VIEWPORT_PADDING),
      lastNote: Math.min(LAST_NOTE, Math.ceil(hi) + VIEWPORT_PADDING),
    };
  }, [notes]);

  const inputSources = useMemo(
    () => [
      { subscribe: midiInput.subscribe },
      { subscribe: keyboardInput.subscribe },
    ],
    [midiInput.subscribe, keyboardInput.subscribe],
  );

  const status = midiInput.error
    ? { color: 'bg-feedback-miss', label: midiInput.error }
    : midiInput.granted && midiInput.devices.length > 0
      ? { color: 'bg-feedback-perfect', label: midiInput.devices.join(', ') }
      : midiInput.granted
        ? { color: 'bg-feedback-good', label: 'Aucun device MIDI' }
        : { color: 'bg-key-white/40', label: 'Connexion MIDI…' };

  const canPlay = notes.length > 0;

  const handleLoadSavedSong = (fileName: string, fileBlob: Blob) => {
    midiFile.parseFile(new File([fileBlob], fileName, { type: 'audio/midi' }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-key-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-bg-border px-6 py-3">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setShowLibrary((v) => !v)}
            className={`flex h-7 w-7 items-center justify-center rounded-full border
                       border-bg-border transition
                       ${showLibrary ? 'bg-hand-right/20 text-hand-right' : 'text-key-white/70 hover:bg-bg-surface hover:text-hand-right'}`}
            aria-label="Bibliothèque de musiques"
            title="Musiques sauvegardées"
          >
            ♪
          </button>
          <h1 className="font-display text-xl tracking-wider">
            PIANO <span className="text-hand-right">HERO</span>
          </h1>
          {view === 'play' && <ScoreDisplay />}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {view === 'play' && (
            <button
              type="button"
              onClick={() => setView('home')}
              className="rounded-md border border-bg-border px-3 py-1 text-xs hover:bg-bg-surface"
            >
              Quitter
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
            <span className="text-key-white/70">{status.label}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full border
                       border-bg-border text-key-white/70 hover:bg-bg-surface
                       hover:text-hand-right transition"
            aria-label="Réglages"
            title="Réglages"
          >
            ⚙
          </button>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full border
                       border-bg-border font-display text-sm text-key-white/70
                       hover:bg-bg-surface hover:text-hand-right transition"
            aria-label="Aide"
            title="Aide & documentation"
          >
            ?
          </button>
        </div>
      </header>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      <div className="flex flex-1 overflow-hidden">
        {showLibrary && view !== 'play' && (
          <SongLibrary onSelectSong={handleLoadSavedSong} />
        )}

        {view === 'home' ? (
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
              <SongImporter onFile={midiFile.parseFile} parsing={midiFile.parsing} />

              {midiFile.error && (
                <div className="rounded-lg border border-feedback-miss/40 bg-feedback-miss/10 p-4 text-feedback-miss">
                  {midiFile.error}
                </div>
              )}

              {midiFile.midi && (
                <section className="rounded-2xl border border-bg-border bg-bg-surface p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-lg text-hand-right">
                        {midiFile.midi.fileName}
                      </h2>
                      <p className="mt-1 text-sm text-key-white/50">
                        {midiFile.midi.duration.toFixed(1)}s ·{' '}
                        {Math.round(midiFile.midi.tempo)} BPM ·{' '}
                        {midiFile.midi.rawNotes.length} notes ·{' '}
                        <span className="text-key-white">{notes.length} jouables</span>
                        {handsDisplay !== 'all' && (
                          <span className="text-hand-right">
                            {' '}
                            · filtre {handsDisplay === 'right' ? 'Main D' : 'Main G'}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canPlay}
                      onClick={() => {
                        reset(notes.length);
                        setView('play');
                      }}
                      className="rounded-lg bg-hand-right px-5 py-2 font-display text-sm text-bg-base
                                 hover:brightness-110 transition disabled:opacity-40
                                 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Jouer
                    </button>
                  </div>

                  <div className="mt-6">
                    <TrackSelector
                      tracks={midiFile.midi.rawTracks}
                      assignment={assignment}
                      onChange={setAssignment}
                    />
                  </div>
                </section>
              )}
            </div>
          </main>
        ) : (
          <div className="relative flex-1">
            <GameCanvas
              notes={notes}
              lookAhead={lookAhead}
              latencyOffsetMs={latencyMs}
              inputSources={inputSources}
              viewportRange={viewportRange}
              audioPreviewEnabled={audioPreviewEnabled}
              audioPreviewVolume={audioVolume}
            />
            {phase === 'finished' && (
              <ResultsScreen
                onReplay={() => reset(notes.length)}
                onChange={() => setView('home')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
