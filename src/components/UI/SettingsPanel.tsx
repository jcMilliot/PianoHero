import { useState } from 'react';
import { useSettingsStore, type HandsDisplay } from '../../stores/settingsStore';
import { noteToName, FIRST_NOTE, LAST_NOTE } from '../../utils/midiUtils';

interface Props {
  onClose: () => void;
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3 border-t border-bg-border pt-5 first:border-t-0 first:pt-0">
    <h3 className="font-display text-sm uppercase tracking-widest text-hand-right">
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </section>
);

const Row = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex-1 min-w-[180px]">
      <div className="text-sm text-key-white/90">{label}</div>
      {hint && <div className="text-xs text-key-white/40">{hint}</div>}
    </div>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

const HAND_OPTIONS: { value: HandsDisplay; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'right', label: 'Main D' },
  { value: 'left', label: 'Main G' },
];

export const SettingsPanel = ({ onClose }: Props) => {
  const s = useSettingsStore();
  const [rebindKey, setRebindKey] = useState<string | null>(null);

  const sortedKeys = Object.entries(s.keyMap).sort((a, b) => a[1] - b[1]);

  const handleKeyCapture = (e: React.KeyboardEvent<HTMLButtonElement>, note: number) => {
    e.preventDefault();
    e.stopPropagation();
    const k = e.key.toLowerCase();
    if (k === 'escape') {
      setRebindKey(null);
      return;
    }
    if (k.length === 1) {
      s.rebindKey(k, note);
      setRebindKey(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-bg-border bg-bg-surface p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-key-white">Réglages</h2>
            <p className="mt-1 text-xs text-key-white/50">
              Préférences sauvegardées automatiquement dans le navigateur
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-bg-border px-3 py-1 text-sm text-key-white/70 hover:bg-bg-base"
          >
            Fermer
          </button>
        </div>

        <div className="space-y-6">
          <Section title="Jeu">
            <Row
              label="Vitesse de chute"
              hint="Temps qu'une barre met pour traverser l'écran (look-ahead)"
            >
              <input
                type="range"
                min={1}
                max={6}
                step={0.25}
                value={s.lookAhead}
                onChange={(e) => s.setLookAhead(parseFloat(e.target.value))}
                className="w-32 accent-hand-right"
              />
              <span className="font-display tabular-nums text-sm w-12 text-right">
                {s.lookAhead.toFixed(2)}s
              </span>
            </Row>

            <Row
              label="Décalage de latence"
              hint="Compense le délai entre la frappe et la détection (-200 à +200ms)"
            >
              <input
                type="range"
                min={-200}
                max={200}
                step={5}
                value={s.latencyMs}
                onChange={(e) => s.setLatencyMs(parseInt(e.target.value, 10))}
                className="w-32 accent-hand-right"
              />
              <span className="font-display tabular-nums text-sm w-14 text-right">
                {s.latencyMs}ms
              </span>
            </Row>

            <Row label="Mains affichées" hint="Filtrer les notes affichées et à jouer">
              <div className="flex gap-1">
                {HAND_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => s.setHandsDisplay(opt.value)}
                    className={`
                      rounded-md border px-3 py-1 text-xs font-display transition-colors
                      ${
                        s.handsDisplay === opt.value
                          ? 'border-hand-right bg-hand-right/20 text-hand-right'
                          : 'border-bg-border text-key-white/60 hover:bg-bg-base'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          <Section title="Audio">
            <Row label="Audio preview" hint="Synthé qui joue les notes du morceau">
              <input
                type="checkbox"
                checked={s.audioPreview}
                onChange={(e) => s.setAudioPreview(e.target.checked)}
                className="h-4 w-4 accent-hand-right"
              />
            </Row>

            <Row label="Volume" hint="Volume du synthé de preview">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={s.audioVolume}
                onChange={(e) => s.setAudioVolume(parseFloat(e.target.value))}
                disabled={!s.audioPreview}
                className="w-32 accent-hand-right disabled:opacity-30"
              />
              <span className="font-display tabular-nums text-sm w-12 text-right">
                {Math.round(s.audioVolume * 100)}%
              </span>
            </Row>
          </Section>

          <Section title="Clavier d'ordinateur">
            <Row
              label="Activer le clavier d'ordinateur"
              hint="Permet de jouer sans piano MIDI branché"
            >
              <input
                type="checkbox"
                checked={s.keyboardFallback}
                onChange={(e) => s.setKeyboardFallback(e.target.checked)}
                className="h-4 w-4 accent-hand-right"
              />
            </Row>

            <Row
              label="Afficher les touches sur le piano"
              hint="Affiche la lettre du clavier PC sur chaque touche de piano correspondante"
            >
              <input
                type="checkbox"
                checked={s.showKeyLabels}
                onChange={(e) => s.setShowKeyLabels(e.target.checked)}
                className="h-4 w-4 accent-hand-right"
              />
            </Row>

            <div className="space-y-1">
              <div className="text-xs text-key-white/40">
                Clique sur une touche pour la réassigner. Ajoute une nouvelle touche
                avec le bouton "+".
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {sortedKeys.map(([key, note]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 rounded-md border border-bg-border bg-bg-base px-2 py-1 text-sm"
                  >
                    <button
                      type="button"
                      tabIndex={0}
                      onClick={() => setRebindKey(rebindKey === key ? null : key)}
                      onKeyDown={
                        rebindKey === key
                          ? (e) => handleKeyCapture(e, note)
                          : undefined
                      }
                      className={`
                        flex-1 rounded font-display uppercase
                        ${
                          rebindKey === key
                            ? 'bg-hand-right/30 text-hand-right animate-pulse'
                            : 'text-key-white hover:bg-bg-surface'
                        }
                      `}
                    >
                      {rebindKey === key ? '…' : key}
                    </button>
                    <span className="text-xs font-display tabular-nums text-key-white/50 w-10 text-right">
                      {noteToName(note)}
                    </span>
                    <button
                      type="button"
                      onClick={() => s.unbindKey(key)}
                      className="text-key-white/30 hover:text-feedback-miss"
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <AddKeyBinding
                onAdd={(key, note) => s.rebindKey(key, note)}
                existingKeys={Object.keys(s.keyMap)}
              />
              <button
                type="button"
                onClick={() => s.resetKeyMap()}
                className="mt-2 text-xs text-key-white/50 hover:text-hand-right"
              >
                ↺ Restaurer les touches par défaut
              </button>
            </div>
          </Section>

          <Section title="Effets visuels">
            <Row label="Particules" hint="Explosions sur Perfect">
              <input
                type="checkbox"
                checked={s.enableParticles}
                onChange={(e) => s.setEnableParticles(e.target.checked)}
                className="h-4 w-4 accent-hand-right"
              />
            </Row>
            <Row label="Trails (traînées lumineuses)" hint="Traîne derrière les barres">
              <input
                type="checkbox"
                checked={s.enableTrails}
                onChange={(e) => s.setEnableTrails(e.target.checked)}
                className="h-4 w-4 accent-hand-right"
              />
            </Row>
            <Row label="Ondes de choc" hint="Anneau qui se propage sur Perfect">
              <input
                type="checkbox"
                checked={s.enableShockwaves}
                onChange={(e) => s.setEnableShockwaves(e.target.checked)}
                className="h-4 w-4 accent-hand-right"
              />
            </Row>
            <Row label="Mode Fever" hint="Boost visuel + multiplicateur ×3 à 50 combo">
              <input
                type="checkbox"
                checked={s.enableFeverMode}
                onChange={(e) => s.setEnableFeverMode(e.target.checked)}
                className="h-4 w-4 accent-hand-right"
              />
            </Row>
            <Row label="Vignette" hint="Léger assombrissement des bords">
              <input
                type="checkbox"
                checked={s.enableVignette}
                onChange={(e) => s.setEnableVignette(e.target.checked)}
                className="h-4 w-4 accent-hand-right"
              />
            </Row>
          </Section>

          <Section title="Réinitialisation">
            <button
              type="button"
              onClick={() => {
                if (confirm('Réinitialiser tous les réglages aux valeurs par défaut ?')) {
                  s.resetAll();
                }
              }}
              className="rounded-md border border-feedback-miss/40 bg-feedback-miss/10 px-4 py-2 text-sm text-feedback-miss hover:bg-feedback-miss/20"
            >
              Tout réinitialiser
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
};

const AddKeyBinding = ({
  onAdd,
  existingKeys,
}: {
  onAdd: (key: string, note: number) => void;
  existingKeys: string[];
}) => {
  const [key, setKey] = useState('');
  const [note, setNote] = useState(60);

  return (
    <div className="mt-2 flex items-center gap-2 rounded-md border border-dashed border-bg-border px-2 py-1.5 text-sm">
      <span className="text-xs text-key-white/40">Ajouter :</span>
      <input
        type="text"
        maxLength={1}
        value={key}
        onChange={(e) => setKey(e.target.value.toLowerCase())}
        placeholder="touche"
        className="w-16 rounded bg-bg-base px-2 py-0.5 font-display uppercase text-center
                   border border-bg-border focus:border-hand-right outline-none"
      />
      <select
        value={note}
        onChange={(e) => setNote(parseInt(e.target.value, 10))}
        className="flex-1 rounded bg-bg-base px-2 py-0.5 text-xs border border-bg-border focus:border-hand-right outline-none"
      >
        {Array.from({ length: LAST_NOTE - FIRST_NOTE + 1 }, (_, i) => FIRST_NOTE + i).map(
          (n) => (
            <option key={n} value={n}>
              {noteToName(n)} (MIDI {n})
            </option>
          ),
        )}
      </select>
      <button
        type="button"
        disabled={!key || existingKeys.includes(key)}
        onClick={() => {
          onAdd(key, note);
          setKey('');
        }}
        className="rounded bg-hand-right/20 px-3 py-0.5 text-xs text-hand-right
                   hover:bg-hand-right/30 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  );
};
