import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { canvasTex, Ctx, Fader, fbm2, glowTex, gridFloor, particles, rand, stars, World } from "./common";

/* Camera for every world sits near (0, 0.6, 9) looking toward (0, 0.3, -6); ground is y = -2. */

/* ======================= NORTHERN LIGHTS ======================= */
export function aurora(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  group.add(stars(f, ctx.lite ? 700 : 1500, 90, 0.7));

  // snowy ridged mountains
  const geo = new THREE.PlaneGeometry(120, 34, ctx.lite ? 90 : 160, 50);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i);
    const back = THREE.MathUtils.clamp((-z + 17) / 34, 0, 1);
    const ridge = 1 - Math.abs(fbm2(x * 0.05 + 3, z * 0.05) * 2 - 1);
    const h = Math.pow(ridge, 2.4) * 16 * (0.25 + back) - 1;
    p.setY(i, h);
    const snow = THREE.MathUtils.smoothstep(h, 3, 7);
    const c = new THREE.Color("#18233f").lerp(new THREE.Color("#e8f1ff"), snow);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mtn = new THREE.Mesh(geo, f.mat(new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 })));
  mtn.position.set(0, -2, -38);
  group.add(mtn);

  // frozen lake
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), f.mat(new THREE.MeshStandardMaterial({ color: "#07142e", metalness: 0.9, roughness: 0.18 }), 0.95));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(0, -1.99, -10);
  group.add(lake);

  // aurora curtains
  const ribbons: THREE.ShaderMaterial[] = [];
  const uFade = f.uniform({ value: 0 });
  [
    [-26, 7, 0.0, "#34d399", "#8b5cf6"],
    [-32, 10, 1.7, "#22d3ee", "#a78bfa"],
    [-40, 13, 3.1, "#4ade80", "#ec4899"],
  ].forEach(([z, y, off, c1, c2]) => {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uFade, uOff: { value: off }, c1: { value: new THREE.Color(c1 as string) }, c2: { value: new THREE.Color(c2 as string) } },
      vertexShader: `uniform float uTime, uOff; varying vec2 vUv;
        void main(){ vUv = uv; vec3 p = position;
          p.z += sin(p.x * 0.12 + uTime * 0.25 + uOff) * 4.0 + sin(p.x * 0.31 - uTime * 0.4) * 1.2;
          p.y += sin(p.x * 0.07 + uTime * 0.15 + uOff) * 1.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform float uTime, uFade, uOff; uniform vec3 c1, c2; varying vec2 vUv;
        void main(){ float s = 0.5 + 0.5 * sin(vUv.x * 90.0 + uTime * 1.2 + sin(vUv.x * 17.0 + uOff) * 4.0);
          float band = smoothstep(0.0, 0.12, vUv.y) * pow(1.0 - vUv.y, 1.6);
          float wave = 0.6 + 0.4 * sin(vUv.x * 6.0 - uTime * 0.5 + uOff);
          vec3 col = mix(c1, c2, pow(vUv.y, 0.8));
          gl_FragColor = vec4(col, band * (0.35 + 0.65 * s) * wave * 0.75 * uFade); }`,
    });
    ribbons.push(m);
    const r = new THREE.Mesh(new THREE.PlaneGeometry(110, 12, 240, 1), m);
    r.position.set(0, y as number, z as number);
    group.add(r);
  });

  // snowfall
  const snow = particles(
    f,
    ctx.lite ? 250 : 600,
    (i, a) => a.set([rand(-25, 25), rand(-2, 14), rand(-20, 8)], i * 3),
    new THREE.PointsMaterial({ size: 0.09, map: glowTex(), color: "#ffffff", depthWrite: false })
  );
  group.add(snow.pts);

  group.add(f.light(new THREE.HemisphereLight("#7d95ff", "#050a1a", 0.8)));
  const moon = f.light(new THREE.DirectionalLight("#cfe0ff", 1.6));
  moon.position.set(-10, 12, 5);
  group.add(moon);
  const green = f.light(new THREE.PointLight("#34d399", 60, 80, 1.5));
  green.position.set(0, 10, -28);
  group.add(green);

  return {
    group,
    fade: f,
    bg: new THREE.Color("#020714"),
    fog: new THREE.Color("#06122b"),
    fogDensity: 0.012,
    update: (t, dt) => {
      for (const r of ribbons) r.uniforms.uTime.value = t;
      green.intensity = 60 * f.value * (0.7 + 0.3 * Math.sin(t * 0.8));
      for (let i = 0; i < snow.pos.length; i += 3) {
        snow.pos[i + 1] -= dt * 0.8;
        snow.pos[i] += Math.sin(t + i) * dt * 0.2;
        if (snow.pos[i + 1] < -2) snow.pos[i + 1] = 14;
      }
      snow.flush();
    },
  };
}

/* ======================= NEON CITY ======================= */
export function cyber(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const grid = gridFloor(f, "#22d3ee", "#ec4899", 260, 0.8);
  grid.mesh.position.y = -1.99;
  group.add(grid.mesh);

  // skyscrapers with lit windows
  const winTex = canvasTex(128, 256, (g) => {
    g.fillStyle = "#05060d";
    g.fillRect(0, 0, 128, 256);
    for (let y = 4; y < 256; y += 10)
      for (let x = 4; x < 128; x += 10) {
        if (Math.random() < 0.45) continue;
        g.fillStyle = ["#fde68a", "#67e8f9", "#f0abfc", "#ffffff"][Math.floor(Math.random() * 4)];
        g.globalAlpha = rand(0.35, 1);
        g.fillRect(x, y, 5, 6);
      }
  });
  const N = ctx.lite ? 70 : 150;
  const bMat = f.mat(new THREE.MeshStandardMaterial({ color: "#0b0d18", emissive: "#ffffff", emissiveMap: winTex, emissiveIntensity: 1.3, map: winTex, metalness: 0.4, roughness: 0.5 }));
  const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bMat, N);
  const bData: { x: number; z: number; w: number; h: number; d: number }[] = [];
  const m4 = new THREE.Matrix4();
  const place = (i: number, z?: number) => {
    const side = i % 2 ? 1 : -1;
    const d = { x: side * rand(4.5, 34), z: z ?? rand(-140, 5), w: rand(1.6, 3.6), h: rand(4, 26), d: rand(1.6, 3.6) };
    bData[i] = d;
  };
  for (let i = 0; i < N; i++) place(i);
  group.add(buildings);

  // neon signs with QA vocabulary
  const signs: THREE.Mesh[] = [];
  ["200 OK", "PASS", "API", "QA", "CI/CD", "BUILD ✓", "SDET", "JMETER"].forEach((w, i) => {
    const color = ["#22d3ee", "#ec4899", "#a3e635", "#f59e0b"][i % 4];
    const tex = canvasTex(256, 96, (g) => {
      g.fillStyle = "rgba(0,0,0,0)";
      g.fillRect(0, 0, 256, 96);
      g.font = "bold 58px 'Arial Black', Arial";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.shadowColor = color;
      g.shadowBlur = 22;
      g.fillStyle = color;
      g.fillText(w, 128, 50);
      g.strokeStyle = color;
      g.lineWidth = 4;
      g.strokeRect(6, 6, 244, 84);
    });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.5), f.mat(new THREE.MeshBasicMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
    const side = i % 2 ? 1 : -1;
    s.position.set(side * rand(4, 9), rand(3, 9), -10 - i * 14);
    s.rotation.y = -side * 0.6;
    signs.push(s);
    group.add(s);
  });

  // flying traffic
  const cars: { s: THREE.Sprite; v: number; y: number; z: number }[] = [];
  for (let i = 0; i < (ctx.lite ? 14 : 30); i++) {
    const c = ["#f472b6", "#22d3ee", "#fde047", "#ffffff"][i % 4];
    const s = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: c, blending: THREE.AdditiveBlending, depthWrite: false })));
    s.scale.set(1.6, 0.35, 1);
    const car = { s, v: rand(6, 16) * (i % 2 ? 1 : -1), y: rand(2, 12), z: rand(-90, -4) };
    s.position.set(rand(-40, 40), car.y, car.z);
    cars.push(car);
    group.add(s);
  }

  // rain
  const rainN = ctx.lite ? 300 : 700;
  const rainPos = new Float32Array(rainN * 6);
  for (let i = 0; i < rainN; i++) {
    const x = rand(-30, 30),
      y = rand(-2, 20),
      z = rand(-40, 8);
    rainPos.set([x, y, z, x - 0.05, y - 0.6, z], i * 6);
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rg, f.mat(new THREE.LineBasicMaterial({ color: "#7dd3fc", depthWrite: false }), 0.35));
  rain.frustumCulled = false;
  group.add(rain);

  group.add(f.light(new THREE.HemisphereLight("#6d28d9", "#020617", 0.9)));
  const pink = f.light(new THREE.PointLight("#ec4899", 90, 60, 1.4));
  pink.position.set(-6, 6, -12);
  const cyan = f.light(new THREE.PointLight("#22d3ee", 90, 60, 1.4));
  cyan.position.set(6, 5, -20);
  group.add(pink, cyan);

  return {
    group,
    fade: f,
    bg: new THREE.Color("#07010f"),
    fog: new THREE.Color("#1a0630"),
    fogDensity: 0.022,
    update: (t, dt) => {
      grid.mat.uniforms.uTime.value = t;
      for (let i = 0; i < N; i++) {
        const d = bData[i];
        d.z += dt * 6;
        if (d.z > 10) place(i, -140);
        m4.compose(new THREE.Vector3(d.x, -2 + d.h / 2, d.z), new THREE.Quaternion(), new THREE.Vector3(d.w, d.h, d.d));
        buildings.setMatrixAt(i, m4);
      }
      buildings.instanceMatrix.needsUpdate = true;
      for (const c of cars) {
        c.s.position.x += c.v * dt;
        if (c.s.position.x > 45) c.s.position.x = -45;
        if (c.s.position.x < -45) c.s.position.x = 45;
      }
      signs.forEach((s, i) => ((s.material as THREE.MeshBasicMaterial).opacity = f.value * (Math.sin(t * 7 + i * 3) > -0.92 ? 1 : 0.2)));
      for (let i = 0; i < rainN; i++) {
        const o = i * 6;
        rainPos[o + 1] -= dt * 22;
        rainPos[o + 4] -= dt * 22;
        if (rainPos[o + 1] < -2) {
          rainPos[o + 1] = 20;
          rainPos[o + 4] = 19.4;
        }
      }
      rg.attributes.position.needsUpdate = true;
    },
  };
}

/* ======================= DEEP OCEAN ======================= */
export function ocean(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const uFade = f.uniform({ value: 0 });

  // seafloor with animated caustics
  const floorMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uFade },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uTime, uFade; varying vec3 vW;
      void main(){ vec2 p = mod(vW.xz * 0.35, 6.28318) - 250.0; vec2 i = p; float c = 1.0; float inten = 0.005;
        for (int n = 0; n < 4; n++) { float t = uTime * 0.35 * (1.0 - (3.5 / float(n + 1)));
          i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten))); }
        c /= 4.0; c = 1.17 - pow(c, 1.4); float caus = pow(abs(c), 8.0);
        float dist = length(vW.xz);
        vec3 col = vec3(0.04, 0.2, 0.28) + vec3(0.35, 0.85, 0.9) * clamp(caus, 0.0, 1.0) * 0.5;
        gl_FragColor = vec4(col * exp(-dist * 0.02), uFade); }`,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.5;
  group.add(floor);

  // sun rays from the surface
  const rayTex = canvasTex(64, 256, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, "rgba(180,240,255,0.8)");
    grd.addColorStop(1, "rgba(180,240,255,0)");
    g.fillStyle = grd;
    const h = g.createLinearGradient(0, 0, 64, 0);
    g.fillRect(0, 0, 64, 256);
    g.globalCompositeOperation = "destination-in";
    h.addColorStop(0, "rgba(0,0,0,0)");
    h.addColorStop(0.5, "rgba(0,0,0,1)");
    h.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = h;
    g.fillRect(0, 0, 64, 256);
  });
  const rays: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(rand(2, 5), 30), f.mat(new THREE.MeshBasicMaterial({ map: rayTex, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), rand(0.2, 0.45)));
    r.position.set(rand(-18, 18), 9, rand(-30, -6));
    r.rotation.z = rand(-0.35, 0.35);
    rays.push(r);
    group.add(r);
  }

  // bubbles
  const bub = particles(
    f,
    ctx.lite ? 180 : 450,
    (i, a) => a.set([rand(-20, 20), rand(-2.5, 12), rand(-25, 6)], i * 3),
    new THREE.PointsMaterial({ size: 0.12, map: glowTex(), color: "#cffafe", depthWrite: false, blending: THREE.AdditiveBlending })
  );
  group.add(bub.pts);

  // fish schools
  const fishGeo = mergeGeometries([
    new THREE.SphereGeometry(0.16, 10, 8).scale(2.2, 0.9, 0.6),
    new THREE.ConeGeometry(0.14, 0.3, 4).rotateZ(Math.PI / 2).translate(-0.45, 0, 0).scale(1, 1, 0.3),
  ]);
  const schools = [
    { c: new THREE.Vector3(-4, 1.5, -8), r: 5, sp: 0.35, color: "#fb923c", n: 36 },
    { c: new THREE.Vector3(5, 3, -14), r: 7, sp: -0.25, color: "#22d3ee", n: 40 },
    { c: new THREE.Vector3(0, 5.5, -22), r: 9, sp: 0.2, color: "#fde047", n: ctx.lite ? 20 : 44 },
  ];
  const fishMeshes = schools.map((s) => {
    const m = new THREE.InstancedMesh(fishGeo, f.mat(new THREE.MeshStandardMaterial({ color: s.color, emissive: s.color, emissiveIntensity: 0.25, metalness: 0.5, roughness: 0.35 })), s.n);
    const offs = Array.from({ length: s.n }, () => new THREE.Vector3(rand(-1.4, 1.4), rand(-0.8, 0.8), rand(-1.4, 1.4)));
    group.add(m);
    return { m, s, offs };
  });

  // a whale gliding in the distance
  const whale = new THREE.Group();
  const wMat = f.mat(new THREE.MeshStandardMaterial({ color: "#1e3a5f", roughness: 0.6, metalness: 0.1 }));
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 5, 8, 16), wMat);
  body.rotation.z = Math.PI / 2;
  body.scale.set(1, 1, 0.8);
  whale.add(body);
  const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 3.2), wMat);
  fluke.position.x = -3.9;
  whale.add(fluke);
  for (const z of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.6), wMat);
    fin.position.set(0.8, -0.6, z * 1.1);
    fin.rotation.x = z * 0.5;
    whale.add(fin);
  }
  whale.position.set(-40, 7, -34);
  group.add(whale);

  // jellyfish
  const jellies: { g: THREE.Group; ph: number; tent: THREE.LineSegments; base: THREE.Vector3 }[] = [];
  for (let j = 0; j < (ctx.lite ? 4 : 7); j++) {
    const g = new THREE.Group();
    const col = ["#f472b6", "#a78bfa", "#67e8f9"][j % 3];
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      f.mat(new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9, side: THREE.DoubleSide, depthWrite: false }), 0.55)
    );
    g.add(dome);
    const halo = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: col, blending: THREE.AdditiveBlending, depthWrite: false }), 0.5));
    halo.scale.setScalar(2.4);
    g.add(halo);
    const segs = new Float32Array(10 * 12 * 6);
    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.BufferAttribute(segs, 3));
    const tent = new THREE.LineSegments(tg, f.mat(new THREE.LineBasicMaterial({ color: col, blending: THREE.AdditiveBlending, depthWrite: false }), 0.6));
    tent.frustumCulled = false;
    g.add(tent);
    const base = new THREE.Vector3(rand(-12, 12), rand(0, 7), rand(-20, -4));
    g.position.copy(base);
    jellies.push({ g, ph: rand(0, 6), tent, base });
    group.add(g);
  }

  // swaying seaweed
  const weedN = ctx.lite ? 40 : 90;
  const weedGeo = new THREE.BoxGeometry(0.1, 3, 0.02).translate(0, 1.5, 0);
  const weed = new THREE.InstancedMesh(weedGeo, f.mat(new THREE.MeshStandardMaterial({ color: "#15803d", emissive: "#052e16", roughness: 0.8 })), weedN);
  const weedData = Array.from({ length: weedN }, () => ({ x: rand(-22, 22), z: rand(-26, 2), h: rand(0.6, 1.8), ph: rand(0, 6) }));
  group.add(weed);

  group.add(f.light(new THREE.HemisphereLight("#67e8f9", "#001018", 1.0)));
  const sun = f.light(new THREE.DirectionalLight("#bff4ff", 1.4));
  sun.position.set(2, 20, 4);
  group.add(sun);

  const q = new THREE.Quaternion();
  const m4 = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  const v = new THREE.Vector3();
  const e = new THREE.Euler();
  return {
    group,
    fade: f,
    bg: new THREE.Color("#01162b"),
    fog: new THREE.Color("#04304f"),
    fogDensity: 0.04,
    update: (t, dt) => {
      floorMat.uniforms.uTime.value = t;
      rays.forEach((r, i) => (r.rotation.z += Math.sin(t * 0.3 + i) * 0.0008));
      for (let i = 0; i < bub.pos.length; i += 3) {
        bub.pos[i + 1] += dt * (0.8 + (i % 7) * 0.1);
        bub.pos[i] += Math.sin(t * 2 + i) * dt * 0.15;
        if (bub.pos[i + 1] > 12) bub.pos[i + 1] = -2.5;
      }
      bub.flush();
      for (const { m, s, offs } of fishMeshes) {
        const a = t * s.sp;
        const heading = s.sp > 0 ? a + Math.PI / 2 : a - Math.PI / 2;
        for (let i = 0; i < s.n; i++) {
          const o = offs[i];
          const ai = a + o.x * 0.12;
          v.set(s.c.x + Math.cos(ai) * (s.r + o.z), s.c.y + o.y + Math.sin(t * 1.3 + i) * 0.15, s.c.z + Math.sin(ai) * (s.r + o.z));
          e.set(0, -heading + Math.sin(t * 8 + i) * 0.15, 0);
          q.setFromEuler(e);
          m4.compose(v, q, new THREE.Vector3(1, 1, 1));
          m.setMatrixAt(i, m4);
        }
        m.instanceMatrix.needsUpdate = true;
      }
      whale.position.x += dt * 1.6;
      whale.position.y = 7 + Math.sin(t * 0.3) * 0.6;
      whale.rotation.z = Math.sin(t * 0.6) * 0.05;
      fluke.rotation.z = Math.sin(t * 1.2) * 0.35;
      if (whale.position.x > 45) whale.position.x = -45;
      for (const j of jellies) {
        const pulse = Math.sin(t * 1.8 + j.ph);
        j.g.position.y = j.base.y + Math.sin(t * 0.5 + j.ph) * 1.2 + (pulse > 0 ? pulse * 0.08 : 0);
        j.g.scale.set(1 + pulse * 0.08, 1 - pulse * 0.1, 1 + pulse * 0.08);
        const arr = j.tent.geometry.attributes.position.array as Float32Array;
        let k = 0;
        for (let tt = 0; tt < 10; tt++) {
          const ang = (tt / 10) * Math.PI * 2;
          for (let s = 0; s < 12; s++) {
            for (const ss of [s, s + 1]) {
              const y = -ss * 0.2;
              const sw = Math.sin(t * 2 + ss * 0.5 + tt + j.ph) * 0.08 * ss;
              arr[k++] = Math.cos(ang) * 0.4 + sw;
              arr[k++] = y;
              arr[k++] = Math.sin(ang) * 0.4 + sw * 0.5;
            }
          }
        }
        j.tent.geometry.attributes.position.needsUpdate = true;
      }
      weedData.forEach((w, i) => {
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(t * 1.2 + w.ph) * 0.25);
        m4.compose(v.set(w.x, -2.5, w.z), q, new THREE.Vector3(1, w.h, 1));
        weed.setMatrixAt(i, m4);
      });
      weed.instanceMatrix.needsUpdate = true;
      void up;
    },
  };
}
