import { Container, Graphics } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import type { NoteEvent } from '../../types';
import { HAND_COLORS, pitchColor } from '../../utils/colorUtils';
import type { KeyboardRenderer } from './KeyboardRenderer';

interface ActiveBar {
  graphics: Graphics;
  note: NoteEvent;
  hit: boolean;
  fillColor: number;
  x: number;
  width: number;
  topY: number;
  bottomY: number;
  height: number;
}

export interface BarSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
}

export class BarRenderer {
  readonly container: Container;
  private readonly active: ActiveBar[] = [];
  private readonly pool: Graphics[] = [];

  private notes: NoteEvent[] = [];
  private nextSpawnIdx = 0;
  private fallHeight = 0;
  private lookAhead = 3;

  private readonly keyboard: KeyboardRenderer;
  private readonly glowFilter: GlowFilter;

  constructor(keyboard: KeyboardRenderer) {
    this.keyboard = keyboard;
    this.container = new Container();
    this.glowFilter = new GlowFilter({
      distance: 14,
      outerStrength: 1.3,
      innerStrength: 0,
      color: 0xffffff,
      quality: 0.2,
    });
    this.container.filters = [this.glowFilter];
  }

  setNotes(notes: NoteEvent[]): void {
    this.notes = notes;
    this.reset();
  }

  setLookAhead(seconds: number): void {
    this.lookAhead = Math.max(0.5, seconds);
  }

  setFallHeight(height: number): void {
    this.fallHeight = height;
  }

  setGlowStrength(strength: number): void {
    this.glowFilter.outerStrength = strength;
  }

  getGlowStrength(): number {
    return this.glowFilter.outerStrength;
  }

  reset(): void {
    this.nextSpawnIdx = 0;
    for (const bar of this.active) {
      bar.graphics.clear();
      bar.graphics.visible = false;
      this.pool.push(bar.graphics);
    }
    this.active.length = 0;
  }

  update(currentTime: number): void {
    while (
      this.nextSpawnIdx < this.notes.length &&
      this.notes[this.nextSpawnIdx].time - currentTime <= this.lookAhead
    ) {
      const note = this.notes[this.nextSpawnIdx];
      this.spawnBar(note);
      this.nextSpawnIdx++;
    }

    for (let i = this.active.length - 1; i >= 0; i--) {
      const bar = this.active[i];
      const { note, graphics } = bar;
      const lengthPx = (note.duration / this.lookAhead) * this.fallHeight;
      const yBottom =
        this.fallHeight - ((note.time - currentTime) / this.lookAhead) * this.fallHeight;
      const yTop = yBottom - lengthPx;

      graphics.y = yTop;
      bar.topY = yTop;
      bar.bottomY = yBottom;
      bar.height = lengthPx;

      if (yTop > this.fallHeight + 4) {
        this.recycle(i);
        continue;
      }
      if (currentTime > note.time + note.duration + 0.5) {
        this.recycle(i);
      }
    }
  }

  snapshotForTrails(): BarSnapshot[] {
    const out: BarSnapshot[] = [];
    for (const bar of this.active) {
      if (bar.hit) continue;
      if (bar.bottomY < 0 || bar.topY > this.fallHeight) continue;
      out.push({
        x: bar.x,
        y: bar.topY,
        width: bar.width,
        height: Math.min(bar.height, 12),
        color: bar.fillColor,
      });
    }
    return out;
  }

  markHit(note: NoteEvent): void {
    const bar = this.active.find((b) => b.note === note && !b.hit);
    if (!bar) return;
    bar.hit = true;
    bar.graphics.alpha = 0.35;
  }

  private spawnBar(note: NoteEvent): void {
    const layout = this.keyboard.getLayout(note.note);
    if (!layout) return;

    const g = this.pool.pop() ?? new Graphics();
    g.clear();
    g.visible = true;
    g.alpha = 1;

    const fillColor = pitchColor(note.note);
    const strokeColor = HAND_COLORS[note.track];
    const lengthPx = Math.max(8, (note.duration / this.lookAhead) * this.fallHeight);
    const w = Math.max(4, layout.width - 4);
    const x = layout.x + (layout.width - w) / 2;

    g.roundRect(x, 0, w, lengthPx, 3).fill({ color: fillColor, alpha: 0.92 });
    g.roundRect(x, 0, w, lengthPx, 3).stroke({ color: strokeColor, alpha: 0.95, width: 2 });
    g.roundRect(x + 2, 2, Math.max(2, w - 4), Math.max(2, lengthPx * 0.25), 2)
      .fill({ color: 0xffffff, alpha: 0.18 });

    if (g.parent !== this.container) this.container.addChild(g);

    this.active.push({
      graphics: g,
      note,
      hit: false,
      fillColor,
      x,
      width: w,
      topY: 0,
      bottomY: 0,
      height: lengthPx,
    });
  }

  private recycle(i: number): void {
    const bar = this.active[i];
    bar.graphics.clear();
    bar.graphics.visible = false;
    this.pool.push(bar.graphics);
    this.active.splice(i, 1);
  }

  findHittable(noteNumber: number, currentTime: number, window: number): NoteEvent | null {
    let best: NoteEvent | null = null;
    let bestDelta = Infinity;
    for (const bar of this.active) {
      if (bar.hit) continue;
      if (bar.note.note !== noteNumber) continue;
      const delta = Math.abs(bar.note.time - currentTime);
      if (delta <= window && delta < bestDelta) {
        best = bar.note;
        bestDelta = delta;
      }
    }
    return best;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
