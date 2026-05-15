import { Container, Graphics, Text } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { FIRST_NOTE, LAST_NOTE, isBlackKey } from '../../utils/midiUtils';
import { HAND_COLORS, KEY_BLACK, KEY_WHITE, STRIKE_LINE } from '../../utils/colorUtils';
import type { Hand } from '../../types';

export interface KeyLayout {
  note: number;
  x: number;
  width: number;
  isBlack: boolean;
}

const WHITE_KEY_RATIO = 0.18;
const BLACK_KEY_RATIO = 0.6;

export class KeyboardRenderer {
  readonly container: Container;
  private readonly whiteLayer: Container;
  private readonly blackLayer: Container;
  private readonly highlightLayer: Container;
  private readonly labelLayer: Container;
  private readonly strikeLine: Graphics;
  private readonly keyGraphics = new Map<number, Graphics>();
  private readonly highlightGraphics = new Map<number, Graphics>();
  private readonly activeNotes = new Map<
    number,
    { hand: Hand; addedAt: number; releasedAt: number | null }
  >();

  layout: KeyLayout[] = [];
  keyboardHeight = 0;
  whiteKeyWidth = 0;
  private viewport: { firstNote: number; lastNote: number } = {
    firstNote: FIRST_NOTE,
    lastNote: LAST_NOTE,
  };
  private _labelMap: Record<string, number> = {};
  private _showLabels = false;

  constructor() {
    this.container = new Container();
    this.whiteLayer = new Container();
    this.blackLayer = new Container();
    this.highlightLayer = new Container();
    this.labelLayer = new Container();
    this.strikeLine = new Graphics();
    this.strikeLine.filters = [
      new GlowFilter({
        distance: 12,
        outerStrength: 2,
        innerStrength: 0.5,
        color: STRIKE_LINE,
        quality: 0.3,
      }),
    ];
    this.container.addChild(
      this.whiteLayer,
      this.blackLayer,
      this.highlightLayer,
      this.labelLayer,
      this.strikeLine,
    );
  }

  setViewport(firstNote: number, lastNote: number): void {
    this.viewport = {
      firstNote: Math.max(FIRST_NOTE, Math.min(firstNote, lastNote)),
      lastNote: Math.min(LAST_NOTE, Math.max(firstNote, lastNote)),
    };
  }

  resize(width: number, height: number): void {
    this.keyboardHeight = height;
    this.layout = [];
    this.whiteLayer.removeChildren();
    this.blackLayer.removeChildren();
    this.highlightLayer.removeChildren();
    this.keyGraphics.clear();
    this.highlightGraphics.clear();

    const visibleWhite = this.countWhiteKeysInRange(this.viewport.firstNote, this.viewport.lastNote);
    this.whiteKeyWidth = width / Math.max(1, visibleWhite);
    const blackKeyWidth = this.whiteKeyWidth * BLACK_KEY_RATIO;

    let whiteIndex = 0;
    const firstWhite = this.firstWhiteAtOrAfter(this.viewport.firstNote);
    const whitePositions = new Map<number, number>();

    for (let note = FIRST_NOTE; note <= LAST_NOTE; note++) {
      if (!isBlackKey(note)) {
        const x = (whiteIndex - this.countWhiteKeysInRange(FIRST_NOTE, firstWhite - 1)) * this.whiteKeyWidth;
        whitePositions.set(note, x);
        this.layout.push({ note, x, width: this.whiteKeyWidth, isBlack: false });
        const g = this.drawWhiteKey(x, this.whiteKeyWidth, height);
        this.whiteLayer.addChild(g);
        this.keyGraphics.set(note, g);
        whiteIndex++;
      }
    }

    for (let note = FIRST_NOTE; note <= LAST_NOTE; note++) {
      if (isBlackKey(note)) {
        const prevWhite = this.findPrevWhite(note);
        const baseX = whitePositions.get(prevWhite) ?? 0;
        const x = baseX + this.whiteKeyWidth - blackKeyWidth / 2;
        this.layout.push({ note, x, width: blackKeyWidth, isBlack: true });
        const g = this.drawBlackKey(x, blackKeyWidth, height);
        this.blackLayer.addChild(g);
        this.keyGraphics.set(note, g);
      }
    }

    this.layout.sort((a, b) => a.note - b.note);

    this.strikeLine.clear();
    this.strikeLine
      .rect(0, -1.5, width, 2.5)
      .fill({ color: 0xffffff, alpha: 1 });
    this.strikeLine
      .rect(0, -3, width, 5)
      .fill({ color: STRIKE_LINE, alpha: 0.7 });
    this.strikeLine
      .rect(0, -10, width, 14)
      .fill({ color: STRIKE_LINE, alpha: 0.1 });
  }

  private firstWhiteAtOrAfter(note: number): number {
    let n = note;
    while (n <= LAST_NOTE && isBlackKey(n)) n++;
    return n;
  }

  private countWhiteKeysInRange(from: number, to: number): number {
    if (to < from) return 0;
    let n = 0;
    for (let i = Math.max(FIRST_NOTE, from); i <= Math.min(LAST_NOTE, to); i++) {
      if (!isBlackKey(i)) n++;
    }
    return n;
  }

  getLayout(note: number): KeyLayout | undefined {
    return this.layout.find((l) => l.note === note);
  }

  highlight(note: number, hand: Hand, now: number): void {
    if (!this.keyGraphics.has(note)) return;
    this.activeNotes.set(note, { hand, addedAt: now, releasedAt: null });
    this.drawHighlight(note, 1);
  }

  release(note: number): void {
    const state = this.activeNotes.get(note);
    if (!state) return;
    state.releasedAt = performance.now() / 1000;
  }

  update(now: number): void {
    for (const [note, state] of this.activeNotes) {
      const layout = this.getLayout(note);
      if (!layout) {
        this.activeNotes.delete(note);
        continue;
      }
      let alpha = 1;
      if (state.releasedAt !== null) {
        const elapsed = now - state.releasedAt;
        const FADE = 0.25;
        if (elapsed >= FADE) {
          this.clearHighlight(note);
          this.activeNotes.delete(note);
          continue;
        }
        alpha = 1 - elapsed / FADE;
      } else if (now - state.addedAt > 2) {
        state.releasedAt = now;
      }
      this.drawHighlight(note, alpha);
    }
  }

  private drawHighlight(note: number, alpha: number): void {
    const layout = this.getLayout(note);
    if (!layout) return;
    const state = this.activeNotes.get(note);
    if (!state) return;

    let hl = this.highlightGraphics.get(note);
    if (!hl) {
      hl = new Graphics();
      this.highlightLayer.addChild(hl);
      this.highlightGraphics.set(note, hl);
    }
    hl.clear();

    const color = HAND_COLORS[state.hand];
    const h = layout.isBlack ? this.keyboardHeight * BLACK_KEY_RATIO : this.keyboardHeight;
    hl.alpha = alpha;
    hl.rect(layout.x, 0, layout.width, h).fill({ color, alpha: 0.55 });
    hl.rect(layout.x - 3, h - 6, layout.width + 6, 6).fill({ color, alpha: 0.85 });
    hl.rect(layout.x - 4, -10, layout.width + 8, 10).fill({ color, alpha: 0.7 });
  }

  private clearHighlight(note: number): void {
    const hl = this.highlightGraphics.get(note);
    if (!hl) return;
    hl.clear();
    hl.alpha = 0;
  }

  private drawWhiteKey(x: number, w: number, h: number): Graphics {
    const g = new Graphics();
    const bw = w - 2;
    const bx = x + 1;

    g.rect(bx, h - 4, bw, 6).fill({ color: 0x000000, alpha: 0.45 });

    g.rect(bx, 0, bw, h).fill({ color: KEY_WHITE });

    const stripeH = h * 0.55;
    g.rect(bx + 1, 0, bw - 2, stripeH).fill({ color: 0xffffff, alpha: 0.35 });

    g.rect(bx, h - 12, bw, 12).fill({ color: 0xb8b8c8, alpha: 0.45 });
    g.rect(bx, h - 5, bw, 5).fill({ color: 0x9a9aac, alpha: 0.55 });

    g.rect(bx, 0, bw, 1).fill({ color: 0xffffff, alpha: 0.9 });
    g.rect(bx, 0, 1, h).fill({ color: 0xffffff, alpha: 0.4 });
    g.rect(bx + bw - 1, 0, 1, h).fill({ color: 0x000000, alpha: 0.4 });

    return g;
  }

  private drawBlackKey(x: number, w: number, h: number): Graphics {
    const g = new Graphics();
    const bh = h * BLACK_KEY_RATIO;

    g.rect(x + 1, bh, w, 4).fill({ color: 0x000000, alpha: 0.55 });

    g.roundRect(x, 0, w, bh, 2).fill({ color: KEY_BLACK });

    g.roundRect(x + 1, 1, w - 2, bh * 0.4, 2).fill({ color: 0x32324a, alpha: 0.7 });

    g.roundRect(x, bh - 5, w, 5, 2).fill({ color: 0x000000, alpha: 0.65 });

    g.rect(x + 1, 0, w - 2, 0.8).fill({ color: 0xffffff, alpha: 0.35 });

    return g;
  }

  setKeyLabels(keyMap: Record<string, number>, show: boolean): void {
    this._labelMap = keyMap;
    this._showLabels = show;
    this.labelLayer.removeChildren();
    if (!show) return;

    // invert map: note → key label
    const noteToKey = new Map<number, string>();
    for (const [key, note] of Object.entries(keyMap)) {
      noteToKey.set(note, key.toUpperCase());
    }

    for (const layout of this.layout) {
      const label = noteToKey.get(layout.note);
      if (!label) continue;

      const isBlack = layout.isBlack;
      const fontSize = isBlack ? 8 : 9;
      const color = isBlack ? 0xaaaacc : 0x444466;

      const text = new Text({
        text: label,
        style: {
          fontFamily: 'Space Mono, monospace',
          fontSize,
          fill: color,
          fontWeight: 'bold',
        },
      });
      text.anchor.set(0.5, 1);
      text.x = layout.x + layout.width / 2;
      text.y = isBlack
        ? this.keyboardHeight * BLACK_KEY_RATIO - 4
        : this.keyboardHeight - 5;
      this.labelLayer.addChild(text);
    }
  }

  private findPrevWhite(note: number): number {
    let n = note - 1;
    while (n >= FIRST_NOTE && isBlackKey(n)) n--;
    return n;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

export const computeWhiteKeyWidth = (canvasWidth: number): number => {
  let n = 0;
  for (let note = FIRST_NOTE; note <= LAST_NOTE; note++) {
    if (!isBlackKey(note)) n++;
  }
  return canvasWidth / n;
};

export const KEYBOARD_HEIGHT_RATIO = WHITE_KEY_RATIO;
