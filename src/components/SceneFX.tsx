"use client";

import { useEffect, useRef } from "react";

/* ---------------------------------------------------------------------------
 * Living layer over each real photo: sun rays, drifting mist, bird flocks,
 * water glints, city bokeh, aurora curtains, shooting stars, neon rain...
 * One small 2D canvas rendered at reduced resolution (soft light effects
 * don't need full res), paused when idle / hidden.
 * ------------------------------------------------------------------------- */

type Fx =
  | { k: "rays"; x: number; y: number; color: string; n?: number }
  | { k: "mist"; color: string; y: number; a?: number }
  | { k: "birds"; color: string; y: number }
  | { k: "glints"; y0: number; y1: number; n: number }
  | { k: "bokeh"; colors: string[]; n: number }
  | { k: "motes"; color: string; n: number }
  | { k: "leaves"; n: number }
  | { k: "fireflies"; n: number; y0: number }
  | { k: "stars"; n: number; y1: number }
  | { k: "shooting" }
  | { k: "aurora" }
  | { k: "rain"; n: number }
  | { k: "flare"; x: number; y: number }
  | { k: "heli"; y: number };

export const SCENE_FX: Record<string, Fx[]> = {
  "alpine-dawn": [
    { k: "rays", x: 0.72, y: 0.12, color: "255,214,160" },
    { k: "mist", color: "255,236,220", y: 0.62 },
    { k: "birds", color: "20,20,30", y: 0.28 },
    { k: "motes", color: "255,230,190", n: 40 },
  ],
  "nyc-night": [
    { k: "bokeh", colors: ["255,196,120", "255,160,90", "160,200,255"], n: 26 },
    { k: "glints", y0: 0.25, y1: 0.95, n: 70 },
    { k: "heli", y: 0.18 },
  ],
  "ocean-aerial": [
    { k: "glints", y0: 0, y1: 1, n: 120 },
    { k: "birds", color: "245,248,255", y: 0.3 },
    { k: "mist", color: "220,240,255", y: 0.15, a: 0.08 },
  ],
  "forest-light": [
    { k: "rays", x: 0.45, y: -0.15, color: "255,236,170", n: 9 },
    { k: "motes", color: "255,240,200", n: 70 },
    { k: "leaves", n: 18 },
    { k: "mist", color: "210,240,210", y: 0.8, a: 0.1 },
  ],
  "dubai-sunset": [
    { k: "flare", x: 0.3, y: 0.38 },
    { k: "birds", color: "25,12,10", y: 0.25 },
    { k: "motes", color: "255,200,140", n: 35 },
    { k: "mist", color: "255,190,140", y: 0.7, a: 0.1 },
  ],
  "aurora-peaks": [{ k: "aurora" }, { k: "stars", n: 140, y1: 0.55 }, { k: "shooting" }],
  "lake-sunset": [
    { k: "glints", y0: 0.55, y1: 1, n: 90 },
    { k: "fireflies", n: 26, y0: 0.55 },
    { k: "birds", color: "20,12,20", y: 0.22 },
    { k: "rays", x: 0.5, y: 0.42, color: "255,180,120", n: 7 },
  ],
  "tokyo-neon": [
    { k: "rain", n: 150 },
    { k: "bokeh", colors: ["255,60,160", "80,200,255", "170,90,255", "255,120,60"], n: 30 },
  ],
  "manhattan-aerial": [
    { k: "mist", color: "230,235,245", y: 0.5, a: 0.14 },
    { k: "glints", y0: 0.1, y1: 1, n: 60 },
    { k: "heli", y: 0.3 },
  ],
};

const RES = 0.5; // canvas resolution vs CSS pixels
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function glowSprite(rgb: string, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, `rgba(${rgb},1)`);
  grd.addColorStop(0.35, `rgba(${rgb},0.45)`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

type Layer = { draw: (g: CanvasRenderingContext2D, t: number, dt: number, W: number, H: number) => void };

function build(fx: Fx, W: number, H: number): Layer {
  const dens = Math.min(1, (W * H) / (1100 * 600));
  const N = (n: number) => Math.max(4, Math.round(n * (0.45 + 0.55 * dens)));
  switch (fx.k) {
    case "rays": {
      const n = fx.n ?? 8;
      const rays = Array.from({ length: n }, (_, i) => ({ a: Math.PI * 0.15 + (i / n) * Math.PI * 0.7 + rnd(-0.06, 0.06), w: rnd(0.03, 0.08), p: rnd(0, 6) }));
      return {
        draw(g, t, _dt, W, H) {
          const ox = fx.x * W, oy = fx.y * H, L = Math.hypot(W, H);
          const grd = g.createRadialGradient(ox, oy, 0, ox, oy, L * 0.8);
          grd.addColorStop(0, `rgba(${fx.color},0.22)`);
          grd.addColorStop(1, `rgba(${fx.color},0)`);
          g.globalCompositeOperation = "lighter";
          g.fillStyle = grd;
          for (const r of rays) {
            const a = r.a + Math.sin(t * 0.12 + r.p) * 0.05;
            g.globalAlpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.5 + r.p));
            g.beginPath();
            g.moveTo(ox, oy);
            g.lineTo(ox + Math.cos(a - r.w) * L, oy + Math.sin(a - r.w) * L);
            g.lineTo(ox + Math.cos(a + r.w) * L, oy + Math.sin(a + r.w) * L);
            g.closePath();
            g.fill();
          }
          g.globalAlpha = 1;
          g.globalCompositeOperation = "source-over";
        },
      };
    }
    case "mist": {
      const spr = glowSprite(fx.color, 128);
      const banks = Array.from({ length: 5 }, (_, i) => ({ x: rnd(-0.2, 1.2), y: fx.y + rnd(-0.12, 0.12), s: rnd(0.5, 0.9), v: rnd(0.006, 0.016) * (i % 2 ? 1 : -1) }));
      return {
        draw(g, t, dt, W, H) {
          g.globalAlpha = fx.a ?? 0.12;
          for (const b of banks) {
            b.x += b.v * dt;
            if (b.x > 1.4) b.x = -0.4;
            if (b.x < -0.4) b.x = 1.4;
            const w = W * b.s, h = w * 0.28;
            g.drawImage(spr, b.x * W - w / 2, (b.y + Math.sin(t * 0.2 + b.s * 9) * 0.01) * H - h / 2, w, h);
          }
          g.globalAlpha = 1;
        },
      };
    }
    case "birds": {
      let flock: { x: number; y: number; ph: number; s: number }[] = [];
      let fx0 = 0, vx = 0, wait = rnd(1, 4), baseY = 0;
      const spawn = (W: number, H: number) => {
        const dir = Math.random() < 0.5 ? 1 : -1;
        vx = dir * rnd(0.035, 0.06) * W;
        fx0 = dir > 0 ? -0.1 * W : 1.1 * W;
        baseY = (fx.y + rnd(-0.1, 0.1)) * H;
        const n = Math.round(rnd(5, 11));
        const sc = rnd(0.7, 1.3) * Math.min(1, W / 900) * 6;
        flock = Array.from({ length: n }, (_, i) => ({ x: -Math.abs(i - n / 2) * sc * 2.2 * dir + rnd(-4, 4), y: Math.abs(i - n / 2) * sc * 1.1 + rnd(-3, 3), ph: rnd(0, 6), s: sc * rnd(0.8, 1.15) }));
      };
      return {
        draw(g, t, dt, W, H) {
          if (!flock.length) {
            wait -= dt;
            if (wait <= 0) spawn(W, H);
            return;
          }
          fx0 += vx * dt;
          g.strokeStyle = `rgba(${fx.color},0.85)`;
          g.lineWidth = 1.2;
          g.lineCap = "round";
          g.beginPath();
          for (const b of flock) {
            const x = fx0 + b.x, y = baseY + b.y + Math.sin(t * 1.3 + b.ph) * 2;
            const f = Math.sin(t * 9 + b.ph) * b.s * 0.6;
            g.moveTo(x - b.s, y - f);
            g.quadraticCurveTo(x - b.s * 0.4, y - f * 0.2 - b.s * 0.25, x, y);
            g.quadraticCurveTo(x + b.s * 0.4, y - f * 0.2 - b.s * 0.25, x + b.s, y - f);
          }
          g.stroke();
          if (fx0 > 1.35 * W || fx0 < -0.35 * W) {
            flock = [];
            wait = rnd(4, 9);
          }
        },
      };
    }
    case "glints": {
      const pts = Array.from({ length: N(fx.n) }, () => ({ x: Math.random(), y: rnd(fx.y0, fx.y1), p: rnd(0, 10), sp: rnd(0.6, 1.6), s: rnd(0.8, 2.2) }));
      return {
        draw(g, t, _dt, W, H) {
          g.globalCompositeOperation = "lighter";
          g.fillStyle = "#fff";
          for (const q of pts) {
            const a = Math.pow(Math.max(0, Math.sin(t * q.sp + q.p)), 8);
            if (a < 0.03) continue;
            g.globalAlpha = a * 0.9;
            const x = q.x * W, y = q.y * H, s = q.s * (0.6 + a);
            g.fillRect(x - s * 2.2, y - 0.35, s * 4.4, 0.7);
            g.fillRect(x - 0.35, y - s * 2.2, 0.7, s * 4.4);
            g.fillRect(x - s * 0.5, y - s * 0.5, s, s);
          }
          g.globalAlpha = 1;
          g.globalCompositeOperation = "source-over";
        },
      };
    }
    case "bokeh": {
      const sprites = fx.colors.map((c) => glowSprite(c));
      const ps = Array.from({ length: N(fx.n) }, () => ({ x: Math.random(), y: Math.random(), r: rnd(10, 38), v: rnd(0.006, 0.02), p: rnd(0, 6), s: Math.floor(Math.random() * sprites.length) }));
      return {
        draw(g, t, dt, W, H) {
          g.globalCompositeOperation = "lighter";
          for (const b of ps) {
            b.y -= b.v * dt;
            if (b.y < -0.1) (b.y = 1.1), (b.x = Math.random());
            g.globalAlpha = 0.18 + 0.14 * Math.sin(t * 0.8 + b.p);
            const r = b.r * Math.min(1.2, W / 700);
            g.drawImage(sprites[b.s], b.x * W + Math.sin(t * 0.3 + b.p) * 10 - r, b.y * H - r, r * 2, r * 2);
          }
          g.globalAlpha = 1;
          g.globalCompositeOperation = "source-over";
        },
      };
    }
    case "motes":
    case "fireflies": {
      const firefly = fx.k === "fireflies";
      const spr = glowSprite(firefly ? "255,236,120" : fx.color, 32);
      const y0 = firefly ? fx.y0 : 0;
      const ps = Array.from({ length: N(fx.n) }, () => ({ x: Math.random(), y: rnd(y0, 1), p: rnd(0, 20), s: rnd(2, firefly ? 9 : 5), v: rnd(0.2, 0.6) }));
      return {
        draw(g, t, dt, W, H) {
          g.globalCompositeOperation = "lighter";
          for (const m of ps) {
            m.x += Math.sin(t * 0.3 * m.v + m.p) * 0.0025 * dt * 10;
            m.y += (firefly ? Math.cos(t * 0.4 + m.p) * 0.002 : -0.004 * m.v) * dt * 10;
            if (m.y < y0 - 0.05) m.y = 1.02;
            if (m.y > 1.05) m.y = y0;
            m.x = (m.x + 1) % 1;
            g.globalAlpha = firefly ? Math.pow(0.5 + 0.5 * Math.sin(t * 1.7 + m.p), 3) : 0.35 + 0.3 * Math.sin(t + m.p);
            g.drawImage(spr, m.x * W - m.s, m.y * H - m.s, m.s * 2, m.s * 2);
          }
          g.globalAlpha = 1;
          g.globalCompositeOperation = "source-over";
        },
      };
    }
    case "leaves": {
      const cols = ["#d97706", "#b45309", "#65a30d", "#ca8a04", "#9a3412"];
      const ls = Array.from({ length: N(fx.n) }, () => ({ x: Math.random(), y: rnd(-1, 1), r: rnd(0, 6), vr: rnd(-2, 2), v: rnd(0.03, 0.07), s: rnd(3, 6), c: cols[Math.floor(Math.random() * cols.length)], p: rnd(0, 6) }));
      return {
        draw(g, t, dt, W, H) {
          for (const l of ls) {
            l.y += l.v * dt;
            l.r += l.vr * dt;
            if (l.y > 1.05) (l.y = -0.05), (l.x = Math.random());
            const x = (l.x + Math.sin(t * 0.8 + l.p) * 0.03) * W, y = l.y * H;
            g.save();
            g.translate(x, y);
            g.rotate(l.r);
            g.scale(1, Math.abs(Math.cos(t * 2 + l.p)) * 0.8 + 0.2);
            g.fillStyle = l.c;
            g.globalAlpha = 0.85;
            g.beginPath();
            g.ellipse(0, 0, l.s, l.s * 0.45, 0, 0, Math.PI * 2);
            g.fill();
            g.restore();
          }
          g.globalAlpha = 1;
        },
      };
    }
    case "stars": {
      const st = Array.from({ length: N(fx.n) }, () => ({ x: Math.random(), y: Math.random() * fx.y1, p: rnd(0, 10), s: rnd(0.5, 1.6) }));
      return {
        draw(g, t, _dt, W, H) {
          g.fillStyle = "#fff";
          for (const s of st) {
            g.globalAlpha = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.4 + s.p), 2);
            g.fillRect(s.x * W, s.y * H, s.s, s.s);
          }
          g.globalAlpha = 1;
        },
      };
    }
    case "shooting": {
      let s: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
      let wait = rnd(1, 3);
      return {
        draw(g, _t, dt, W, H) {
          if (!s) {
            wait -= dt;
            if (wait <= 0) s = { x: rnd(0.1, 0.9) * W, y: rnd(0.02, 0.3) * H, vx: rnd(-1, 1) > 0 ? W * 0.7 : -W * 0.7, vy: H * 0.3, life: 0 };
            return;
          }
          s.life += dt;
          const k = s.life / 0.9;
          const x = s.x + s.vx * s.life, y = s.y + s.vy * s.life;
          const tail = 0.12;
          const grd = g.createLinearGradient(x, y, x - s.vx * tail, y - s.vy * tail);
          grd.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k)})`);
          grd.addColorStop(1, "rgba(180,210,255,0)");
          g.strokeStyle = grd;
          g.lineWidth = 1.6;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x - s.vx * tail, y - s.vy * tail);
          g.stroke();
          if (k >= 1) (s = null), (wait = rnd(2.5, 6));
        },
      };
    }
    case "aurora": {
      const bands = [
        { y: 0.3, h: 0.22, f: 0.004, sp: 0.25, c0: "60,255,170", c1: "120,90,255", a: 0.32 },
        { y: 0.2, h: 0.16, f: 0.006, sp: -0.18, c0: "80,255,200", c1: "200,80,255", a: 0.22 },
      ];
      return {
        draw(g, t, _dt, W, H) {
          g.globalCompositeOperation = "lighter";
          for (const b of bands) {
            const base = (x: number) => (b.y + Math.sin(x * b.f * (900 / W) + t * b.sp) * 0.05 + Math.sin(x * b.f * 2.3 * (900 / W) - t * b.sp * 1.7) * 0.025) * H;
            const hgt = (x: number) => (b.h * (0.6 + 0.4 * Math.sin(x * 0.01 * (900 / W) + t * 0.4))) * H;
            const grd = g.createLinearGradient(0, (b.y + 0.08) * H, 0, (b.y - b.h - 0.05) * H);
            grd.addColorStop(0, `rgba(${b.c0},0)`);
            grd.addColorStop(0.12, `rgba(${b.c0},${b.a})`);
            grd.addColorStop(0.55, `rgba(${b.c0},${b.a * 0.45})`);
            grd.addColorStop(1, `rgba(${b.c1},0)`);
            g.fillStyle = grd;
            g.beginPath();
            const step = Math.max(8, W / 90);
            g.moveTo(0, base(0));
            for (let x = step; x <= W + step; x += step) g.lineTo(x, base(x));
            for (let x = W + step; x >= 0; x -= step) g.lineTo(x, base(x) - hgt(x));
            g.closePath();
            g.fill();
          }
          g.globalCompositeOperation = "source-over";
        },
      };
    }
    case "rain": {
      const ds = Array.from({ length: N(fx.n) }, () => ({ x: Math.random(), y: Math.random(), l: rnd(8, 18), v: rnd(0.9, 1.4) }));
      return {
        draw(g, _t, dt, W, H) {
          g.strokeStyle = "rgba(200,220,255,0.28)";
          g.lineWidth = 1;
          g.beginPath();
          for (const d of ds) {
            d.y += d.v * dt;
            d.x += 0.12 * dt;
            if (d.y > 1.05) (d.y = -0.05), (d.x = Math.random());
            if (d.x > 1) d.x -= 1;
            const x = d.x * W, y = d.y * H;
            g.moveTo(x, y);
            g.lineTo(x - d.l * 0.2, y - d.l);
          }
          g.stroke();
        },
      };
    }
    case "flare": {
      const spr = glowSprite("255,190,120", 128);
      const ghosts = [
        { d: 0.35, r: 0.05, c: glowSprite("255,140,90", 64) },
        { d: 0.7, r: 0.09, c: glowSprite("120,180,255", 64) },
        { d: 1.25, r: 0.04, c: glowSprite("200,120,255", 64) },
      ];
      return {
        draw(g, t, _dt, W, H) {
          const ox = fx.x * W, oy = fx.y * H, cx = W / 2, cy = H / 2;
          const pulse = 0.85 + 0.15 * Math.sin(t * 0.7);
          g.globalCompositeOperation = "lighter";
          g.globalAlpha = 0.55 * pulse;
          const r = Math.min(W, H) * 0.35;
          g.drawImage(spr, ox - r, oy - r, r * 2, r * 2);
          g.globalAlpha = 0.18 * pulse;
          g.fillStyle = "rgba(255,210,160,1)";
          g.fillRect(0, oy - 0.8, W, 1.6);
          for (const q of ghosts) {
            const x = ox + (cx - ox) * q.d * 2, y = oy + (cy - oy) * q.d * 2, rr = Math.min(W, H) * q.r;
            g.globalAlpha = 0.22 * pulse;
            g.drawImage(q.c, x - rr, y - rr, rr * 2, rr * 2);
          }
          g.globalAlpha = 1;
          g.globalCompositeOperation = "source-over";
        },
      };
    }
    case "heli": {
      const red = glowSprite("255,60,60", 32), white = glowSprite("255,255,255", 32);
      let x = rnd(-0.1, 0.3), dir = 1;
      return {
        draw(g, t, dt, W, H) {
          x += dir * 0.018 * dt;
          if (x > 1.15) dir = -1;
          if (x < -0.15) dir = 1;
          const px = x * W, py = (fx.y + Math.sin(t * 0.3) * 0.02) * H;
          // searchlight cone
          const sway = Math.sin(t * 0.5) * 0.25;
          const grd = g.createLinearGradient(px, py, px + sway * H, py + H * 0.6);
          grd.addColorStop(0, "rgba(255,250,230,0.16)");
          grd.addColorStop(1, "rgba(255,250,230,0)");
          g.globalCompositeOperation = "lighter";
          g.fillStyle = grd;
          g.beginPath();
          g.moveTo(px, py);
          g.lineTo(px + sway * H - H * 0.07, py + H * 0.6);
          g.lineTo(px + sway * H + H * 0.07, py + H * 0.6);
          g.closePath();
          g.fill();
          g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6);
          g.drawImage(red, px - 8, py - 8, 16, 16);
          g.globalAlpha = t % 1.3 < 0.08 ? 1 : 0;
          g.drawImage(white, px + 3 - 10, py - 1 - 10, 20, 20);
          g.globalAlpha = 1;
          g.globalCompositeOperation = "source-over";
        },
      };
    }
  }
}

export default function SceneFX({ scene }: { scene: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    const cv = ref.current;
    if (!cv || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const g = cv.getContext("2d");
    if (!g) return;
    let W = 0, H = 0;
    const resize = () => {
      W = cv.width = Math.round(innerWidth * RES);
      H = cv.height = Math.round(innerHeight * RES);
      current = "";
    };
    let current = "";
    let layers: Layer[] = [];
    let fade = 0;
    let raf = 0;
    let cleared = false;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || now - last < 1000 / 31) return; // ~30fps is plenty for drifting light
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;
      const want = sceneRef.current;
      if (want !== current) {
        // fade out, then swap the effect set
        fade -= dt * 2.5;
        if (fade <= 0 || !current) {
          fade = 0;
          current = want;
          layers = (SCENE_FX[want] ?? []).map((f) => build(f, W, H));
        }
      } else if (fade < 1) fade = Math.min(1, fade + dt * 1.2);
      if (!layers.length) {
        if (!cleared) g.clearRect(0, 0, W, H);
        cleared = true;
        return;
      }
      cleared = false;
      g.clearRect(0, 0, W, H);
      cv.style.opacity = String(fade);
      const t = now / 1000;
      for (const l of layers) l.draw(g, t, dt, W, H);
    };
    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
