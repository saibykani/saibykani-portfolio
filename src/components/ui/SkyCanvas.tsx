"use client";

import { useEffect, useRef } from "react";

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
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;                 // 0..1
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.03;

  // parallax
  vec2 par = uMouse * 0.06;

  // domain-warped clouds
  vec2 q = p * 1.6 + par;
  vec2 w = vec2(fbm(q + vec2(0.0, t)), fbm(q + vec2(5.2, -t * 0.7)));
  float c = fbm(q * 1.2 + 2.2 * w + vec2(t * 1.3, t * 0.4));
  float wisps = fbm(q * 3.5 - w * 1.5 + vec2(-t * 2.0, 0.0));

  // clouds gather toward the left/right edges and top, clear-ish in the middle
  float edge = smoothstep(0.05, 0.75, abs(p.x) / (aspect * 0.5));
  float top = smoothstep(0.35, 0.95, uv.y);
  float mask = clamp(edge * 1.1 + top * 0.45 + 0.22, 0.0, 1.0);
  float cloud = smoothstep(0.28, 0.82, c) * mask;
  cloud += smoothstep(0.5, 0.95, wisps) * 0.35 * mask;
  cloud = clamp(cloud, 0.0, 1.0);

  // palette (deep navy sky, luminous blue cloud banks)
  vec3 deep = vec3(0.01, 0.02, 0.085);
  vec3 navy = vec3(0.03, 0.07, 0.25);
  vec3 blue = vec3(0.12, 0.24, 0.62);
  vec3 glow = vec3(0.5, 0.63, 1.0);

  vec3 col = mix(deep, navy, smoothstep(0.0, 1.0, uv.y) * 0.9 + 0.1);
  col = mix(col, blue, cloud);
  col += glow * pow(cloud, 2.2) * 0.6;
  // soft rim light on cloud edges
  col += glow * smoothstep(0.35, 0.6, cloud) * (1.0 - smoothstep(0.6, 0.9, cloud)) * 0.12;

  // stars (behind thin clouds, parallax at different depths)
  float s = stars(uv * vec2(aspect, 1.0) + par * 0.3, 90.0, uTime) * 0.9
          + stars(uv * vec2(aspect, 1.0) + par * 0.6 + 11.0, 55.0, uTime * 1.3);
  col += vec3(0.85, 0.9, 1.0) * s * (1.0 - cloud * 0.8);

  // fade to black at the bottom
  col *= smoothstep(-0.05, 0.45, uv.y) * 0.85 + 0.15;
  col = mix(col, vec3(0.0), smoothstep(0.35, 0.0, uv.y) * 0.9);

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function SkyCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
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
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.ready = "1";
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000 data-[ready]:opacity-100 ${className}`}
    />
  );
}
