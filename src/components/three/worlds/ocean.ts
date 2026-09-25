import * as THREE from "three";
import { bird, Ctx, Fader, glowTex, rand, skyDome, waterMaterial, waveHeight, World } from "./common";

function dolphinMesh(f: Fader) {
  const g = new THREE.Group();
  const skin = f.mat(new THREE.MeshPhysicalMaterial({ color: "#6b7f99", metalness: 0.1, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.2 }));
  const belly = f.mat(new THREE.MeshPhysicalMaterial({ color: "#dfe7ef", roughness: 0.3, clearcoat: 1 }));
  // streamlined body (nose along +z)
  const prof: [number, number][] = [
    [0, -1.3], [0.08, -1.2], [0.16, -0.95], [0.28, -0.45], [0.34, 0.0], [0.32, 0.35], [0.24, 0.7], [0.14, 0.95], [0.1, 1.05], [0.07, 1.25], [0.0, 1.35],
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 18).rotateX(Math.PI / 2), skin);
  body.scale.set(1, 0.9, 1);
  g.add(body);
  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8).scale(1, 0.6, 3.2), belly);
  bel.position.set(0, -0.14, 0.05);
  g.add(bel);
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 4).scale(0.35, 1, 1.6), skin);
  dorsal.position.set(0, 0.42, -0.1);
  dorsal.rotation.x = -0.5;
  g.add(dorsal);
  for (const s of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 0.16), skin);
    pec.position.set(s * 0.3, -0.15, 0.35);
    pec.rotation.set(0, s * 0.5, s * -0.5);
    g.add(pec);
  }
  const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.22), skin);
  fluke.position.z = -1.3;
  g.add(fluke);
  return { g, fluke };
}

function sailboat(f: Fader, sailColor: string) {
  const g = new THREE.Group();
  const hullM = f.mat(new THREE.MeshPhysicalMaterial({ color: "#f8fafc", roughness: 0.3, clearcoat: 1 }));
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.22, 3.6, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI), hullM);
  hull.scale.set(1, 0.7, 1);
  g.add(hull);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 3.4), f.mat(new THREE.MeshStandardMaterial({ color: "#a16207", roughness: 0.7 }))));
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 5, 6).translate(0, 2.5, 0), f.mat(new THREE.MeshStandardMaterial({ color: "#d4d4d8", metalness: 0.8 })));
  mast.position.z = 0.3;
  g.add(mast);
  const sailM = f.mat(new THREE.MeshStandardMaterial({ color: sailColor, side: THREE.DoubleSide, roughness: 0.8 }));
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.2);
  shape.lineTo(0, 4.8);
  shape.quadraticCurveTo(-0.9, 2.2, -1.9, 0.25);
  const main = new THREE.Mesh(new THREE.ShapeGeometry(shape), sailM);
  main.rotation.y = Math.PI / 2 - 0.25;
  main.position.z = 0.3;
  g.add(main);
  const jib = new THREE.Shape();
  jib.moveTo(0, 0.3);
  jib.lineTo(0, 4.2);
  jib.lineTo(1.5, 0.3);
  const j = new THREE.Mesh(new THREE.ShapeGeometry(jib), f.mat(new THREE.MeshStandardMaterial({ color: "#ffffff", side: THREE.DoubleSide })));
  j.rotation.y = Math.PI / 2 + 0.3;
  j.position.z = 0.35;
  g.add(j);
  return g;
}

function yacht(f: Fader) {
  const g = new THREE.Group();
  const white = f.mat(new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.2, clearcoat: 1 }));
  const dark = f.mat(new THREE.MeshPhysicalMaterial({ color: "#0f172a", metalness: 0.9, roughness: 0.05 }));
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.4, 7, 14, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI), white);
  hull.scale.set(1, 0.6, 1);
  g.add(hull);
  const deck1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 3.6).translate(0, 0.3, -0.4), white);
  const win1 = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.25, 3.2).translate(0, 0.35, -0.4), dark);
  const deck2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 2.2).translate(0, 0.85, -0.7), white);
  const win2 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.2, 1.9).translate(0, 0.9, -0.7), dark);
  g.add(deck1, win1, deck2, win2);
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 9).rotateX(-Math.PI / 2).translate(0, 0.05, -7.5), f.mat(new THREE.MeshBasicMaterial({ map: glowTex(), color: "#e0f2fe", blending: THREE.AdditiveBlending, depthWrite: false }), 0.4));
  g.add(wake);
  return g;
}

/* Open ocean at golden hour: GPU waves, sailboats, a yacht, a leaping dolphin pod, gulls. */
export function ocean(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const sunDir = new THREE.Vector3(0.25, 0.12, -1).normalize();
  group.add(skyDome(f, "#1b3a6b", "#e98a5b", "#ffc18a", sunDir, "#ffe3b0", 0.0018));

  const waterMat = waterMaterial(f, { deep: "#0b3c5d", shallow: "#1b7fa3", sky: "#f2b38a", sunDir, sun: "#ffe3b0" });
  const seg = ctx.lite ? 110 : 200;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(420, 420, seg, seg).rotateX(-Math.PI / 2), waterMat);
  group.add(water);

  // boats
  const boats = [
    { g: sailboat(f, "#fef3c7"), x: -14, z: -30, v: 1.2, h: 0.3 },
    { g: sailboat(f, "#fecaca"), x: 22, z: -55, v: 0.8, h: -0.4 },
    { g: sailboat(f, "#e0e7ff"), x: -40, z: -80, v: 0.9, h: 0.2 },
    { g: yacht(f), x: 10, z: -18, v: 3.2, h: 1.35 },
  ];
  boats.forEach((b) => group.add(b.g));

  // dolphin pod
  const pod = Array.from({ length: ctx.lite ? 3 : 5 }, (_, i) => {
    const d = dolphinMesh(f);
    group.add(d.g);
    return { ...d, off: new THREE.Vector3(i * 1.6 - 3, 0, rand(-1.5, 1.5)), ph: i * 0.55, speed: 5 };
  });
  const splashN = 240;
  const spPos = new Float32Array(splashN * 3).fill(-50);
  const spVel = Array.from({ length: splashN }, () => new THREE.Vector3());
  const spLife = new Float32Array(splashN);
  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
  const splash = new THREE.Points(spGeo, f.mat(new THREE.PointsMaterial({ map: glowTex(), color: "#ffffff", size: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })));
  splash.frustumCulled = false;
  group.add(splash);
  let spHead = 0;
  const burst = (p: THREE.Vector3) => {
    for (let i = 0; i < 26; i++) {
      const k = spHead++ % splashN;
      spPos.set([p.x, p.y, p.z], k * 3);
      spVel[k].set(rand(-2, 2), rand(2, 5), rand(-2, 2));
      spLife[k] = rand(0.6, 1.1);
    }
  };

  // gulls
  const gulls = Array.from({ length: 7 }, (_, i) => {
    const b = bird(f, "#f1f5f9", "#e2e8f0", 3);
    group.add(b.g);
    return { ...b, r: rand(10, 26), h: rand(9, 16), sp: rand(0.15, 0.3) * (i % 2 ? 1 : -1), ph: rand(0, 6), c: new THREE.Vector3(rand(-15, 15), 0, rand(-50, -20)) };
  });

  group.add(f.light(new THREE.HemisphereLight("#ffd7b0", "#0b3c5d", 1.2)));
  const sun = f.light(new THREE.DirectionalLight("#ffd9a8", 2.6));
  sun.position.copy(sunDir).multiplyScalar(100);
  group.add(sun);

  const tmp = new THREE.Vector3();
  const prevUp = new Map<number, boolean>();
  return {
    group,
    fade: f,
    bg: new THREE.Color("#f2b38a"),
    fog: new THREE.Color("#e9a883"),
    fogDensity: 0.0065,
    update: (t, dt) => {
      waterMat.uniforms.uTime.value = t;
      for (const b of boats) {
        b.z += b.v * dt * Math.cos(b.h);
        b.x += b.v * dt * Math.sin(b.h);
        if (b.x > 70) b.x = -70;
        if (b.x < -70) b.x = 70;
        if (b.z > 10) b.z = -110;
        const y = waveHeight(b.x, b.z, t);
        const pitch = (waveHeight(b.x, b.z + 1.5, t) - waveHeight(b.x, b.z - 1.5, t)) / 3;
        const roll = (waveHeight(b.x + 1, b.z, t) - waveHeight(b.x - 1, b.z, t)) / 2;
        b.g.position.set(b.x, y + 0.1, b.z);
        b.g.rotation.set(-pitch, b.h, roll);
      }
      // pod travels in a big loop; each dolphin arcs in and out of the water
      const a = t * 0.08;
      const center = tmp.set(Math.cos(a) * 20, 0, -35 + Math.sin(a) * 12);
      const heading = Math.atan2(-Math.sin(a) * 12 * 0.08, -Math.cos(a) * 20 * 0.08) + Math.PI / 2;
      pod.forEach((d, i) => {
        const cyc = t * 1.6 + d.ph;
        const s = Math.sin(cyc);
        const x = center.x + d.off.x * Math.cos(heading) + d.off.z * Math.sin(heading);
        const z = center.z - d.off.x * Math.sin(heading) + d.off.z * Math.cos(heading);
        const water0 = waveHeight(x, z, t);
        const y = water0 - 0.8 + Math.max(0, s) * 2.8;
        d.g.position.set(x, y, z);
        d.g.rotation.set(-Math.cos(cyc) * 0.9 * (s > -0.2 ? 1 : 0.2), heading, 0);
        d.fluke.rotation.x = Math.sin(t * 10 + i) * 0.4;
        const up = y > water0;
        if (prevUp.get(i) !== undefined && prevUp.get(i) !== up) burst(new THREE.Vector3(x, water0, z));
        prevUp.set(i, up);
      });
      for (let i = 0; i < splashN; i++) {
        if (spLife[i] <= 0) continue;
        spLife[i] -= dt;
        spVel[i].y -= 9.8 * dt;
        spPos[i * 3] += spVel[i].x * dt;
        spPos[i * 3 + 1] += spVel[i].y * dt;
        spPos[i * 3 + 2] += spVel[i].z * dt;
        if (spLife[i] <= 0) spPos[i * 3 + 1] = -50;
      }
      spGeo.attributes.position.needsUpdate = true;
      for (const gl of gulls) {
        const aa = t * gl.sp + gl.ph;
        gl.g.position.set(gl.c.x + Math.cos(aa) * gl.r, gl.h + Math.sin(t + gl.ph) * 0.8, gl.c.z + Math.sin(aa) * gl.r);
        gl.g.rotation.set(0, -aa + (gl.sp > 0 ? Math.PI : 0), gl.sp > 0 ? -0.3 : 0.3);
        gl.flap(t * 7 + gl.ph);
      }
    },
    camera: (cam, t, prog, m) => {
      cam.position.set(m.x * 3 + Math.sin(t * 0.12) * 2, 4.2 + Math.sin(t * 0.5) * 0.25 - m.y, 16 - prog * 14);
      cam.lookAt(m.x * 2, 1.5, -40);
    },
  };
}
