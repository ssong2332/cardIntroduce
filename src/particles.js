/**
 * Mystical Canvas Background & Particle FX Engine
 */
export class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.bursts = [];
    this.width = 0;
    this.height = 0;
    this.animId = null;

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', this.resize);
    this.resize();
    this.initBackgroundParticles();
    this.start();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initBackgroundParticles() {
    this.particles = [];
    const count = Math.floor((this.width * this.height) / 12000);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4 - 0.15,
        alpha: Math.random() * 0.7 + 0.2,
        pulse: Math.random() * Math.PI,
        color: Math.random() > 0.4 ? 'rgba(245, 158, 11, ' : 'rgba(168, 85, 247, '
      });
    }
  }

  /**
   * Spawn a radiant magical burst at specific screen coordinates
   */
  spawnBurst(x, y, color = '#f59e0b', count = 50) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      this.bursts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        alpha: 1,
        decay: Math.random() * 0.025 + 0.015,
        color,
        gravity: 0.12,
        shape: Math.random() > 0.5 ? 'spark' : 'star'
      });
    }
  }

  /**
   * Continuous celebratory confetti burst
   */
  celebrate(durationMs = 3500) {
    const end = performance.now() + durationMs;
    const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#fbbf24'];

    const interval = setInterval(() => {
      if (performance.now() > end) {
        clearInterval(interval);
        return;
      }
      this.spawnBurst(
        this.width * (0.2 + Math.random() * 0.6),
        this.height * (0.2 + Math.random() * 0.5),
        colors[Math.floor(Math.random() * colors.length)],
        25
      );
    }, 150);
  }

  loop() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render & update ambient ambient stars
    for (const p of this.particles) {
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulse += 0.03;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
      this.ctx.fillStyle = `${p.color}${currentAlpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Render & update magical bursts
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy += b.gravity;
      b.vx *= 0.98;
      b.alpha -= b.decay;

      if (b.alpha <= 0) {
        this.bursts.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, b.alpha);
      this.ctx.fillStyle = b.color;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 8;

      if (b.shape === 'star') {
        this.ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    this.animId = requestAnimationFrame(this.loop);
  }

  start() {
    if (!this.animId) {
      this.loop();
    }
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    window.removeEventListener('resize', this.resize);
  }
}
