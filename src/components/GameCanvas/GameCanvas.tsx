import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { gsap } from 'gsap';
import type { MidiInputEvent, NoteEvent } from '../../types';
import { KeyboardRenderer } from './KeyboardRenderer';
import { BarRenderer } from './BarRenderer';
import { ParticleSystem } from './ParticleSystem';
import { TrailRenderer } from './TrailRenderer';
import { ShockWaveSystem } from './ShockWaveSystem';
import { useGameEngine, type FeedbackEvent } from '../../hooks/useGameEngine';
import { useAudioPreview } from '../../hooks/useAudioPreview';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { JUDGMENT_COLORS, pitchColor } from '../../utils/colorUtils';
import { TIMING_WINDOWS, type Judgment } from '../../utils/timingUtils';

const KEYBOARD_HEIGHT_PX = 140;

export interface InputSource {
  subscribe: (listener: (e: MidiInputEvent) => void) => () => void;
}

interface Props {
  notes: NoteEvent[];
  lookAhead: number;
  latencyOffsetMs: number;
  inputSources: InputSource[];
  viewportRange: { firstNote: number; lastNote: number };
  audioPreviewEnabled: boolean;
  audioPreviewVolume: number;
  onReady?: () => void;
}

interface FloatingLabel {
  text: Text;
  life: number;
  maxLife: number;
}

export const GameCanvas = ({
  notes,
  lookAhead,
  latencyOffsetMs,
  inputSources,
  viewportRange,
  audioPreviewEnabled,
  audioPreviewVolume,
  onReady,
}: Props) => {
  const audioPreview = useAudioPreview();

  useEffect(() => {
    audioPreview.setEnabled(audioPreviewEnabled);
  }, [audioPreviewEnabled, audioPreview]);

  useEffect(() => {
    audioPreview.setVolume(audioPreviewVolume);
  }, [audioPreviewVolume, audioPreview]);
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const enginesRef = useRef<{
    keyboard: KeyboardRenderer;
    bars: BarRenderer;
    trails: TrailRenderer;
    particles: ParticleSystem;
    shockwaves: ShockWaveSystem;
    labelLayer: Container;
    labels: FloatingLabel[];
    feverOverlay: Graphics;
  } | null>(null);

  const enableTrails = useSettingsStore((s) => s.enableTrails);
  const enableVignette = useSettingsStore((s) => s.enableVignette);
  const enableShockwaves = useSettingsStore((s) => s.enableShockwaves);
  const showKeyLabels = useSettingsStore((s) => s.showKeyLabels);
  const keyMap = useSettingsStore((s) => s.keyMap);

  const engine = useGameEngine({
    latencyOffsetMs,
    onFeedback: (e) => spawnLabel(e),
    onHit: (note, j) => {
      enginesRef.current?.bars.markHit(note);
      const settings = useSettingsStore.getState();
      const fever = useGameStore.getState().fever;
      const layout = enginesRef.current?.keyboard.getLayout(note.note);
      const app = appRef.current;
      if (!layout || !app || !enginesRef.current) return;

      const cx = layout.x + layout.width / 2;
      const cy = app.canvas.height / (window.devicePixelRatio || 1) - KEYBOARD_HEIGHT_PX;
      const color = pitchColor(note.note);

      if (j === 'perfect') {
        if (settings.enableParticles) {
          enginesRef.current.particles.burst(cx, cy, color);
          if (fever) enginesRef.current.particles.burst(cx, cy, 0xffffff);
        }
        if (settings.enableShockwaves) {
          enginesRef.current.shockwaves.burst(cx, cy, color, fever ? 1.3 : 1);
        }
      } else if (j === 'good' && fever && settings.enableParticles) {
        enginesRef.current.particles.burst(cx, cy, color);
      }
    },
  });

  const spawnLabel = (e: FeedbackEvent) => {
    const ctx = enginesRef.current;
    const app = appRef.current;
    if (!ctx || !app) return;
    const layout = ctx.keyboard.getLayout(e.note);
    if (!layout) return;

    const isPerfect = e.judgment === 'perfect';
    const isMiss = e.judgment === 'miss';
    const fontSize = isPerfect ? 36 : isMiss ? 24 : 22;

    const text = new Text({
      text: e.judgment.toUpperCase(),
      style: {
        fontFamily: 'Space Mono',
        fontSize,
        fontWeight: 'bold',
        fill: JUDGMENT_COLORS[e.judgment],
        stroke: { color: 0x000000, width: 3, alpha: 0.6 },
      },
    });
    text.anchor.set(0.5, 1);
    text.x = layout.x + layout.width / 2;
    text.y = app.canvas.height / (window.devicePixelRatio || 1) - KEYBOARD_HEIGHT_PX - 18;
    text.scale.set(0.5);
    text.alpha = 1;
    ctx.labelLayer.addChild(text);
    ctx.labels.push({ text, life: 0, maxLife: isPerfect ? 0.9 : 0.7 });

    if (isPerfect) {
      gsap
        .timeline()
        .to(text.scale, { x: 1.25, y: 1.25, duration: 0.12, ease: 'back.out(3)' })
        .to(text.scale, { x: 1.0, y: 1.0, duration: 0.18, ease: 'power2.out' });
      gsap.to(text, { y: text.y - 30, duration: 0.9, ease: 'power1.out' });
    } else if (isMiss) {
      gsap.to(text.scale, { x: 1, y: 1, duration: 0.15, ease: 'power2.out' });
      gsap.to(text, {
        x: `+=4`,
        duration: 0.06,
        repeat: 5,
        yoyo: true,
        ease: 'sine.inOut',
      });
    } else {
      gsap.to(text.scale, { x: 1, y: 1, duration: 0.18, ease: 'back.out(2)' });
      gsap.to(text, { y: text.y - 18, duration: 0.7, ease: 'power1.out' });
    }
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let cancelled = false;

    void app
      .init({
        background: 0x0a0a0f,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: host,
      })
      .then(() => {
        if (cancelled) {
          app.destroy(true);
          return;
        }
        host.appendChild(app.canvas);
        appRef.current = app;

        const keyboard = new KeyboardRenderer();
        const bars = new BarRenderer(keyboard);
        const trails = new TrailRenderer();
        const particles = new ParticleSystem();
        const shockwaves = new ShockWaveSystem();
        const labelLayer = new Container();
        const labels: FloatingLabel[] = [];

        const feverOverlay = new Graphics();
        feverOverlay.alpha = 0;

        const fallTrack = new Graphics();
        app.stage.addChild(fallTrack);
        app.stage.addChild(feverOverlay);
        app.stage.addChild(trails.container);
        app.stage.addChild(bars.container);
        app.stage.addChild(shockwaves.container);
        app.stage.addChild(particles.container);
        app.stage.addChild(labelLayer);
        app.stage.addChild(keyboard.container);

        enginesRef.current = {
          keyboard,
          bars,
          trails,
          particles,
          shockwaves,
          labelLayer,
          labels,
          feverOverlay,
        };

        const layout = () => {
          const w = app.canvas.width / (window.devicePixelRatio || 1);
          const h = app.canvas.height / (window.devicePixelRatio || 1);
          const fallH = h - KEYBOARD_HEIGHT_PX;

          fallTrack.clear();
          fallTrack.rect(0, 0, w, fallH).fill({ color: 0x0e0e18 });
          const lanes = Math.floor(w / 32);
          for (let li = 1; li < lanes; li++) {
            fallTrack.rect(li * 32, 0, 1, fallH).fill({ color: 0xffffff, alpha: 0.025 });
          }

          feverOverlay.clear();
          feverOverlay.rect(0, 0, w, fallH).fill({ color: 0xeab308 });

          keyboard.setViewport(viewportRange.firstNote, viewportRange.lastNote);
          keyboard.resize(w, KEYBOARD_HEIGHT_PX);
          const { showKeyLabels: labelsOn, keyMap: kMap } = useSettingsStore.getState();
          keyboard.setKeyLabels(kMap, labelsOn);
          keyboard.container.x = 0;
          keyboard.container.y = fallH;

          bars.container.x = 0;
          bars.container.y = 0;
          bars.setFallHeight(fallH);

          trails.container.x = 0;
          trails.container.y = 0;

          particles.container.x = 0;
          particles.container.y = 0;
          labelLayer.x = 0;
          labelLayer.y = 0;
        };

        layout();

        const ro = new ResizeObserver(layout);
        ro.observe(host);

        let lastT = performance.now() / 1000;
        const tick = () => {
          const now = performance.now() / 1000;
          const dt = now - lastT;
          lastT = now;
          const ct = engine.currentTime();
          if (ct !== null) {
            bars.update(ct);
            engine.tickMisses(ct);
          }
          if (useSettingsStore.getState().enableTrails) {
            trails.emitForBars(bars.snapshotForTrails(), dt);
          }
          trails.update(dt);
          shockwaves.update(dt);
          keyboard.update(now);
          particles.update(dt);

          for (let i = labels.length - 1; i >= 0; i--) {
            const l = labels[i];
            l.life += dt;
            const fadeStart = l.maxLife * 0.55;
            if (l.life > fadeStart) {
              const t = (l.life - fadeStart) / (l.maxLife - fadeStart);
              l.text.alpha = Math.max(0, 1 - t);
            }
            if (l.life >= l.maxLife) {
              labelLayer.removeChild(l.text);
              l.text.destroy();
              labels.splice(i, 1);
            }
          }

          const fever = useGameStore.getState().fever;
          const targetFeverAlpha = fever ? 0.06 + Math.sin(now * 4) * 0.04 : 0;
          feverOverlay.alpha += (targetFeverAlpha - feverOverlay.alpha) * 0.1;

          const targetGlow = fever ? 2.4 : 1.3;
          const currentGlow = bars.getGlowStrength();
          bars.setGlowStrength(currentGlow + (targetGlow - currentGlow) * 0.05);
        };
        app.ticker.add(tick);

        onReady?.();

        (app as unknown as { __ph_cleanup?: () => void }).__ph_cleanup = () => {
          ro.disconnect();
        };
      })
      .catch((err) => {
        console.error('PixiJS init error:', err);
      });

    return () => {
      cancelled = true;
      const a = appRef.current;
      if (a) {
        const cleanup = (a as unknown as { __ph_cleanup?: () => void }).__ph_cleanup;
        cleanup?.();
        enginesRef.current?.keyboard.destroy();
        enginesRef.current?.bars.destroy();
        enginesRef.current?.trails.destroy();
        enginesRef.current?.particles.destroy();
        enginesRef.current?.shockwaves.destroy();
        a.destroy(true);
      }
      appRef.current = null;
      enginesRef.current = null;
    };
  }, []);

  useEffect(() => {
    enginesRef.current?.trails.setEnabled(enableTrails);
  }, [enableTrails]);

  useEffect(() => {
    enginesRef.current?.shockwaves.setEnabled(enableShockwaves);
  }, [enableShockwaves]);

  useEffect(() => {
    enginesRef.current?.bars.setLookAhead(lookAhead);
  }, [lookAhead]);

  useEffect(() => {
    enginesRef.current?.keyboard.setKeyLabels(keyMap, showKeyLabels);
  }, [showKeyLabels, keyMap]);

  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (phase === 'playing') return;
    engine.loadNotes(notes);
    enginesRef.current?.bars.setNotes(notes);
  }, [notes, engine, phase]);

  useEffect(() => {
    const handler = (evt: MidiInputEvent) => {
      const ctx = enginesRef.current;
      if (!ctx) return;
      const now = engine.currentTime();
      if (evt.type === 'noteon') {
        const lookup = (
          note: number,
          time: number,
          window: number,
        ) => ctx.bars.findHittable(note, time, window);

        let hand: 'right' | 'left' = 'right';
        if (now !== null) {
          const target = engine.handleNoteOn(evt.note, lookup, now);
          if (target) hand = target.track;
          else {
            const expected = ctx.bars.findHittable(evt.note, now, TIMING_WINDOWS.ok * 2);
            if (expected) hand = expected.track;
          }
        }
        ctx.keyboard.highlight(evt.note, hand, performance.now() / 1000);
      } else {
        ctx.keyboard.release(evt.note);
      }
    };

    const unsubs = inputSources.map((src) => src.subscribe(handler));
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [inputSources, engine]);

  useEffect(() => {
    const ctx = enginesRef.current;
    const app = appRef.current;
    if (!ctx || !app) return;
    ctx.keyboard.setViewport(viewportRange.firstNote, viewportRange.lastNote);
    const w = app.canvas.width / (window.devicePixelRatio || 1);
    ctx.keyboard.resize(w, KEYBOARD_HEIGHT_PX);
  }, [viewportRange.firstNote, viewportRange.lastNote]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const startGame = async () => {
    if (phase === 'playing') return;
    if (notes.length === 0) {
      console.warn('[GameCanvas] no notes to play');
      return;
    }
    if (!enginesRef.current) {
      console.warn('[GameCanvas] PixiJS not ready yet');
      return;
    }
    console.log('[GameCanvas] startGame: loading', notes.length, 'notes');
    enginesRef.current.bars.setNotes(notes);
    engine.loadNotes(notes);
    await engine.start();
    const ctx = engine.getAudioContext();
    const startAt = engine.getStartAt();
    if (ctx && startAt !== null) {
      audioPreview.schedule(notes, ctx, startAt);
    }
    console.log('[GameCanvas] engine started, currentTime=', engine.currentTime());
    setCountdown(3);
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c === null) return null;
        if (c <= 1) {
          if (countdownTimerRef.current) {
            window.clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return null;
        }
        return c - 1;
      });
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    };
  }, []);

  const showStartOverlay = phase !== 'playing' && phase !== 'finished';

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full" />
      {enableVignette && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
          }}
        />
      )}
      {showStartOverlay && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={startGame}
            disabled={notes.length === 0}
            className="pointer-events-auto rounded-2xl border border-hand-right/40 bg-bg-surface/80
                       px-10 py-6 font-display text-2xl text-hand-right shadow-2xl backdrop-blur
                       hover:bg-hand-right/20 transition disabled:opacity-30
                       disabled:cursor-not-allowed cursor-pointer"
          >
            ▶ Lancer la partie
          </button>
        </div>
      )}
      {countdown !== null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="font-display text-9xl text-hand-right drop-shadow-2xl">
            {countdown}
          </div>
        </div>
      )}
    </div>
  );
};

export type { Judgment };
