import { Container, Graphics } from 'pixi.js';

interface Wave {
  graphics: Graphics;
  cx: number;
  cy: number;
  color: number;
  life: number;
  maxLife: number;
  maxRadius: number;
}

export class ShockWaveSystem {
  readonly container: Container;
  private readonly waves: Wave[] = [];
  private readonly pool: Graphics[] = [];
  private enabled = true;

  constructor() {
    this.container = new Container();
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v) this.clearAll();
  }

  burst(cx: number, cy: number, color: number, scale = 1): void {
    if (!this.enabled) return;
    const g = this.pool.pop() ?? new Graphics();
    g.clear();
    if (g.parent !== this.container) this.container.addChild(g);
    this.waves.push({
      graphics: g,
      cx,
      cy,
      color,
      life: 0,
      maxLife: 0.55,
      maxRadius: 90 * scale,
    });
  }

  update(dt: number): void {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.life += dt;
      const t = w.life / w.maxLife;
      if (t >= 1) {
        w.graphics.clear();
        this.pool.push(w.graphics);
        this.waves.splice(i, 1);
        continue;
      }
      const easedT = 1 - Math.pow(1 - t, 2);
      const radius = easedT * w.maxRadius;
      const alpha = 1 - t;
      w.graphics.clear();
      w.graphics.circle(w.cx, w.cy, radius).stroke({
        width: 2.5,
        color: w.color,
        alpha,
      });
      w.graphics.circle(w.cx, w.cy, radius * 0.85).stroke({
        width: 1,
        color: 0xffffff,
        alpha: alpha * 0.6,
      });
    }
  }

  clearAll(): void {
    for (const w of this.waves) {
      w.graphics.clear();
      this.pool.push(w.graphics);
    }
    this.waves.length = 0;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
