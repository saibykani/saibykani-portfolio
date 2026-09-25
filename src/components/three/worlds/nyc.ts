import * as THREE from "three";
import { buildAirliner } from "../aircraft";
import { Ctx, Fader, glowTex, rand, skyDome, stars, windowTexture, World } from "./common";

/* New York City at night: avenue grid, landmark towers, rivers of headlights,
 * yellow cabs, helicopters with spinning rotors + searchlights, an airliner overhead. */
export function nyc(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  group.add(skyDome(f, "#050816", "#1a1238", "#5b2a4a"));
  group.add(stars(f, ctx.lite ? 300 : 700, 300, 1.0));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), f.mat(new THREE.MeshStandardMaterial({ color: "#0b0c12", roughness: 0.9 })));
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // ---- city blocks ----
  const AV = 14; // avenue spacing (x)
  const ST = 9; // street spacing (z)
  const winTex = windowTexture(true);
  const bMat = f.mat(new THREE.MeshStandardMaterial({ color: "#10131c", map: winTex, emissive: "#ffffff", emissiveMap: winTex, emissiveIntensity: 1.1, metalness: 0.5, roughness: 0.45 }));
  const slots: { x: number; z: number; w: number; d: number; h: number }[] = [];
  for (let ax = -5; ax <= 5; ax++)
    for (let sz = -20; sz <= 3; sz++) {
      if (ax === 0) continue; // the main avenue stays open for the camera
      if (ctx.lite && (ax + sz) % 2) continue;
      const cx = ax * AV - Math.sign(ax) * 1.5;
      const cz = sz * ST;
      const dist = Math.abs(ax) * 0.6 + Math.abs(sz + 8) * 0.12;
      const h = Math.max(4, rand(8, 42) * Math.exp(-dist * 0.18) + rand(3, 10));
      slots.push({ x: cx + rand(-1.5, 1.5), z: cz, w: rand(5, 9), d: rand(5, 7), h });
    }
  const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), bMat, slots.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s3 = new THREE.Vector3();
  slots.forEach((b, i) => buildings.setMatrixAt(i, m4.compose(new THREE.Vector3(b.x, 0, b.z), q, s3.set(b.w, b.h, b.d))));
  group.add(buildings);

  // ---- landmarks ----
  const glass = f.mat(new THREE.MeshPhysicalMaterial({ color: "#8fb3d9", metalness: 0.9, roughness: 0.12, emissive: "#1c2b4a", emissiveIntensity: 0.6 }));
  const stone = f.mat(new THREE.MeshStandardMaterial({ color: "#2a2f3d", map: winTex, emissive: "#ffffff", emissiveMap: winTex, emissiveIntensity: 1.2, roughness: 0.6 }));
  const topLight = f.mat(new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#a78bfa", emissiveIntensity: 2.5 }));
  // Empire State-style tower
  const esb = new THREE.Group();
  [
    [8, 26, 8, 0],
    [6, 14, 6, 26],
    [4.2, 10, 4.2, 40],
    [2.6, 6, 2.6, 50],
  ].forEach(([w, h, d, y]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), stone);
    m.position.y = y;
    esb.add(m);
  });
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 4, 8).translate(0, 2, 0), topLight);
  crown.position.y = 56;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.3, 9, 6).translate(0, 4.5, 0), stone);
  spire.position.y = 60;
  esb.add(crown, spire);
  const esbBeacon = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ff3030", blending: THREE.AdditiveBlending, depthWrite: false })));
  esbBeacon.position.y = 69.5;
  esbBeacon.scale.setScalar(3);
  esb.add(esbBeacon);
  esb.position.set(-2 * AV, 0, -9 * ST);
  group.add(esb);
  // One WTC-style tapered glass tower
  const wtc = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 5.2, 70, 4, 1).translate(0, 35, 0), glass);
  wtc.rotation.y = Math.PI / 4;
  wtc.position.set(3 * AV, 0, -15 * ST);
  const wtcSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 16, 6).translate(0, 8, 0), glass);
  wtcSpire.position.set(3 * AV, 70, -15 * ST);
  group.add(wtc, wtcSpire);
  // Chrysler-style art-deco crown
  const chr = new THREE.Group();
  chr.add(new THREE.Mesh(new THREE.BoxGeometry(6, 34, 6).translate(0, 17, 0), stone));
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.ConeGeometry(2.8 - i * 0.5, 2.4, 8, 1, true).translate(0, 1.2, 0), topLight);
    ring.position.y = 34 + i * 2;
    chr.add(ring);
  }
  const chrSpire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 8, 8).translate(0, 4, 0), glass);
  chrSpire.position.y = 44;
  chr.add(chrSpire);
  chr.position.set(1 * AV + 2, 0, -12 * ST);
  group.add(chr);

  // ---- traffic: rivers of headlights / taillights, animated on the GPU ----
  const lanes: number[] = [];
  for (let ax = -5; ax <= 5; ax++) lanes.push(ax * AV);
  const PER = ctx.lite ? 60 : 140;
  const n = lanes.length * PER * 2;
  const tp = new Float32Array(n * 3);
  const tc = new Float32Array(n * 3);
  const ts = new Float32Array(n);
  let k = 0;
  lanes.forEach((x) => {
    for (let dir = -1; dir <= 1; dir += 2)
      for (let i = 0; i < PER; i++) {
        tp.set([x + dir * 1.3, 0.35, rand(-190, 40)], k * 3);
        const head = dir > 0; // cars coming toward camera show white headlights
        tc.set(head ? [1, 0.95, 0.8] : [1, 0.15, 0.1], k * 3);
        ts[k] = dir * rand(10, 18);
        k++;
      }
  });
  const tg = new THREE.BufferGeometry();
  tg.setAttribute("position", new THREE.BufferAttribute(tp, 3));
  tg.setAttribute("aC", new THREE.BufferAttribute(tc, 3));
  tg.setAttribute("aS", new THREE.BufferAttribute(ts, 1));
  tg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -70), 250);
  const uFade = f.uniform({ value: 0 });
  const trafficMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade, uPx: { value: Math.min(window.devicePixelRatio || 1, 1.5) } },
    vertexShader: `attribute vec3 aC; attribute float aS; uniform float uTime, uPx; varying vec3 vC;
      void main(){ vec3 p = position; p.z = mod(p.z + 190.0 + uTime * aS, 230.0) - 190.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = uPx * 90.0 / -mv.z; vC = aC; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uFade; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC * a, a * uFade); }`,
  });
  group.add(new THREE.Points(tg, trafficMat));

  // ---- yellow cabs on the main avenue (real meshes near the camera) ----
  const CABS = ctx.lite ? 10 : 22;
  const cabGeo = new THREE.BoxGeometry(1.1, 0.55, 2.4).translate(0, 0.45, 0);
  const cabs = new THREE.InstancedMesh(cabGeo, f.mat(new THREE.MeshStandardMaterial({ color: "#facc15", metalness: 0.4, roughness: 0.35 })), CABS);
  const roofs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.35, 1.2).translate(0, 0.9, -0.1), f.mat(new THREE.MeshStandardMaterial({ color: "#1e293b", metalness: 0.8, roughness: 0.2 })), CABS);
  const cabData = Array.from({ length: CABS }, (_, i) => ({ lane: i % 2 ? 1.5 : -1.5, z: rand(-150, 30), v: (i % 2 ? 1 : -1) * rand(8, 14) }));
  group.add(cabs, roofs);

  // ---- helicopters ----
  const helis = [0, 1, 2].map((i) => {
    const g = new THREE.Group();
    const body = f.mat(new THREE.MeshStandardMaterial({ color: ["#e2e8f0", "#1e3a8a", "#b91c1c"][i], metalness: 0.6, roughness: 0.3 }));
    const cab = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12).scale(1.5, 1, 1), body);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 3.2, 8).rotateZ(Math.PI / 2).translate(-2.4, 0.2, 0), body);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.08).translate(-3.9, 0.55, 0), body);
    const glassM = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI).scale(1.2, 0.8, 0.9).rotateZ(-Math.PI / 2).translate(0.7, 0.1, 0), f.mat(new THREE.MeshPhysicalMaterial({ color: "#0f172a", metalness: 1, roughness: 0.05 })));
    const skidM = f.mat(new THREE.MeshStandardMaterial({ color: "#111" }));
    const skids = [-0.6, 0.6].map((z) => new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.06).translate(0, -1, z), skidM));
    const rotor = new THREE.Group();
    const bladeM = f.mat(new THREE.MeshStandardMaterial({ color: "#0b0b0b" }));
    rotor.add(new THREE.Mesh(new THREE.BoxGeometry(7, 0.03, 0.22), bladeM), new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 7), bladeM));
    rotor.position.y = 1.05;
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.14), bladeM);
    tail.position.set(-3.9, 0.6, 0.12);
    tail.rotation.x = Math.PI / 2;
    const strobe = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffffff", blending: THREE.AdditiveBlending, depthWrite: false })));
    strobe.position.set(-4, 1, 0);
    strobe.scale.setScalar(1.4);
    const red = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ff2d2d", blending: THREE.AdditiveBlending, depthWrite: false })));
    red.position.set(0, -1.1, 0);
    red.scale.setScalar(1);
    // searchlight: additive cone + a pool of light on the ground
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(4, 26, 24, 1, true).translate(0, -13, 0),
      f.mat(new THREE.MeshBasicMaterial({ color: "#fff7d6", blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0.06)
    );
    beam.position.set(1, -1, 0);
    g.add(cab, boom, fin, glassM, ...skids, rotor, tail, strobe, red, beam);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(5, 32).rotateX(-Math.PI / 2), f.mat(new THREE.MeshBasicMaterial({ map: glowTex(), color: "#fff2c0", blending: THREE.AdditiveBlending, depthWrite: false }), 0.35));
    pool.position.y = 0.05;
    group.add(g, pool);
    return { g, rotor, tail, strobe, pool, beam, r: [22, 34, 16][i], h: [24, 32, 18][i], c: new THREE.Vector3([-8, 12, 4][i], 0, [-50, -90, -25][i]), sp: [0.12, -0.08, 0.16][i], ph: i * 2 };
  });

  // ---- airliner overhead ----
  const plane = buildAirliner(glowTex(), "#0ea5e9");
  plane.outer.scale.setScalar(2.2);
  group.add(plane.outer);

  group.add(f.light(new THREE.HemisphereLight("#6d6aff", "#120a1e", 0.9)));
  const moon = f.light(new THREE.DirectionalLight("#c7d2fe", 1.2));
  moon.position.set(-30, 60, 20);
  group.add(moon);
  const street = f.light(new THREE.PointLight("#ffb86b", 400, 120, 1.6));
  street.position.set(0, 6, -20);
  group.add(street);

  const v = new THREE.Vector3();
  return {
    group,
    fade: f,
    bg: new THREE.Color("#07060f"),
    fog: new THREE.Color("#2a1a3a"),
    fogDensity: 0.0085,
    update: (t, dt) => {
      trafficMat.uniforms.uTime.value = t;
      (topLight as THREE.MeshStandardMaterial).emissive.setHSL((t * 0.03) % 1, 0.8, 0.55);
      esbBeacon.material.opacity = f.value * (Math.sin(t * 3) > 0 ? 1 : 0.1);
      cabData.forEach((c, i) => {
        c.z += c.v * dt;
        if (c.z > 40) c.z = -150;
        if (c.z < -150) c.z = 40;
        m4.compose(v.set(c.lane, 0, c.z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), c.v > 0 ? 0 : Math.PI), s3.set(1, 1, 1));
        cabs.setMatrixAt(i, m4);
        roofs.setMatrixAt(i, m4);
      });
      cabs.instanceMatrix.needsUpdate = true;
      roofs.instanceMatrix.needsUpdate = true;
      for (const h of helis) {
        const a = t * h.sp + h.ph;
        h.g.position.set(h.c.x + Math.cos(a) * h.r, h.h + Math.sin(t * 0.7 + h.ph) * 1.2, h.c.z + Math.sin(a) * h.r);
        h.g.rotation.y = -a + (h.sp > 0 ? -Math.PI / 2 : Math.PI / 2);
        h.g.rotation.z = 0.08;
        h.rotor.rotation.y += dt * 28;
        h.tail.rotation.z += dt * 40;
        h.strobe.material.opacity = f.value * ((t + h.ph) % 1.1 < 0.08 ? 1 : 0);
        h.pool.position.set(h.g.position.x, 0.05, h.g.position.z);
        h.beam.rotation.z = Math.sin(t * 0.6 + h.ph) * 0.25;
      }
      const u = ((t * 0.035) % 1) * 1.3 - 0.15;
      plane.outer.position.set(-160 + u * 320, 58, -120 + u * 40);
      plane.outer.lookAt(plane.outer.position.x + 8, 58, plane.outer.position.z + 1);
      for (const l of plane.lights) l.sprite.material.opacity = f.value * (l.kind === "strobe" ? ((t * 1.1) % 1.2 < 0.08 ? 1 : 0) : l.kind === "beacon" ? 0.5 + 0.5 * Math.sin(t * 6) : 0.9);
    },
    camera: (cam, t, prog, m) => {
      cam.position.set(m.x * 4 + Math.sin(t * 0.1) * 1.5, 16 - prog * 7 - m.y * 2, 42 - prog * 40);
      cam.lookAt(m.x * 2, 12 - prog * 3, -60 - prog * 30);
    },
  };
}
