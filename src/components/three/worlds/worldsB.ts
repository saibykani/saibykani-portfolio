import * as THREE from "three";
import { canvasTex, Ctx, Fader, glowTex, particles, rand, stars, World } from "./common";

/* ======================= RAINFOREST ======================= */
export function jungle(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), f.mat(new THREE.MeshStandardMaterial({ color: "#14401e", roughness: 1 })));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2;
  group.add(ground);

  // trees: trunks + layered canopies
  const T = ctx.lite ? 40 : 80;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.42, 16, 7).translate(0, 8, 0), f.mat(new THREE.MeshStandardMaterial({ color: "#3b2414", roughness: 0.95 })), T);
  const canopy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.4, 1), f.mat(new THREE.MeshStandardMaterial({ color: "#166534", flatShading: true, roughness: 0.8 })), T * 3);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  let k = 0;
  for (let i = 0; i < T; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * rand(3, 30),
      z = rand(-70, 2),
      s = rand(0.8, 1.4);
    m4.compose(new THREE.Vector3(x, -2, z), q, new THREE.Vector3(s, s * rand(0.8, 1.2), s));
    trunks.setMatrixAt(i, m4);
    for (let c = 0; c < 3; c++) {
      m4.compose(new THREE.Vector3(x + rand(-1.8, 1.8), -2 + 14 * s + rand(-1.5, 1.5), z + rand(-1.8, 1.8)), q, new THREE.Vector3(1, 1, 1).multiplyScalar(s * rand(0.8, 1.4)));
      canopy.setMatrixAt(k, m4);
      canopy.setColorAt(k, col.set(["#15803d", "#16a34a", "#22c55e", "#166534"][Math.floor(Math.random() * 4)]));
      k++;
    }
  }
  group.add(trunks, canopy);

  // foreground monstera leaves framing the view
  const leafTex = canvasTex(256, 256, (g) => {
    g.translate(128, 128);
    g.fillStyle = "#0f3d1f";
    g.beginPath();
    g.ellipse(0, 0, 118, 92, 0, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = "destination-out";
    for (let i = -4; i <= 4; i++) {
      if (i === 0) continue;
      g.save();
      g.rotate(i * 0.32 + (i > 0 ? 0 : Math.PI));
      g.fillRect(40, -5, 90, 10);
      g.beginPath();
      g.arc(34, 0, 7, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.globalCompositeOperation = "source-over";
    g.strokeStyle = "#1f6b37";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(-118, 0);
    g.lineTo(118, 0);
    g.stroke();
  });
  const leaves: { s: THREE.Sprite; ph: number; base: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: leafTex, color: "#ffffff", depthWrite: false, fog: false })));
    const side = i % 2 ? 1 : -1;
    s.position.set(side * rand(4.5, 7.5), rand(-2.5, 6), rand(2, 5));
    s.scale.setScalar(rand(3, 5));
    const base = rand(-0.8, 0.8) + (side > 0 ? Math.PI : 0);
    s.material.rotation = base;
    leaves.push({ s, ph: rand(0, 6), base });
    group.add(s);
  }

  // hanging vines
  const vines: { line: THREE.Line; x: number; z: number; len: number; ph: number }[] = [];
  for (let i = 0; i < (ctx.lite ? 12 : 26); i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(20 * 3), 3));
    const line = new THREE.Line(g, f.mat(new THREE.LineBasicMaterial({ color: "#3f7d3a" })));
    line.frustumCulled = false;
    vines.push({ line, x: rand(-14, 14), z: rand(-22, 0), len: rand(4, 10), ph: rand(0, 6) });
    group.add(line);
  }

  // light shafts
  const shaftTex = canvasTex(64, 256, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, "rgba(255,245,180,0.9)");
    grd.addColorStop(1, "rgba(255,245,180,0)");
    g.fillStyle = grd;
    g.fillRect(16, 0, 32, 256);
  });
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 26), f.mat(new THREE.MeshBasicMaterial({ map: shaftTex, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0.28));
    s.position.set(rand(-12, 12), 8, rand(-30, -8));
    s.rotation.z = rand(0.2, 0.45);
    group.add(s);
  }

  // fireflies
  const ff = particles(
    f,
    ctx.lite ? 120 : 300,
    (i, a) => a.set([rand(-18, 18), rand(-1.8, 7), rand(-25, 5)], i * 3),
    new THREE.PointsMaterial({ size: 0.22, map: glowTex(), color: "#d9f99d", blending: THREE.AdditiveBlending, depthWrite: false })
  );
  const ffBase = ff.pos.slice();
  group.add(ff.pts);

  // blue morpho butterflies
  const flies: { g: THREE.Group; l: THREE.Mesh; r: THREE.Mesh; ph: number; c: THREE.Vector3; rad: number }[] = [];
  const wingTex = canvasTex(64, 64, (g) => {
    const grd = g.createRadialGradient(20, 32, 2, 32, 32, 32);
    grd.addColorStop(0, "#7dd3fc");
    grd.addColorStop(0.6, "#2563eb");
    grd.addColorStop(1, "#0b1020");
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(32, 32, 30, 22, 0.3, 0, Math.PI * 2);
    g.fill();
  });
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group();
    const wm = f.mat(new THREE.MeshBasicMaterial({ map: wingTex, side: THREE.DoubleSide, depthWrite: false }));
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.3).translate(-0.18, 0, 0), wm);
    const r = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.3).translate(0.18, 0, 0), wm);
    g.add(l, r);
    flies.push({ g, l, r, ph: rand(0, 6), c: new THREE.Vector3(rand(-8, 8), rand(0, 4), rand(-10, 0)), rad: rand(1.5, 4) });
    group.add(g);
  }

  // falling leaves
  const fallN = ctx.lite ? 30 : 70;
  const fall = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.28, 0.18), f.mat(new THREE.MeshStandardMaterial({ color: "#65a30d", side: THREE.DoubleSide })), fallN);
  const fallD = Array.from({ length: fallN }, () => ({ p: new THREE.Vector3(rand(-15, 15), rand(-2, 12), rand(-15, 5)), r: rand(0, 6), s: rand(0.5, 1.2) }));
  group.add(fall);

  group.add(f.light(new THREE.HemisphereLight("#d9f99d", "#14532d", 1.8)));
  const sun = f.light(new THREE.DirectionalLight("#fff1b8", 3));
  sun.position.set(6, 20, -4);
  group.add(sun);

  const e = new THREE.Euler();
  return {
    group,
    fade: f,
    bg: new THREE.Color("#07230f"),
    fog: new THREE.Color("#1a4a26"),
    fogDensity: 0.032,
    update: (t, dt) => {
      leaves.forEach((l) => (l.s.material.rotation = l.base + Math.sin(t * 0.8 + l.ph) * 0.06));
      for (const v of vines) {
        const a = v.line.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < 20; i++) {
          const u = i / 19;
          a[i * 3] = v.x + Math.sin(t * 0.7 + v.ph) * u * u * 0.8;
          a[i * 3 + 1] = 12 - u * v.len;
          a[i * 3 + 2] = v.z + Math.cos(t * 0.5 + v.ph) * u * 0.3;
        }
        v.line.geometry.attributes.position.needsUpdate = true;
      }
      for (let i = 0; i < ff.pos.length; i += 3) {
        ff.pos[i] = ffBase[i] + Math.sin(t * 0.6 + i) * 0.6;
        ff.pos[i + 1] = ffBase[i + 1] + Math.sin(t * 0.8 + i * 1.3) * 0.4;
      }
      ff.flush();
      (ff.pts.material as THREE.PointsMaterial).size = 0.18 + Math.sin(t * 3) * 0.05;
      for (const b of flies) {
        const a = t * 0.5 + b.ph;
        b.g.position.set(b.c.x + Math.cos(a) * b.rad, b.c.y + Math.sin(a * 2) * 0.6, b.c.z + Math.sin(a) * b.rad);
        b.g.rotation.y = -a;
        const flap = Math.sin(t * 16 + b.ph) * 1.1;
        b.l.rotation.y = flap;
        b.r.rotation.y = -flap;
      }
      fallD.forEach((d, i) => {
        d.p.y -= dt * d.s;
        d.p.x += Math.sin(t + i) * dt * 0.4;
        d.r += dt * 2;
        if (d.p.y < -2) d.p.y = 12;
        e.set(d.r, d.r * 0.7, d.r * 0.3);
        q.setFromEuler(e);
        m4.compose(d.p, q, new THREE.Vector3(1, 1, 1));
        fall.setMatrixAt(i, m4);
      });
      fall.instanceMatrix.needsUpdate = true;
    },
  };
}

/* ======================= SAKURA DUSK ======================= */
export function sakura(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  group.add(stars(f, 500, 90, 0.6, "#ffe4f1"));

  const moon = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffe9f3", depthWrite: false, fog: false })));
  moon.position.set(10, 12, -60);
  moon.scale.setScalar(14);
  group.add(moon);

  // Mt. Fuji with a snow cap
  const fuji = new THREE.ConeGeometry(26, 18, 64, 8, true);
  const fp = fuji.attributes.position as THREE.BufferAttribute;
  const fc = new Float32Array(fp.count * 3);
  for (let i = 0; i < fp.count; i++) {
    const y = fp.getY(i);
    const snow = THREE.MathUtils.smoothstep(y + Math.sin(fp.getX(i) * 1.3) * 0.6, 3, 5.5);
    const c = new THREE.Color("#2a1540").lerp(new THREE.Color("#fdf2f8"), snow);
    fc.set([c.r, c.g, c.b], i * 3);
  }
  fuji.setAttribute("color", new THREE.BufferAttribute(fc, 3));
  const mtn = new THREE.Mesh(fuji, f.mat(new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 })));
  mtn.position.set(-6, 7, -70);
  group.add(mtn);

  // still water with glow
  const water = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), f.mat(new THREE.MeshStandardMaterial({ color: "#2a0f33", metalness: 0.9, roughness: 0.2 })));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -2;
  group.add(water);

  // torii gate
  const torii = new THREE.Group();
  const red = f.mat(new THREE.MeshStandardMaterial({ color: "#dc2626", emissive: "#7f1d1d", emissiveIntensity: 0.6, roughness: 0.5 }));
  const black = f.mat(new THREE.MeshStandardMaterial({ color: "#111" }));
  for (const x of [-2.1, 2.1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 6, 12), red);
    p.position.set(x, 1, 0);
    torii.add(p);
  }
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.35, 0.6), black);
  kasagi.position.y = 4.25;
  const shimaki = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 0.5), red);
  shimaki.position.y = 3.9;
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 0.3), red);
  nuki.position.y = 3.0;
  torii.add(kasagi, shimaki, nuki);
  torii.position.set(-5.5, -2, -9);
  torii.rotation.y = 0.35;
  group.add(torii);

  // cherry trees
  const blossom = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.4, 1), f.mat(new THREE.MeshStandardMaterial({ color: "#f9a8d4", emissive: "#be185d", emissiveIntensity: 0.25, flatShading: true })), 60);
  const trunkMat = f.mat(new THREE.MeshStandardMaterial({ color: "#2b1a14" }));
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  let b = 0;
  [
    [7, -12],
    [11, -20],
    [-12, -18],
    [15, -8],
  ].forEach(([x, z]) => {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 7, 7).translate(0, 3.5, 0), trunkMat);
    tr.position.set(x, -2, z);
    tr.rotation.z = rand(-0.15, 0.15);
    group.add(tr);
    for (let i = 0; i < 15; i++) {
      m4.compose(new THREE.Vector3(x + rand(-2.6, 2.6), 4.5 + rand(-1, 1.6), z + rand(-2.6, 2.6)), q, new THREE.Vector3(1, 1, 1).multiplyScalar(rand(0.6, 1.2)));
      blossom.setMatrixAt(b++, m4);
    }
  });
  group.add(blossom);

  // floating lanterns
  const lanterns: { g: THREE.Group; v: number; ph: number }[] = [];
  const lMat = f.mat(new THREE.MeshStandardMaterial({ color: "#fdba74", emissive: "#f97316", emissiveIntensity: 1.6 }));
  for (let i = 0; i < (ctx.lite ? 12 : 26); i++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.42, 10), lMat));
    const gl = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#fb923c", blending: THREE.AdditiveBlending, depthWrite: false }), 0.7));
    gl.scale.setScalar(1.8);
    g.add(gl);
    g.position.set(rand(-16, 16), rand(-2, 14), rand(-30, 0));
    lanterns.push({ g, v: rand(0.25, 0.6), ph: rand(0, 6) });
    group.add(g);
  }

  // petals
  const petalN = ctx.lite ? 160 : 380;
  const petals = new THREE.InstancedMesh(new THREE.CircleGeometry(0.07, 5).scale(1, 0.6, 1), f.mat(new THREE.MeshBasicMaterial({ color: "#fbcfe8", side: THREE.DoubleSide, depthWrite: false })), petalN);
  const pd = Array.from({ length: petalN }, () => ({ p: new THREE.Vector3(rand(-18, 18), rand(-2, 12), rand(-20, 6)), r: rand(0, 6), s: rand(0.4, 1) }));
  group.add(petals);

  group.add(f.light(new THREE.HemisphereLight("#f9a8d4", "#1e0b2b", 1.0)));
  const warm = f.light(new THREE.PointLight("#fb923c", 40, 40, 1.5));
  warm.position.set(0, 3, -6);
  const moonL = f.light(new THREE.DirectionalLight("#ffd6ec", 1.2));
  moonL.position.set(10, 12, -20);
  group.add(warm, moonL);

  const e = new THREE.Euler();
  return {
    group,
    fade: f,
    bg: new THREE.Color("#180a22"),
    fog: new THREE.Color("#3b1640"),
    fogDensity: 0.022,
    update: (t, dt) => {
      for (const l of lanterns) {
        l.g.position.y += dt * l.v;
        l.g.position.x += Math.sin(t * 0.4 + l.ph) * dt * 0.2;
        if (l.g.position.y > 16) l.g.position.y = -2;
      }
      pd.forEach((d, i) => {
        d.p.y -= dt * d.s;
        d.p.x += (Math.sin(t * 0.8 + i) * 0.6 + 0.4) * dt;
        d.r += dt * 2.5;
        if (d.p.y < -2) {
          d.p.y = 12;
          d.p.x = rand(-18, 18);
        }
        e.set(d.r, d.r * 0.6, d.r * 0.2);
        q.setFromEuler(e);
        m4.compose(d.p, q, new THREE.Vector3(1, 1, 1));
        petals.setMatrixAt(i, m4);
      });
      petals.instanceMatrix.needsUpdate = true;
      warm.intensity = 40 * f.value * (0.85 + Math.sin(t * 5) * 0.08);
    },
  };
}

/* ======================= CRYSTAL CAVE ======================= */
export function crystal(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const N = ctx.lite ? 40 : 80;
  const cMat = f.mat(new THREE.MeshPhysicalMaterial({ color: "#ffffff", emissive: "#3b0764", emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.08, clearcoat: 1, flatShading: true }));
  const cryst = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), cMat, N);
  const cd = Array.from({ length: N }, () => ({
    p: new THREE.Vector3(rand(-16, 16), rand(-1, 9), rand(-26, -2)),
    s: new THREE.Vector3(rand(0.25, 0.6), rand(0.8, 2.2), rand(0.25, 0.6)),
    r: new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6)),
    sp: rand(0.2, 0.7),
    ph: rand(0, 6),
  }));
  const col = new THREE.Color();
  cd.forEach((_, i) => cryst.setColorAt(i, col.set(["#a78bfa", "#22d3ee", "#f472b6", "#818cf8"][i % 4])));
  group.add(cryst);

  // stalagmite clusters on the floor
  const stal = new THREE.InstancedMesh(new THREE.ConeGeometry(0.6, 1, 6).translate(0, 0.5, 0), cMat, 50);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let i = 0; i < 50; i++) {
    const side = i % 2 ? 1 : -1;
    q.setFromEuler(new THREE.Euler(rand(-0.3, 0.3), 0, rand(-0.3, 0.3)));
    m4.compose(new THREE.Vector3(side * rand(3, 20), -2, rand(-30, 0)), q, new THREE.Vector3(1, rand(2, 7), 1).multiplyScalar(rand(0.6, 1.3)));
    stal.setMatrixAt(i, m4);
    stal.setColorAt(i, col.set(["#7c3aed", "#0891b2", "#db2777"][i % 3]));
  }
  group.add(stal);

  // energy core
  const core = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), f.mat(new THREE.MeshBasicMaterial({ color: "#c4b5fd", wireframe: true })));
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 2), f.mat(new THREE.MeshStandardMaterial({ color: "#f0abfc", emissive: "#a855f7", emissiveIntensity: 2 })));
  const halo = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#a855f7", blending: THREE.AdditiveBlending, depthWrite: false })));
  halo.scale.setScalar(9);
  core.add(shell, inner, halo);
  const rings = [0, 1, 2].map((i) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(2.4 + i * 0.6, 0.02, 8, 96), f.mat(new THREE.MeshBasicMaterial({ color: ["#22d3ee", "#f472b6", "#a78bfa"][i], blending: THREE.AdditiveBlending, depthWrite: false })));
    core.add(r);
    return r;
  });
  core.position.set(0, 3.5, -14);
  group.add(core);

  const dust = particles(
    f,
    ctx.lite ? 200 : 500,
    (i, a) => a.set([rand(-20, 20), rand(-2, 12), rand(-30, 6)], i * 3),
    new THREE.PointsMaterial({ size: 0.08, map: glowTex(), color: "#e9d5ff", blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(dust.pts);

  group.add(f.light(new THREE.HemisphereLight("#8b5cf6", "#05010f", 0.6)));
  const lights = ["#a855f7", "#22d3ee", "#f472b6"].map((c) => {
    const l = f.light(new THREE.PointLight(c, 120, 40, 1.4));
    group.add(l);
    return l;
  });

  const v = new THREE.Vector3();
  return {
    group,
    fade: f,
    bg: new THREE.Color("#07021a"),
    fog: new THREE.Color("#14062e"),
    fogDensity: 0.035,
    update: (t) => {
      cd.forEach((c, i) => {
        c.r.x += 0.003 * c.sp;
        c.r.y += 0.006 * c.sp;
        q.setFromEuler(c.r);
        m4.compose(v.copy(c.p).setY(c.p.y + Math.sin(t * c.sp + c.ph) * 0.5), q, c.s);
        cryst.setMatrixAt(i, m4);
      });
      cryst.instanceMatrix.needsUpdate = true;
      shell.rotation.set(t * 0.2, t * 0.3, 0);
      inner.scale.setScalar(1 + Math.sin(t * 2.5) * 0.08);
      rings.forEach((r, i) => r.rotation.set(t * (0.3 + i * 0.15), t * (0.2 + i * 0.1), i));
      lights.forEach((l, i) => {
        const a = t * 0.4 + (i * Math.PI * 2) / 3;
        l.position.set(Math.cos(a) * 9, 4 + Math.sin(t + i) * 2, -14 + Math.sin(a) * 9);
      });
      dust.pts.rotation.y = t * 0.02;
    },
  };
}
