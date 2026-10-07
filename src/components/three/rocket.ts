import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ---------------------------------------------------------------------------
 * Rocket launch cycle for the hero sky:
 *   pad + service tower, venting vapour → ignition (flames, ground smoke, warm
 *   light) → liftoff → gravity turn → booster separation → climbs to orbit and
 *   fades → smoke drifts away → a fresh rocket is back on the pad. Loops.
 * Units: rocket ~7 tall, nose along +y.
 * ------------------------------------------------------------------------- */

const CYCLE = 36;
const T_IGNITE = 5;
const T_LIFT = 7.2;
const T_SEP = 13.5;

function puffTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 18; i++) {
    const x = 64 + (Math.random() - 0.5) * 50,
      y = 64 + (Math.random() - 0.5) * 50,
      r = 18 + Math.random() * 30;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, "rgba(255,255,255,0.5)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(c);
}

function flameMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
    uniforms: { uTime: { value: 0 }, uPower: { value: 0 } },
    vertexShader: `varying vec2 vUv; uniform float uTime, uPower;
      void main(){ vUv = uv; vec3 p = position;
        float wob = sin(uTime * 40.0 + p.y * 6.0) * 0.04 + sin(uTime * 23.0 - p.y * 9.0) * 0.03;
        p.x += wob * (1.0 - uv.y); p.z += wob * (1.0 - uv.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uTime, uPower;
      void main(){
        float y = vUv.y;               // 1 at nozzle, 0 at tip
        float flick = 0.85 + 0.15 * sin(uTime * 60.0 + y * 20.0);
        vec3 core = vec3(1.0, 0.97, 0.85), mid = vec3(1.0, 0.62, 0.18), tip = vec3(0.9, 0.22, 0.05);
        vec3 col = mix(tip, mid, smoothstep(0.0, 0.5, y)); col = mix(col, core, smoothstep(0.6, 1.0, y));
        float a = smoothstep(0.0, 0.45, y) * flick * uPower;
        // shock diamonds near the nozzle
        a += pow(max(0.0, sin(y * 34.0 - uTime * 8.0)), 8.0) * smoothstep(0.55, 0.95, y) * 0.5 * uPower;
        gl_FragColor = vec4(col * a * 1.6, a); }`,
  });
}

export function buildRocketLaunch(glow: THREE.Texture, lite: boolean) {
  const root = new THREE.Group();

  // ---------- pad + tower ----------
  const concrete = new THREE.MeshStandardMaterial({ color: "#6b6f78", roughness: 0.95 });
  const steel = new THREE.MeshStandardMaterial({ color: "#b8401f", roughness: 0.6, metalness: 0.4 }); // red launch-tower steel
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.5, 32), concrete);
  pad.position.y = -0.25;
  root.add(pad);
  const parts: THREE.BufferGeometry[] = [];
  const H = 9.5;
  for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) {
    const g = new THREE.BoxGeometry(0.08, H, 0.08);
    g.translate(x, H / 2, z);
    parts.push(g);
  }
  for (let y = 0.6; y < H; y += 0.7) {
    for (const [w, d, x, z] of [[0.98, 0.06, 0, -0.45], [0.98, 0.06, 0, 0.45], [0.06, 0.98, -0.45, 0], [0.06, 0.98, 0.45, 0]]) {
      const g = new THREE.BoxGeometry(w, 0.05, d);
      g.translate(x, y, z);
      parts.push(g);
    }
    const diag = new THREE.BoxGeometry(0.04, 0.95, 0.04);
    diag.rotateZ(((y * 10) | 0) % 2 ? 0.75 : -0.75);
    diag.translate(0, y + 0.35, 0.47);
    parts.push(diag);
  }
  for (const y of [3.2, 5.6]) {
    const arm = new THREE.BoxGeometry(1.5, 0.12, 0.25);
    arm.translate(1.15, y, 0);
    parts.push(arm);
  }
  const tower = new THREE.Mesh(mergeGeometries(parts), steel);
  tower.position.x = -1.9;
  root.add(tower);
  const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#ff3030", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  beacon.scale.setScalar(0.9);
  beacon.position.set(-1.9, H + 0.2, 0);
  root.add(beacon);

  // ---------- rocket ----------
  const white = new THREE.MeshStandardMaterial({ color: "#f3f4f6", roughness: 0.45, metalness: 0.15 });
  const black = new THREE.MeshStandardMaterial({ color: "#1b1d22", roughness: 0.5, metalness: 0.3 });
  const bellMat = new THREE.MeshStandardMaterial({ color: "#3a3a40", roughness: 0.35, metalness: 0.9 });
  const ogive = (r: number, h: number) => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      pts.push(new THREE.Vector2(r * Math.sqrt(1 - t * t * 0.98) * (1 - t * 0.1), t * h));
    }
    return new THREE.LatheGeometry(pts, 24);
  };
  const rocket = new THREE.Group();
  const core = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 5.2, 24), white);
  body.position.y = 2.6 + 0.3;
  core.add(body);
  for (const y of [1.0, 3.9]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.425, 0.425, 0.28, 24), black);
    band.position.y = y;
    core.add(band);
  }
  const nose = new THREE.Mesh(ogive(0.42, 1.6), white);
  nose.position.y = 5.5;
  core.add(nose);
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.5), black);
    const a = (i / 4) * Math.PI * 2;
    fin.position.set(Math.cos(a) * 0.5, 0.75, Math.sin(a) * 0.5);
    fin.rotation.y = -a;
    core.add(fin);
  }
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 0.45, 18, 1, true), bellMat);
  bell.position.y = 0.1;
  core.add(bell);
  rocket.add(core);

  const flames: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; glow: THREE.Sprite }[] = [];
  const addFlame = (parent: THREE.Object3D, x: number, r: number) => {
    const mat = flameMaterial();
    const geo = new THREE.ConeGeometry(r, 2.6, 18, 8, true);
    geo.rotateX(Math.PI); // tip pointing down
    geo.translate(0, -1.3, 0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, -0.1, 0);
    parent.add(mesh);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#ffb04a", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    gl.position.set(x, -0.3, 0);
    gl.scale.setScalar(0.01);
    parent.add(gl);
    flames.push({ mesh, mat, glow: gl });
  };
  addFlame(core, 0, 0.5);

  // side boosters
  const boosters: { g: THREE.Group; side: number; vel: THREE.Vector3; spin: number }[] = [];
  for (const side of [-1, 1]) {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.4, 18), white);
    b.position.y = 1.9;
    g.add(b);
    const n = new THREE.Mesh(ogive(0.22, 0.7), white);
    n.position.y = 3.6;
    g.add(n);
    const bb = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.3, 14, 1, true), bellMat);
    bb.position.y = 0.1;
    g.add(bb);
    g.position.x = side * 0.64;
    rocket.add(g);
    addFlame(g, 0, 0.3);
    boosters.push({ g, side, vel: new THREE.Vector3(), spin: 0 });
  }
  root.add(rocket);

  // warm light from the engines (lights tower, pad and smoke)
  const engineLight = new THREE.PointLight("#ff9a3c", 0, 40, 1.6);
  root.add(engineLight);

  // ---------- smoke / vapour particles ----------
  const N = lite ? 260 : 620;
  const pPos = new Float32Array(N * 3),
    pSize = new Float32Array(N),
    pAlpha = new Float32Array(N),
    pWarm = new Float32Array(N);
  const parts2 = Array.from({ length: N }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), age: 1, life: 1, s0: 1, grow: 1, a0: 0.5, warm: 0 }));
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  sg.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
  sg.setAttribute("aAlpha", new THREE.BufferAttribute(pAlpha, 1));
  sg.setAttribute("aWarm", new THREE.BufferAttribute(pWarm, 1));
  const smokeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uMap: { value: puffTexture() }, uScale: { value: 300 }, uFire: { value: 0 } },
    vertexShader: `attribute float aSize, aAlpha, aWarm; uniform float uScale; varying float vA, vW;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = aAlpha; vW = aWarm;
        gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uFire; varying float vA, vW;
      void main(){ vec4 t = texture2D(uMap, gl_PointCoord);
        vec3 col = mix(vec3(0.82, 0.8, 0.8), vec3(1.0, 0.62, 0.3), vW * uFire);
        gl_FragColor = vec4(col, t.a * vA); }`,
  });
  const smoke = new THREE.Points(sg, smokeMat);
  smoke.frustumCulled = false;
  root.add(smoke);
  let cursor = 0;
  const emit = (pos: THREE.Vector3, vel: THREE.Vector3, life: number, size: number, grow: number, alpha: number, warm: number) => {
    const q = parts2[cursor];
    cursor = (cursor + 1) % N;
    q.p.copy(pos);
    q.v.copy(vel);
    q.age = 0;
    q.life = life;
    q.s0 = size;
    q.grow = grow;
    q.a0 = alpha;
    q.warm = warm;
  };

  // ---------- flight state ----------
  const pos = new THREE.Vector3(),
    vel = new THREE.Vector3(),
    tmp = new THREE.Vector3(),
    nozzle = new THREE.Vector3();
  let cycleStart = -1;
  let launched = false,
    separated = false;
  const reset = () => {
    rocket.position.set(0, 0.25, 0);
    rocket.rotation.set(0, 0, 0);
    rocket.visible = true;
    rocket.scale.setScalar(1);
    pos.set(0, 0.25, 0);
    vel.set(0, 0, 0);
    for (const b of boosters) {
      rocket.add(b.g);
      b.g.position.set(b.side * 0.64, 0, 0);
      b.g.rotation.set(0, 0, 0);
      b.g.visible = true;
    }
    launched = separated = false;
  };
  reset();

  const update = (t: number, dt: number) => {
    if (cycleStart < 0) cycleStart = t;
    let ct = t - cycleStart;
    if (ct > CYCLE) {
      cycleStart = t;
      ct = 0;
      reset();
    }
    beacon.material.opacity = (t % 1.2) < 0.15 ? 1 : 0.15;

    // throttle: 0 on pad, ramps at ignition, cuts off near orbit
    const ign = THREE.MathUtils.smoothstep(ct, T_IGNITE, T_IGNITE + 1.2);
    const cutoff = 1 - THREE.MathUtils.smoothstep(ct, 22, 24);
    const power = ign * cutoff;
    const flick = 0.85 + Math.random() * 0.3;

    // ascent: accelerate, pitch over to the right (gravity turn), recede toward orbit
    if (ct > T_LIFT) {
      launched = true;
      const tt = ct - T_LIFT;
      const pitch = Math.min(1.5, Math.max(0, tt - 1.5) * 0.28);
      const accel = 1.1 + tt * 0.22;
      tmp.set(-Math.sin(pitch), Math.cos(pitch), -1.7 * Math.sin(pitch)); // gravity turn toward the open sky (left)
      vel.addScaledVector(tmp, accel * dt * cutoff);
      vel.multiplyScalar(1 - 0.02 * dt);
      pos.addScaledVector(vel, dt);
      rocket.position.copy(pos);
      rocket.rotation.z = pitch;
      rocket.rotation.x = -0.35 * pitch * 0.5;
      // fades to a dot as it reaches orbit
      const away = THREE.MathUtils.smoothstep(ct, 21, 27);
      rocket.visible = away < 0.999;
      rocket.scale.setScalar(1 - away * 0.6);
    }

    // booster separation: they tumble away and fall back
    if (!separated && ct > T_SEP) {
      separated = true;
      for (const b of boosters) {
        b.g.getWorldPosition(tmp);
        root.worldToLocal(tmp);
        root.attach(b.g);
        b.vel.copy(vel).multiplyScalar(0.6).add(new THREE.Vector3(b.side * 0.8, 0.2, -1));
        b.spin = b.side * (1 + Math.random());
      }
    }
    if (separated)
      for (const b of boosters) {
        b.vel.y -= 6 * dt;
        b.g.position.addScaledVector(b.vel, dt);
        b.g.rotation.z += b.spin * dt;
        if (ct > T_SEP + 2.5) b.g.visible = false;
      }

    // flames
    flames.forEach((fl, i) => {
      const onBooster = i > 0;
      const p = onBooster && separated ? 0 : power;
      fl.mat.uniforms.uTime.value = t;
      fl.mat.uniforms.uPower.value = p;
      fl.mesh.visible = p > 0.01;
      fl.mesh.scale.set(1, (0.6 + 0.6 * p + Math.min(ct - T_LIFT, 8) * 0.06 * p) * flick, 1);
      fl.glow.scale.setScalar(p * (onBooster ? 2.4 : 3.6) * flick);
      fl.glow.material.opacity = p;
    });

    // warm light follows the engines
    engineLight.position.copy(pos).add(tmp.set(0, -1, 0));
    engineLight.intensity = power * 260 * flick;
    smokeMat.uniforms.uFire.value = power;

    // smoke emission
    const nRate = lite ? 0.5 : 1;
    if (ct < T_IGNITE && Math.random() < 0.35 * nRate) {
      // cryogenic vapour venting off the tank
      emit(tmp.set((Math.random() < 0.5 ? -1 : 1) * 0.45, 2 + Math.random() * 3, 0), new THREE.Vector3((Math.random() - 0.5) * 0.6, -0.3, (Math.random() - 0.5) * 0.4), 2.5, 0.8, 1.5, 0.35, 0);
    }
    if (power > 0.05) {
      const n = Math.round((launched ? 3 : 6) * nRate);
      for (let k = 0; k < n; k++) {
        rocket.localToWorld(nozzle.set((Math.random() - 0.5) * 0.4, -0.6, 0));
        root.worldToLocal(nozzle);
        const nearPad = nozzle.y < 6;
        if (nearPad) {
          // billows sideways out of the flame trench
          const side = Math.random() < 0.5 ? -1 : 1;
          emit(tmp.set(nozzle.x, 0.3, nozzle.z), new THREE.Vector3(side * (3 + Math.random() * 5), 0.6 + Math.random() * 1.6, (Math.random() - 0.5) * 3), 4 + Math.random() * 3, 2.2, 3.2, 0.55, 1);
        } else {
          // exhaust trail in the sky
          emit(nozzle, new THREE.Vector3((Math.random() - 0.5) * 0.6, -0.5, (Math.random() - 0.5) * 0.6), 5 + Math.random() * 2, 0.9 + pos.y * 0.01, 2.2, 0.45, 0.6);
        }
      }
    }

    // integrate particles
    for (let i = 0; i < N; i++) {
      const q = parts2[i];
      if (q.age >= q.life) {
        pAlpha[i] = 0;
        continue;
      }
      q.age += dt;
      const k = q.age / q.life;
      q.v.multiplyScalar(1 - 1.2 * dt);
      q.v.y += 0.25 * dt; // smoke rises slowly
      q.p.addScaledVector(q.v, dt);
      pPos[i * 3] = q.p.x;
      pPos[i * 3 + 1] = q.p.y;
      pPos[i * 3 + 2] = q.p.z;
      pSize[i] = q.s0 * (1 + k * q.grow);
      pAlpha[i] = q.a0 * Math.min(1, q.age * 4) * (1 - k);
      pWarm[i] = q.warm * Math.max(0, 1 - k * 3);
    }
    sg.attributes.position.needsUpdate = true;
    sg.attributes.aSize.needsUpdate = true;
    sg.attributes.aAlpha.needsUpdate = true;
    sg.attributes.aWarm.needsUpdate = true;
  };

  return {
    root,
    update,
    setScale: (pxPerUnit: number) => (smokeMat.uniforms.uScale.value = pxPerUnit),
  };
}
