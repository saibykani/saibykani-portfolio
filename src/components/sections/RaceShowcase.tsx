"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LIVERIES } from "@/components/ui/F1Car";
import { SectionHeading } from "@/components/ui/primitives";
import { useWeather } from "@/components/weather/WeatherContext";

type Hud = { kmh: number; gear: number; leader: "bull" | "arrow"; gap: number };

export default function RaceShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const { weather } = useWeather();
  const rainRef = useRef(weather === "rain");
  rainRef.current = weather === "rain";
  const [hud, setHud] = useState<Hud>({ kmh: 0, gear: 1, leader: "arrow", gap: 0.3 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      const { buildF1Car } = await import("@/components/three/f1car3d");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog("#000000", 16, 42);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = env;
      scene.environmentIntensity = 0.9;

      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

      scene.add(new THREE.HemisphereLight("#b8c7ff", "#0a0a0a", 0.9));
      const sun = new THREE.DirectionalLight("#ffffff", 2.4);
      sun.position.set(4, 10, 6);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 6, bottom: -6, near: 1, far: 30 });
      sun.shadow.radius = 4;
      scene.add(sun);
      const rim = new THREE.DirectionalLight("#7c3aed", 1.2);
      rim.position.set(-6, 3, -6);
      scene.add(rim);

      // --- track ---
      const asphaltCanvas = document.createElement("canvas");
      asphaltCanvas.width = 512;
      asphaltCanvas.height = 256;
      const ag = asphaltCanvas.getContext("2d")!;
      ag.fillStyle = "#1c1d20";
      ag.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 9000; i++) {
        const v = 20 + Math.random() * 30;
        ag.fillStyle = `rgb(${v},${v},${v + 3})`;
        ag.fillRect(Math.random() * 512, Math.random() * 256, 1.5, 1.5);
      }
      ag.fillStyle = "#e5e5e5";
      ag.fillRect(0, 126, 220, 6); // lane dash
      ag.fillStyle = "rgba(0,0,0,0.35)";
      ag.fillRect(300, 60, 200, 4); // rubber marks
      ag.fillRect(120, 190, 240, 4);
      const asphalt = new THREE.CanvasTexture(asphaltCanvas);
      asphalt.colorSpace = THREE.SRGBColorSpace;
      asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
      asphalt.repeat.set(8, 1);
      asphalt.anisotropy = 8;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 8.4), new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.85, metalness: 0.05 }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const kerbCanvas = document.createElement("canvas");
      kerbCanvas.width = 128;
      kerbCanvas.height = 16;
      const kg = kerbCanvas.getContext("2d")!;
      kg.fillStyle = "#e11d48";
      kg.fillRect(0, 0, 64, 16);
      kg.fillStyle = "#f5f5f5";
      kg.fillRect(64, 0, 64, 16);
      const kerbTex = new THREE.CanvasTexture(kerbCanvas);
      kerbTex.colorSpace = THREE.SRGBColorSpace;
      kerbTex.wrapS = THREE.RepeatWrapping;
      kerbTex.repeat.set(40, 1);
      const kerbMat = new THREE.MeshStandardMaterial({ map: kerbTex, roughness: 0.6 });
      for (const z of [-4.5, 4.5]) {
        const k = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.6), kerbMat);
        k.rotation.x = -Math.PI / 2;
        k.position.set(0, 0.01, z);
        k.receiveShadow = true;
        scene.add(k);
      }
      // barrier with neon LED strip
      const wall = new THREE.Mesh(new THREE.BoxGeometry(80, 0.9, 0.2), new THREE.MeshStandardMaterial({ color: "#0d0e12", roughness: 0.4, metalness: 0.6 }));
      wall.position.set(0, 0.45, -5.6);
      scene.add(wall);
      const ledCanvas = document.createElement("canvas");
      ledCanvas.width = 512;
      ledCanvas.height = 8;
      const lg = ledCanvas.getContext("2d")!;
      const grd = lg.createLinearGradient(0, 0, 512, 0);
      ["#FF0080", "#7928CA", "#0070F3", "#38bdf8", "#FF0080"].forEach((c, i) => grd.addColorStop(i / 4, c));
      lg.fillStyle = grd;
      lg.fillRect(0, 0, 512, 8);
      const ledTex = new THREE.CanvasTexture(ledCanvas);
      ledTex.colorSpace = THREE.SRGBColorSpace;
      ledTex.wrapS = THREE.RepeatWrapping;
      ledTex.repeat.set(6, 1);
      const led = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.14), new THREE.MeshBasicMaterial({ map: ledTex }));
      led.position.set(0, 0.72, -5.49);
      scene.add(led);

      // --- cars ---
      const carA = buildF1Car(LIVERIES.bull);
      const carB = buildF1Car(LIVERIES.arrow);
      carA.group.position.z = 1.8;
      carB.group.position.z = -1.8;
      scene.add(carA.group, carB.group);

      // --- speed streaks + floor sparks ---
      const streakCount = 90;
      const streakGeo = new THREE.BufferGeometry();
      const sPos = new Float32Array(streakCount * 6);
      const sSeed = Array.from({ length: streakCount }, () => ({ x: Math.random() * 30 - 15, y: 0.2 + Math.random() * 1.6, z: Math.random() * 8 - 4, len: 0.6 + Math.random() * 1.6 }));
      streakGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
      const streakMat = new THREE.LineBasicMaterial({ color: "#9fb8ff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      scene.add(new THREE.LineSegments(streakGeo, streakMat));

      const sparkN = 120;
      const sparkGeo = new THREE.BufferGeometry();
      const spPos = new Float32Array(sparkN * 3);
      const spVel = Array.from({ length: sparkN }, () => new THREE.Vector3());
      const spLife = new Float32Array(sparkN);
      sparkGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
      const sparkMat = new THREE.PointsMaterial({ color: "#ffb347", size: 0.06, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const sparks = new THREE.Points(sparkGeo, sparkMat);
      sparks.frustumCulled = false;
      scene.add(sparks);
      let sparkHead = 0;

      // --- sizing / visibility ---
      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w < 700 ? 58 : 38;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);
      let visible = false;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(mount);

      // --- loop ---
      const clock = new THREE.Clock();
      let lastScroll = window.scrollY;
      let throttle = 0;
      let dist = 0;
      let hudT = 0;
      let raf = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(clock.getDelta(), 0.05);
        if (!visible || document.hidden) {
          lastScroll = window.scrollY;
          return;
        }
        const t = clock.elapsedTime;
        // throttle from scroll velocity (+ steady cruising speed)
        const sv = Math.abs(window.scrollY - lastScroll) / Math.max(dt, 0.001);
        lastScroll = window.scrollY;
        throttle += (Math.min(1, sv / 2500) - throttle) * 0.08;
        const speed = 18 + throttle * 55; // world units / s
        dist += speed * dt;

        // track movement illusion
        asphalt.offset.x = (dist / 10) % 1;
        kerbTex.offset.x = (dist / 2) % 1;
        ledTex.offset.x = (t * 0.05) % 1;

        // race: section progress sets who leads; cars jostle and overtake
        const r = sectionRef.current!.getBoundingClientRect();
        const prog = THREE.MathUtils.clamp(1 - (r.top + r.height) / (window.innerHeight + r.height), 0, 1);
        const swing = (prog - 0.5) * 5.5;
        carA.group.position.x = 0.4 + swing * 0.55 + Math.sin(t * 0.45) * 0.7;
        carB.group.position.x = 0.4 - swing * 0.55 + Math.cos(t * 0.37) * 0.7;
        for (const [car, ph] of [
          [carA, 0],
          [carB, 1.7],
        ] as const) {
          car.group.position.y = Math.sin(t * 22 + ph) * 0.006 * (0.5 + throttle);
          car.body.rotation.z = -throttle * 0.012; // squat under acceleration
          car.group.rotation.y = Math.sin(t * 0.6 + ph) * 0.02; // tiny steering
          for (const w of car.wheels) w.rotation.z -= (speed * dt) / 0.34;
          (car.rainLight.material as import("three").MeshBasicMaterial).color.setRGB(rainRef.current && Math.sin(t * 12) > 0 ? 1 : 0.35, 0.05, 0.05);
          // floor sparks at speed
          if (throttle > 0.35 && Math.random() < throttle) {
            for (let s = 0; s < 3; s++) {
              const i = sparkHead++ % sparkN;
              spPos.set([car.group.position.x - 1.9, 0.08, car.group.position.z + (Math.random() - 0.5) * 0.9], i * 3);
              spVel[i].set(-(4 + Math.random() * 6), 1 + Math.random() * 2.5, (Math.random() - 0.5) * 2);
              spLife[i] = 0.5 + Math.random() * 0.3;
            }
          }
        }
        for (let i = 0; i < sparkN; i++) {
          if (spLife[i] <= 0) {
            spPos[i * 3 + 1] = -10;
            continue;
          }
          spLife[i] -= dt;
          spVel[i].y -= 9 * dt;
          spPos[i * 3] += spVel[i].x * dt;
          spPos[i * 3 + 1] = Math.max(0.02, spPos[i * 3 + 1] + spVel[i].y * dt);
          spPos[i * 3 + 2] += spVel[i].z * dt;
        }
        sparkGeo.attributes.position.needsUpdate = true;

        // streaks
        streakMat.opacity = 0.15 + throttle * 0.55;
        for (let i = 0; i < streakCount; i++) {
          const s = sSeed[i];
          s.x -= speed * dt * 1.4;
          if (s.x < -16) s.x = 16;
          const len = s.len * (0.6 + throttle * 2.5);
          sPos.set([s.x, s.y, s.z, s.x + len, s.y, s.z], i * 6);
        }
        streakGeo.attributes.position.needsUpdate = true;

        // chase camera with gentle sway
        const mid = (carA.group.position.x + carB.group.position.x) / 2;
        camera.position.set(mid + 2.4 + Math.sin(t * 0.3) * 0.35, 3.3 + Math.sin(t * 0.5) * 0.06, 7.6);
        camera.lookAt(mid + 0.3, 0.2, 0);

        renderer.render(scene, camera);

        // HUD (throttled)
        hudT += dt;
        if (hudT > 0.12) {
          hudT = 0;
          const kmh = Math.round(160 + throttle * 180);
          const lead = carA.group.position.x > carB.group.position.x ? "bull" : "arrow";
          setHud({ kmh, gear: Math.min(8, 1 + Math.floor(kmh / 44)), leader: lead, gap: Math.abs(carA.group.position.x - carB.group.position.x) * 0.083 });
        }
      };
      loop();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        carA.dispose();
        carB.dispose();
        scene.traverse((o) => {
          const m = o as import("three").Mesh;
          m.geometry?.dispose?.();
          const mat = m.material as import("three").Material | import("three").Material[] | undefined;
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
          else mat?.dispose?.();
        });
        [asphalt, kerbTex, ledTex, env].forEach((x) => x.dispose());
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const rows = hud.leader === "bull" ? (["bull", "arrow"] as const) : (["arrow", "bull"] as const);
  const revLeds = Math.round(((hud.kmh - 160) / 180) * 15);

  return (
    <section ref={sectionRef} className="relative py-12">
      <SectionHeading eyebrow="Race Mode" title="Built for" highlight="speed" className="container mb-8" />

      <div className="container">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#f2f2f20c] p-1.5 shadow-border">
          <div className="absolute inset-x-0 top-0 z-10 h-px bg-[linear-gradient(90deg,rgba(0,0,0,0)_5%,rgba(255,255,255,0.8)_35%,rgb(255,255,255)_50%,rgba(255,255,255,0.8)_65%,rgba(0,0,0,0)_95%)]" />
          <div className="relative h-[300px] overflow-hidden rounded-[1.3rem] bg-[radial-gradient(120%_90%_at_50%_0%,#161a2e_0%,#050507_65%)] md:h-[380px]">
            <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />

            {/* TV-style position tower */}
            <div className="absolute left-3 top-3 z-10 w-48 overflow-hidden rounded-lg border border-white/10 bg-black/70 font-mono text-[11px] text-white shadow-2xl backdrop-blur md:left-5 md:top-5 md:w-56">
              <div className="flex items-center justify-between bg-gradient-to-r from-[#e10600] to-[#7928CA] px-3 py-1 text-[9px] font-bold uppercase tracking-widest">
                <span>Lap 3 / 3</span>
                <span className="animate-pulse">● Live</span>
              </div>
              {rows.map((k, i) => {
                const L = LIVERIES[k];
                return (
                  <motion.div layout key={k} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="flex items-center gap-2 border-t border-white/5 px-3 py-1.5">
                    <span className="w-5 font-bold text-white/60">P{i + 1}</span>
                    <span className="h-3.5 w-1 rounded-full" style={{ background: L.accent }} />
                    <span className="flex-1 font-bold">
                      {k === "bull" ? "SAI" : "BYK"} {L.number}
                    </span>
                    <span className="text-white/70">{i === 0 ? "LEADER" : `+${hud.gap.toFixed(3)}`}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* steering-wheel HUD */}
            <div className="absolute bottom-2 right-2 z-10 origin-bottom-right scale-[0.8] rounded-xl border border-white/10 bg-black/70 px-3 py-2 font-mono text-white shadow-2xl backdrop-blur sm:scale-100 md:bottom-5 md:right-5">
              <div className="mb-1.5 hidden gap-[3px] sm:flex">
                {Array.from({ length: 15 }).map((_, i) => (
                  <span
                    key={i}
                    className="block h-1.5 w-2 rounded-sm"
                    style={{ background: i < revLeds ? (i < 5 ? "#22c55e" : i < 10 ? "#ef4444" : "#3b82f6") : "#27272a" }}
                  />
                ))}
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <div className="text-2xl font-bold tabular-nums leading-none">{hud.kmh}</div>
                  <div className="text-[8px] uppercase tracking-widest text-white/50">km/h</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold leading-none text-amber-300">{hud.gear}</div>
                  <div className="text-[8px] uppercase tracking-widest text-white/50">gear</div>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${hud.kmh > 280 ? "bg-emerald-500 text-black" : "bg-zinc-800 text-white/40"}`}>DRS</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-2 max-w-6xl font-mono text-[11px] uppercase tracking-widest text-white/40">Scroll faster to push the throttle ↓</p>
      </div>
    </section>
  );
}
