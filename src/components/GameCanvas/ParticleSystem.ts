import { Container, Graphics } from 'pixi.js';

interface Particle {
  graphics: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  readonly container: Container;
  private readonly particles: Particle[] = [];
  private readonly pool: Graphics[] = [];

  constructor() {
    this.container = new Container();
  }

  burst(x: number, y: number, color: number): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const g = this.pool.pop() ?? new Graphics();
      g.clear();
      g.circle(0, 0, 3).fill({ color, alpha: 1 });
      g.x = x;
      g.y = y;
      if (g.parent !== this.container) this.container.addChild(g);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 90 + Math.random() * 60;
      this.particles.push({
        graphics: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0,
        maxLife: 0.6,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.graphics.clear();
        this.pool.push(p.graphics);
        this.particles.splice(i, 1);
        continue;
      }
      p.graphics.x += p.vx * dt;
      p.graphics.y += p.vy * dt;
      p.vy += 200 * dt;
      p.graphics.alpha = 1 - p.life / p.maxLife;
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
