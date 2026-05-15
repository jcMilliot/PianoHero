import { Container, Graphics } from 'pixi.js';

interface TrailBlob {
  graphics: Graphics;
  life: number;
  maxLife: number;
}

const TRAIL_INTERVAL = 0.05;

export class TrailRenderer {
  readonly container: Container;
  private readonly blobs: TrailBlob[] = [];
  private readonly pool: Graphics[] = [];
  private timeSinceLastEmit = 0;
  private enabled = true;

  constructor() {
    this.container = new Container();
    this.container.alpha = 0.55;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.clearAll();
  }

  emitForBars(
    bars: { x: number; y: number; width: number; height: number; color: number }[],
    dt: number,
  ): void {
    if (!this.enabled) return;
    this.timeSinceLastEmit += dt;
    if (this.timeSinceLastEmit < TRAIL_INTERVAL) return;
    this.timeSinceLastEmit = 0;

    for (const bar of bars) {
      if (bar.height < 4) continue;
      const g = this.pool.pop() ?? new Graphics();
      g.clear();
      g.rect(bar.x, bar.y, bar.width, bar.height).fill({ color: bar.color, alpha: 0.5 });
      if (g.parent !== this.container) this.container.addChild(g);
      g.alpha = 1;
      this.blobs.push({ graphics: g, life: 0, maxLife: 0.35 });
    }
  }

  update(dt: number): void {
    for (let i = this.blobs.length - 1; i >= 0; i--) {
      const b = this.blobs[i];
      b.life += dt;
      if (b.life >= b.maxLife) {
        b.graphics.clear();
        this.pool.push(b.graphics);
        this.blobs.splice(i, 1);
        continue;
      }
      b.graphics.alpha = (1 - b.life / b.maxLife) * 0.7;
    }
  }

  clearAll(): void {
    for (const b of this.blobs) {
      b.graphics.clear();
      this.pool.push(b.graphics);
    }
    this.blobs.length = 0;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
