"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, MousePointer2, Keyboard } from "lucide-react";
import { SectionHeading } from "@/components/ui/primitives";

type Bug = { x: number; y: number; alive: boolean; kind: number; wiggle: number };
type Shot = { x: number; y: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Popup = { x: number; y: number; life: number };

const BUG_COLORS = ["#f43f5e", "#a855f7", "#22d3ee", "#f59e0b"];
const HI_KEY = "bughunt-hi";

function readHi() {
  try {
    return Number(localStorage.getItem(HI_KEY) || 0);
  } catch {
    return 0;
  }
}
function writeHi(v: number) {
  try {
    localStorage.setItem(HI_KEY, String(v));
  } catch {}
}

export default function BugHunt() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [hud, setHud] = useState({ score: 0, hi: 0, wave: 1, lives: 3 });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const startRef = useRef<() => void>(() => {});

  useEffect(() => {
    setHud((h) => ({ ...h, hi: readHi() }));
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // --- game state ---
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.6 + 0.3, v: Math.random() * 0.6 + 0.2 }));
    let ship = { x: 0.5, target: 0.5 };
    let bugs: Bug[] = [];
    let shots: Shot[] = [];
    let particles: Particle[] = [];
    let popups: Popup[] = [];
    let dir = 1;
    let marchX = 0;
    let marchY = 0;
    let score = 0;
    let wave = 1;
    let lives = 3;
    let fireCd = 0;
    let invuln = 0;
    let keys = { l: false, r: false };
    let t = 0;

    const spawnWave = () => {
      bugs = [];
      const cols = Math.max(6, Math.min(11, Math.floor(W / 70)));
      const rows = Math.min(3 + Math.floor(wave / 2), 5);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          bugs.push({ x: (c + 0.5) / cols, y: 40 + r * 38, alive: true, kind: r % BUG_COLORS.length, wiggle: Math.random() * 6 });
      dir = 1;
      marchX = 0;
      marchY = 0;
    };

    const start = () => {
      score = 0;
      wave = 1;
      lives = 3;
      shots = [];
      particles = [];
      popups = [];
      invuln = 60;
      spawnWave();
      setHud({ score, hi: readHi(), wave, lives });
      setPhase("playing");
    };
    startRef.current = start;

    const explode = (x: number, y: number, color: string, n = 16) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 3 + 1;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color });
      }
    };

    const drawBug = (x: number, y: number, kind: number, wiggle: number) => {
      const c = BUG_COLORS[kind];
      const leg = Math.sin(t * 0.3 + wiggle) * 3;
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(x + s * 8, y + i * 5);
          ctx.lineTo(x + s * 15, y + i * 6 + (i === 0 ? leg : -leg));
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 11);
      ctx.lineTo(x - 8, y - 17);
      ctx.moveTo(x + 4, y - 11);
      ctx.lineTo(x + 8, y - 17);
      ctx.stroke();
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(x, y, 9, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(x - 0.8, y - 10, 1.6, 20);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 4, y - 7, 2, 2);
      ctx.fillRect(x + 2, y - 7, 2, 2);
    };

    const drawShip = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      // thruster
      ctx.fillStyle = `rgba(56,189,248,${0.5 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(-5, 12);
      ctx.lineTo(0, 22 + Math.random() * 8);
      ctx.lineTo(5, 12);
      ctx.fill();
      const g = ctx.createLinearGradient(-16, 0, 16, 0);
      g.addColorStop(0, "#FF0080");
      g.addColorStop(0.5, "#7928CA");
      g.addColorStop(1, "#38bdf8");
      ctx.fillStyle = g;
      ctx.shadowColor = "#7dd3fc";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(16, 12);
      ctx.lineTo(6, 8);
      ctx.lineTo(0, 12);
      ctx.lineTo(-6, 8);
      ctx.lineTo(-16, 12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      ctx.ellipse(0, -2, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    let raf = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.2 });
    io.observe(canvas);

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      t++;
      ctx.clearRect(0, 0, W, H);

      // starfield
      for (const s of stars) {
        s.y += (s.v * (phaseRef.current === "playing" ? 2 : 0.6)) / H;
        if (s.y > 1) s.y = 0;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + s.s * 0.3})`;
        ctx.fillRect(s.x * W, s.y * H, s.s, s.s * (phaseRef.current === "playing" ? 3 : 1));
      }

      const playing = phaseRef.current === "playing";
      const shipY = H - 44;

      if (playing) {
        if (keys.l) ship.target -= 0.02;
        if (keys.r) ship.target += 0.02;
        ship.target = Math.max(0.03, Math.min(0.97, ship.target));
        ship.x += (ship.target - ship.x) * 0.2;

        // auto-fire
        if (--fireCd <= 0) {
          shots.push({ x: ship.x * W, y: shipY - 16 });
          fireCd = 11;
        }
        shots = shots.filter((s) => (s.y -= 9) > -10);

        // formation march
        const speed = 0.35 + wave * 0.12;
        marchX += dir * speed;
        const alive = bugs.filter((b) => b.alive);
        const xs = alive.map((b) => b.x * W * 0.8 + W * 0.1 + marchX);
        if (xs.length && (Math.max(...xs) > W - 24 || Math.min(...xs) < 24)) {
          dir *= -1;
          marchY += 14;
        }

        // collisions
        for (const b of alive) {
          const bx = b.x * W * 0.8 + W * 0.1 + marchX;
          const by = b.y + marchY;
          for (const s of shots) {
            if (Math.abs(s.x - bx) < 13 && Math.abs(s.y - by) < 14) {
              b.alive = false;
              s.y = -99;
              score += 10;
              explode(bx, by, BUG_COLORS[b.kind]);
              popups.push({ x: bx, y: by, life: 1 });
              break;
            }
          }
          if (b.alive && (by > shipY - 10 || (invuln <= 0 && Math.abs(bx - ship.x * W) < 20 && Math.abs(by - shipY) < 20))) {
            lives--;
            invuln = 90;
            explode(ship.x * W, shipY, "#38bdf8", 30);
            marchY = Math.max(0, marchY - 60);
            if (lives <= 0) {
              const hi = Math.max(readHi(), score);
              writeHi(hi);
              setHud({ score, hi, wave, lives: 0 });
              setPhase("over");
            }
            break;
          }
        }
        if (invuln > 0) invuln--;
        if (!bugs.some((b) => b.alive)) {
          wave++;
          spawnWave();
        }
        if (t % 6 === 0) setHud((h) => (h.score === score && h.wave === wave && h.lives === lives ? h : { ...h, score, wave, lives }));
      } else {
        // attract mode: slow drifting bugs
        if (!bugs.length) spawnWave();
        marchX = Math.sin(t / 60) * 40;
      }

      // draw bugs
      for (const b of bugs) if (b.alive) drawBug(b.x * W * 0.8 + W * 0.1 + marchX, b.y + marchY + (playing ? 0 : Math.sin(t / 30 + b.wiggle) * 4), b.kind, b.wiggle);

      // shots
      ctx.fillStyle = "#7dd3fc";
      ctx.shadowColor = "#7dd3fc";
      ctx.shadowBlur = 10;
      for (const s of shots) ctx.fillRect(s.x - 1.5, s.y - 8, 3, 12);
      ctx.shadowBlur = 0;

      // particles
      particles = particles.filter((p) => (p.life -= 0.03) > 0);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      ctx.globalAlpha = 1;

      // "+10 FIXED" popups
      popups = popups.filter((p) => (p.life -= 0.02) > 0);
      ctx.font = "10px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      for (const p of popups) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = "#86efac";
        ctx.fillText("+10 FIXED", p.x, p.y - (1 - p.life) * 30);
      }
      ctx.globalAlpha = 1;

      if (playing && !(invuln > 0 && Math.floor(t / 5) % 2)) drawShip(ship.x * W, shipY);
    };
    raf = requestAnimationFrame(loop);

    const setFromPointer = (clientX: number) => {
      const r = canvas.getBoundingClientRect();
      ship.target = (clientX - r.left) / r.width;
    };
    const onMove = (e: PointerEvent) => phaseRef.current === "playing" && setFromPointer(e.clientX);
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (phaseRef.current !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a") {
        keys.l = down;
        e.preventDefault();
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        keys.r = down;
        e.preventDefault();
      }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, []);

  return (
    <section className="container relative py-10">
      <SectionHeading eyebrow="Take a break" title="Squash some" highlight="bugs" className="mb-12" />

      <div ref={wrapRef} className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#f2f2f20c] p-1.5 shadow-border">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(0,0,0,0)_5%,rgba(255,255,255,0.8)_35%,rgb(255,255,255)_50%,rgba(255,255,255,0.8)_65%,rgba(0,0,0,0)_95%)]" />
        <div className="relative overflow-hidden rounded-[1.3rem] bg-[radial-gradient(120%_80%_at_50%_0%,#1e1b4b_0%,#05050f_60%)]">
          {/* scanlines */}
          <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.08] [background-image:repeating-linear-gradient(0deg,#fff_0_1px,transparent_1px_3px)]" />

          {/* HUD */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-4 font-arcade text-[10px] text-white/90 md:text-xs">
            <span>
              SCORE <span className="text-sky-300">{String(hud.score).padStart(5, "0")}</span>
            </span>
            <span className="hidden sm:inline">
              WAVE <span className="text-fuchsia-300">{hud.wave}</span>
            </span>
            <span>
              HI <span className="text-amber-300">{String(Math.max(hud.hi, hud.score)).padStart(5, "0")}</span>
            </span>
            <span className="text-rose-400">{"♥".repeat(Math.max(0, hud.lives))}</span>
          </div>

          <canvas ref={canvasRef} className="relative z-0 block h-[380px] w-full touch-none md:h-[440px]" />

          {phase !== "playing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-black/40 text-center"
            >
              <Gamepad2 className="size-10 text-sky-300" />
              <p className="font-arcade text-lg text-white md:text-2xl [text-shadow:0_0_18px_rgba(125,211,252,0.8)]">
                {phase === "over" ? "GAME OVER" : "BUG HUNT"}
              </p>
              {phase === "over" && <p className="font-arcade text-xs text-white/80">{hud.score} BUGS × 10 FIXED BEFORE PROD</p>}
              <button
                onClick={() => startRef.current()}
                className="animate-pulse rounded-md border-2 border-sky-300 bg-sky-400/10 px-6 py-3 font-arcade text-xs text-sky-200 transition hover:scale-105 hover:bg-sky-400/20"
              >
                {phase === "over" ? "PLAY AGAIN" : "PRESS START"}
              </button>
              <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[11px] text-white/60">
                <span className="inline-flex items-center gap-1.5">
                  <MousePointer2 className="size-3.5" /> Move / touch to steer
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Keyboard className="size-3.5" /> ← → keys
                </span>
                <span>Auto-fire on</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
