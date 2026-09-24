"use client";

import { useEffect, useRef } from "react";
import { onLightning, PALETTES, type Weather } from "@/components/weather/WeatherContext";

/*
 * Animated night sky rendered with a WebGL fragment shader:
 * domain-warped fbm nebula clouds (denser toward the edges, like a sky
 * framed by clouds), a twinkling star field, and a soft mouse parallax.
 * Falls back to the CSS gradient behind it when WebGL is unavailable.
 */

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uGap, uSky, uCloud, uRim, uGlow;
uniform float uStars, uCover, uGlowAmt, uFlash, uFlashX;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = r * p * 2.02 + 0.13; a *= 0.5; }
  return v;
}

float stars(vec2 uv, float scale, float t) {
  vec2 g = uv * scale;
  vec2 id = floor(g), f = fract(g) - 0.5;
  float h = hash(id);
  if (h < 0.965) return 0.0;
  vec2 o = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
  float d = length(f - o * 0.7);
  float tw = 0.55 + 0.45 * sin(t * (1.5 + h * 3.0) + h * 40.0);
  return smoothstep(0.08, 0.0, d) * tw;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;          // 0..1, y up
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.02;
  vec2 par = uMouse * 0.05;

  // --- cloud density: domain-warped billowy fbm, detailed at several scales ---
  vec2 q = p * 3.0 + par;
  vec2 w = vec2(fbm(q * 0.6 + vec2(t, 0.0)), fbm(q * 0.6 + vec2(3.7, -t * 0.8)));
  vec2 dp = q + 0.9 * w + vec2(t * 1.5, t * 0.3);
  float base = fbm(dp);
  float detail = fbm(dp * 3.1 - w * 2.0 + vec2(-t * 2.5, 0.0));
  float billow = 1.0 - abs(2.0 * fbm(dp * 1.7 + 4.1) - 1.0);   // puffy ridges

  // coverage: tall cloud banks that run the full height of the left/right edges,
  // with a clear open sky through the middle (where the headline sits)
  float ex = abs(p.x) / (aspect * 0.5);
  float wobble = (fbm(vec2(uv.y * 2.5, t * 0.5)) - 0.5) * 0.22;     // ragged inner edge of the banks
  float edge = smoothstep(0.30 + wobble, 0.95, ex);
  float coverage = 0.24 + edge * 0.5 + smoothstep(0.7, 1.0, uv.y) * 0.1 + uCover;
  float d = base * 0.55 + billow * 0.28 + detail * 0.30;
  d = smoothstep(1.0 - coverage - 0.08, 1.0 - coverage + 0.32, d);

  // fake sunlight from the upper-left: brighter where density falls off toward the light
  vec2 lo = vec2(-0.035, 0.05);
  float dl = fbm(dp + lo * 3.0) * 0.55 + (1.0 - abs(2.0 * fbm((dp + lo * 3.0) * 1.7 + 4.1) - 1.0)) * 0.28 + detail * 0.30;
  dl = smoothstep(1.0 - coverage - 0.08, 1.0 - coverage + 0.32, dl);
  float lit = clamp((d - dl) * 2.2 + 0.5, 0.0, 1.0);

  // --- palette sampled from the reference sky ---
  // (palette comes from the active weather theme and is cross-faded on the CPU)
  vec3 gap = uGap, sky = uSky, cloud = uCloud, rim = uRim;

  // open sky: smooth mid blue with a faint haze texture
  vec3 col = sky * (0.86 + 0.22 * base);
  // shadowed pockets around the cloud banks
  col = mix(col, gap, smoothstep(0.05, 0.5, d) * (1.0 - lit) * 0.85);
  col = mix(col, cloud, smoothstep(0.45, 1.0, d) * (0.55 + 0.45 * lit));
  col += rim * pow(d, 3.0) * lit * 0.28;

  // horizon glow (sunset in summer/autumn, faint city glow at night)
  float hg = exp(-length((p - vec2(0.0, -0.55)) * vec2(0.9, 2.2)) * 1.6);
  col += uGlow * hg * uGlowAmt * (1.0 - d * 0.5);

  // lightning: flash lights up the clouds, strongest near the strike
  float near = exp(-abs(p.x - (uFlashX - 0.5) * aspect) * 1.4);
  col += vec3(0.72, 0.78, 1.0) * uFlash * (0.25 + d * 1.1) * (0.4 + near);

  // gentle vertical grade: slightly brighter/cleaner up top
  col *= (0.9 + 0.2 * smoothstep(0.3, 1.0, uv.y)) * 0.86;

  // stars, mostly visible through the gaps
  float s = stars(uv * vec2(aspect, 1.0) + par * 0.3, 110.0, uTime) * 0.8
          + stars(uv * vec2(aspect, 1.0) + par * 0.6 + 11.0, 60.0, uTime * 1.3);
  col += vec3(0.8, 0.88, 1.0) * s * (1.0 - smoothstep(0.3, 0.9, d)) * 0.9 * uStars;

  // fade to black toward the bottom (the reference is near-black below ~80%)
  // (edges keep their clouds lower down, so the banks read as extending the full height)
  col *= smoothstep(0.0, mix(0.42, 0.2, edge), uv.y);

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function SkyCanvas({ className = "", weather = "night" }: { className?: string; weather?: Weather }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(PALETTES[weather]);
  targetRef.current = PALETTES[weather];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error("SkyCanvas shader:", gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("SkyCanvas link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMouse = gl.getUniformLocation(prog, "uMouse");
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uni = { gap: U("uGap"), sky: U("uSky"), cloud: U("uCloud"), rim: U("uRim"), glow: U("uGlow"), stars: U("uStars"), cover: U("uCover"), glowAmt: U("uGlowAmt"), flash: U("uFlash"), flashX: U("uFlashX") };
    // current (animated) palette, eased toward the theme target every frame
    const cur = JSON.parse(JSON.stringify(targetRef.current));
    let flash = 0;
    let flashX = 0.5;
    const offLightning = onLightning((x) => {
      flash = 1;
      flashX = x;
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Render at reduced resolution; clouds are soft so this is invisible and keeps it cheap
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;

    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * scale));
      const h = Math.max(1, Math.floor(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const target = { x: 0, y: 0 };
    const mouse = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = -(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      mouse.x += (target.x - mouse.x) * 0.04;
      mouse.y += (target.y - mouse.y) * 0.04;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 20 : (now - start) / 1000 + 20);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      const tgt = targetRef.current as any;
      for (const k of ["gap", "sky", "cloud", "rim", "glow"]) {
        for (let i = 0; i < 3; i++) cur[k][i] += (tgt[k][i] - cur[k][i]) * 0.04;
        gl.uniform3f((uni as any)[k], cur[k][0], cur[k][1], cur[k][2]);
      }
      for (const k of ["stars", "cover", "glowAmt"]) {
        cur[k] += (tgt[k] - cur[k]) * 0.04;
        gl.uniform1f((uni as any)[k], cur[k]);
      }
      // flicker-decay like real lightning
      flash *= 0.9;
      gl.uniform1f(uni.flash, flash > 0.02 ? flash * (0.7 + Math.random() * 0.3) : 0);
      gl.uniform1f(uni.flashX, flashX);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.ready = "1";
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      offLightning();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000 data-[ready]:opacity-100 ${className}`}
    />
  );
}
