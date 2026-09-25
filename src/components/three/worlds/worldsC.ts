import * as THREE from "three";
import { canvasTex, Ctx, Fader, fbm2, glowTex, gridFloor, rand, stars, World } from "./common";

/* ======================= ASTEROID BELT ======================= */
export function asteroid(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  group.add(stars(f, ctx.lite ? 900 : 2000, 120, 0.8));

  // ringed gas giant
  const bands = canvasTex(512, 256, (g) => {
    for (let y = 0; y < 256; y++) {
      const n = fbm2(0.5, y * 0.05, 4);
      const c = new THREE.Color().setHSL(0.07 + n * 0.04, 0.55, 0.3 + n * 0.35);
      g.fillStyle = `#${c.getHexString()}`;
      g.fillRect(0, y, 512, 1);
    }
    g.fillStyle = "rgba(160,60,30,0.55)";
    g.beginPath();
    g.ellipse(330, 160, 38, 18, 0, 0, Math.PI * 2);
    g.fill();
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(14, 64, 32), f.mat(new THREE.MeshStandardMaterial({ map: bands, roughness: 0.9 })));
  planet.position.set(16, 6, -70);
  planet.rotation.z = 0.3;
  group.add(planet);
  const ringTex = canvasTex(512, 8, (g) => {
    for (let x = 0; x < 512; x++) {
      const a = 0.25 + 0.75 * Math.abs(Math.sin(x * 0.09) * Math.sin(x * 0.023));
      g.fillStyle = `rgba(225,200,160,${x < 30 || x > 490 ? 0 : a * 0.85})`;
      g.fillRect(x, 0, 1, 8);
    }
  });
  const ringGeo = new THREE.RingGeometry(18, 30, 160, 1);
  const rp = ringGeo.attributes.position as THREE.BufferAttribute;
  const ruv = ringGeo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < rp.count; i++) {
    const r = Math.hypot(rp.getX(i), rp.getY(i));
    ruv.setXY(i, (r - 18) / 12, 0.5);
  }
  const ring = new THREE.Mesh(ringGeo, f.mat(new THREE.MeshStandardMaterial({ map: ringTex, side: THREE.DoubleSide, depthWrite: false, roughness: 1 })));
  ring.position.copy(planet.position);
  ring.rotation.set(-1.25, 0.2, 0.3);
  group.add(ring);

  const sunGlow = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffd9a0", blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  sunGlow.position.set(-40, 18, -120);
  sunGlow.scale.setScalar(40);
  group.add(sunGlow);

  // tumbling asteroids
  const rock = new THREE.DodecahedronGeometry(1, 1);
  const p = rock.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    v.multiplyScalar(0.75 + fbm2(v.x * 2 + 5, v.y * 2 + v.z, 3) * 0.6);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  rock.computeVertexNormals();
  const N = ctx.lite ? 110 : 240;
  const rocks = new THREE.InstancedMesh(rock, f.mat(new THREE.MeshStandardMaterial({ color: "#8b7d6b", roughness: 0.95, flatShading: true })), N);
  const rd = Array.from({ length: N }, () => ({ p: new THREE.Vector3(), s: 0, r: new THREE.Euler(), w: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(0.8), v: 0 }));
  const reset = (d: (typeof rd)[number], far: boolean) => {
    let x = rand(-30, 30);
    if (Math.abs(x) < 2.5) x += Math.sign(x || 1) * 3;
    d.p.set(x, rand(-6, 12), far ? rand(-120, -90) : rand(-120, 6));
    d.s = Math.pow(Math.random(), 2) * 2.6 + 0.3;
    d.v = rand(4, 9);
  };
  rd.forEach((d) => reset(d, false));
  group.add(rocks);

  // passing spaceship
  const ship = new THREE.Group();
  const hull = f.mat(new THREE.MeshStandardMaterial({ color: "#cbd5e1", metalness: 0.8, roughness: 0.3 }));
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.4, 8).rotateX(Math.PI / 2), hull);
  ship.add(body);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.6), hull);
    w.position.set(s * 0.6, 0, 0.5);
    w.rotation.y = s * 0.3;
    ship.add(w);
  }
  const engine = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#60a5fa", blending: THREE.AdditiveBlending, depthWrite: false })));
  engine.position.z = 1.3;
  engine.scale.set(1.2, 1.2, 1);
  ship.add(engine);
  group.add(ship);

  group.add(f.light(new THREE.AmbientLight("#334155", 0.6)));
  const sun = f.light(new THREE.DirectionalLight("#ffe7c2", 2.2));
  sun.position.set(-40, 18, -40);
  group.add(sun);

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  return {
    group,
    fade: f,
    bg: new THREE.Color("#02030a"),
    fog: new THREE.Color("#05070f"),
    fogDensity: 0.012,
    update: (t, dt) => {
      planet.rotation.y = t * 0.03;
      rd.forEach((d, i) => {
        d.p.z += d.v * dt;
        if (d.p.z > 10) reset(d, true);
        d.r.x += d.w.x * dt;
        d.r.y += d.w.y * dt;
        d.r.z += d.w.z * dt;
        q.setFromEuler(d.r);
        m4.compose(d.p, q, sc.setScalar(d.s));
        rocks.setMatrixAt(i, m4);
      });
      rocks.instanceMatrix.needsUpdate = true;
      const u = ((t * 0.05) % 1) * 2 - 0.5; // crosses every 20s
      ship.position.set(-40 + u * 60, 3 + Math.sin(t * 0.5) * 0.8, -18 + u * 6);
      ship.lookAt(ship.position.x + 10, ship.position.y, ship.position.z + 1);
      ship.rotateY(Math.PI);
      engine.scale.setScalar(1 + Math.random() * 0.4);
    },
  };
}

/* ======================= SYNTHWAVE ======================= */
export function synthwave(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  group.add(stars(f, 600, 100, 0.6, "#fbcfe8"));
  const grid = gridFloor(f, "#f0abfc", "#22d3ee", 260, 0.6);
  grid.mesh.position.y = -2;
  group.add(grid.mesh);

  // striped retro sun
  const uFade = f.uniform({ value: 0 });
  const sunMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uFade },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime, uFade; varying vec2 vUv;
      void main(){ vec2 c = vUv - 0.5; float d = length(c); if (d > 0.5) discard;
        vec3 col = mix(vec3(1.0, 0.18, 0.55), vec3(1.0, 0.85, 0.25), vUv.y);
        float y = vUv.y;
        float gap = y < 0.52 ? step(0.5 - (0.52 - y) * 0.9, fract(y * 18.0 - uTime * 0.4)) : 1.0;
        gl_FragColor = vec4(col, gap * uFade * smoothstep(0.5, 0.48, d)); }`,
  });
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), sunMat);
  sun.position.set(0, 7, -90);
  group.add(sun);
  const sunGlow = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ff2e88", blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0.6));
  sunGlow.position.set(0, 7, -92);
  sunGlow.scale.setScalar(70);
  group.add(sunGlow);

  // wireframe mountains on both sides
  for (const side of [-1, 1]) {
    const g = new THREE.PlaneGeometry(70, 50, 40, 30);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      const edge = THREE.MathUtils.smoothstep(side * x, -35, 25);
      p.setY(i, Math.pow(fbm2(x * 0.08 + side * 9, z * 0.08, 4), 1.8) * 22 * edge);
    }
    const m = new THREE.Mesh(g, f.mat(new THREE.MeshBasicMaterial({ color: side < 0 ? "#e879f9" : "#22d3ee", wireframe: true })));
    m.position.set(side * 45, -2, -60);
    group.add(m);
  }

  // palm silhouettes
  const palmTex = canvasTex(256, 512, (g) => {
    g.strokeStyle = "#0a0214";
    g.fillStyle = "#0a0214";
    g.lineWidth = 16;
    g.beginPath();
    g.moveTo(128, 512);
    g.quadraticCurveTo(100, 300, 140, 120);
    g.stroke();
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.5;
      g.beginPath();
      g.moveTo(140, 120);
      g.quadraticCurveTo(140 + Math.cos(a) * 60, 120 + Math.sin(a) * 40 - 30, 140 + Math.cos(a) * 120, 120 + Math.sin(a) * 60 + 50);
      g.lineWidth = 12;
      g.stroke();
    }
  });
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: palmTex, depthWrite: false, fog: false })));
    const side = i % 2 ? 1 : -1;
    s.position.set(side * rand(6, 14), 3, rand(-30, -8));
    s.scale.set(6, 12, 1);
    group.add(s);
  }

  return {
    group,
    fade: f,
    bg: new THREE.Color("#0d0221"),
    fog: new THREE.Color("#2a0845"),
    fogDensity: 0.012,
    update: (t) => {
      grid.mat.uniforms.uTime.value = t;
      sunMat.uniforms.uTime.value = t;
    },
  };
}

/* ======================= DEEP SPACE (spiral galaxy) ======================= */
export function galaxy(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  group.add(stars(f, ctx.lite ? 800 : 1800, 120, 0.7));

  const N = ctx.lite ? 14000 : 32000;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const inner = new THREE.Color("#ffd8a8");
  const outer = new THREE.Color("#6d8cff");
  const pink = new THREE.Color("#f472b6");
  const tmp = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = Math.pow(Math.random(), 1.6) * 16;
    const arm = (i % 3) * ((Math.PI * 2) / 3);
    const spin = r * 0.45;
    const spread = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (0.6 + r * 0.12);
    const a = arm + spin;
    pos.set([Math.cos(a) * r + spread, (Math.random() - 0.5) * (1.4 - r * 0.06) * Math.random(), Math.sin(a) * r + spread * Math.random()], i * 3);
    tmp.copy(inner).lerp(outer, r / 16);
    if (Math.random() < 0.06) tmp.lerp(pink, 0.7);
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const gal = new THREE.Points(g, f.mat(new THREE.PointsMaterial({ size: 0.13, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, map: glowTex() })));
  const holder = new THREE.Group();
  holder.add(gal);
  const core = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffe2b8", blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  core.scale.setScalar(9);
  holder.add(core);
  holder.position.set(0, 1.5, -16);
  holder.rotation.set(0.55, 0, 0.25);
  group.add(holder);

  for (let i = 0; i < 9; i++) {
    const s = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: ["#7c3aed", "#2563eb", "#db2777"][i % 3], blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0.12));
    s.position.set(rand(-40, 40), rand(-5, 20), rand(-70, -35));
    s.scale.setScalar(rand(20, 40));
    group.add(s);
  }

  return {
    group,
    fade: f,
    bg: new THREE.Color("#020108"),
    fog: new THREE.Color("#020108"),
    fogDensity: 0.002,
    update: (t) => {
      gal.rotation.y = t * 0.05;
    },
  };
}
