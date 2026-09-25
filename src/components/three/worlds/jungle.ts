import * as THREE from "three";
import { bird, canvasTex, Ctx, Fader, glowTex, rand, skyDome, World } from "./common";

function elephant(f: Fader) {
  const g = new THREE.Group();
  const skin = f.mat(new THREE.MeshStandardMaterial({ color: "#8a8f98", roughness: 0.95 }));
  const tusk = f.mat(new THREE.MeshStandardMaterial({ color: "#f5f0e1", roughness: 0.4 }));
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14).scale(1.7, 1.15, 1.05), skin);
  body.position.y = 2.2;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), skin);
  head.position.set(1.85, 2.75, 0);
  g.add(head);
  const ears = [-1, 1].map((s) => {
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16).scale(0.8, 1, 1), f.mat(new THREE.MeshStandardMaterial({ color: "#7c818a", side: THREE.DoubleSide, roughness: 0.95 })));
    e.position.set(1.55, 2.8, s * 0.62);
    e.rotation.y = s * 1.2;
    g.add(e);
    return e;
  });
  // trunk: chain of tapering segments so it can swing
  const trunk: THREE.Object3D[] = [];
  let parent: THREE.Object3D = head;
  for (let i = 0; i < 6; i++) {
    const r = 0.26 - i * 0.03;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, 0.36, 10).translate(0, -0.18, 0), skin);
    seg.position.set(i === 0 ? 0.55 : 0, i === 0 ? -0.2 : -0.36, 0);
    parent.add(seg);
    trunk.push(seg);
    parent = seg;
  }
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.9, 8), tusk);
    t.position.set(2.3, 2.35, s * 0.3);
    t.rotation.z = -2.2;
    g.add(t);
  }
  const legs = [
    [1.0, 0.5],
    [1.0, -0.5],
    [-1.0, 0.5],
    [-1.0, -0.5],
  ].map(([x, z]) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.7, z);
    pivot.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.33, 1.7, 10).translate(0, -0.85, 0), skin));
    g.add(pivot);
    return pivot;
  });
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.9, 6).translate(0, -0.45, 0), skin);
  tail.position.set(-1.7, 2.5, 0);
  g.add(tail);
  return { g, trunk, ears, legs, tail };
}

function giraffe(f: Fader) {
  const g = new THREE.Group();
  const spots = canvasTex(256, 256, (c) => {
    c.fillStyle = "#e7b36a";
    c.fillRect(0, 0, 256, 256);
    c.fillStyle = "#8a4b1f";
    for (let i = 0; i < 70; i++) {
      c.beginPath();
      const x = rand(0, 256),
        y = rand(0, 256),
        r = rand(10, 22);
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        const rr = r * rand(0.7, 1.1);
        k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      c.fill();
    }
  });
  spots.wrapS = spots.wrapT = THREE.RepeatWrapping;
  const skin = f.mat(new THREE.MeshStandardMaterial({ map: spots, roughness: 0.9 }));
  const dark = f.mat(new THREE.MeshStandardMaterial({ color: "#3b2410" }));
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12).scale(1.3, 0.8, 0.7), skin);
  body.position.y = 3.3;
  g.add(body);
  const neckPivot = new THREE.Group();
  neckPivot.position.set(1.0, 3.6, 0);
  g.add(neckPivot);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 3.4, 10).translate(0, 1.7, 0), skin);
  neck.rotation.z = -0.35;
  neckPivot.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10).scale(1.6, 0.9, 0.9), skin);
  head.position.set(1.4, 3.2, 0);
  neckPivot.add(head);
  for (const s of [-1, 1]) {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 6), dark);
    o.position.set(1.2, 3.55, s * 0.12);
    neckPivot.add(o);
  }
  [
    [0.8, 0.35],
    [0.8, -0.35],
    [-0.8, 0.35],
    [-0.8, -0.35],
  ].forEach(([x, z]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 2.9, 8).translate(0, -1.45, 0), skin);
    l.position.set(x, 3, z);
    g.add(l);
  });
  return { g, neckPivot };
}

/* Wild jungle in warm daylight: elephants walking, a browsing giraffe, macaws,
 * a waterfall with mist, palms and broadleaf trees, butterflies and sun shafts. */
export function jungle(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const sunDir = new THREE.Vector3(0.4, 0.6, -0.7).normalize();
  group.add(skyDome(f, "#5fa8d3", "#b9e3c6", "#f3e6a6", sunDir, "#fff4cc", 0.002));

  const grass = canvasTex(256, 256, (c) => {
    c.fillStyle = "#3f7a2c";
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) {
      c.fillStyle = ["#4d8f33", "#356b24", "#5ba33a", "#2f5f20"][i % 4];
      c.fillRect(rand(0, 256), rand(0, 256), 2, rand(2, 6));
    }
  });
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(40, 40);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), f.mat(new THREE.MeshStandardMaterial({ map: grass, roughness: 1 })));
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // trees
  const T = ctx.lite ? 30 : 60;
  const q = new THREE.Quaternion();
  const m4 = new THREE.Matrix4();
  const s3 = new THREE.Vector3();
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.55, 12, 7).translate(0, 6, 0), f.mat(new THREE.MeshStandardMaterial({ color: "#5b3a22", roughness: 1 })), T);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3, 1), f.mat(new THREE.MeshStandardMaterial({ color: "#2f7d32", flatShading: true, roughness: 0.9 })), T * 3);
  const col = new THREE.Color();
  let k = 0;
  for (let i = 0; i < T; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * rand(9, 60),
      z = rand(-110, 10),
      sc = rand(0.8, 1.5);
    trunks.setMatrixAt(i, m4.compose(new THREE.Vector3(x, 0, z), q, s3.set(sc, sc, sc)));
    for (let c = 0; c < 3; c++) {
      crowns.setMatrixAt(k, m4.compose(new THREE.Vector3(x + rand(-2.5, 2.5), 12 * sc + rand(-1.5, 2), z + rand(-2.5, 2.5)), q, s3.setScalar(sc * rand(0.8, 1.3))));
      crowns.setColorAt(k++, col.set(["#2f7d32", "#3f9142", "#1f6b2a", "#4ca64c"][Math.floor(Math.random() * 4)]));
    }
  }
  group.add(trunks, crowns);

  // palms
  const frondM = f.mat(new THREE.MeshStandardMaterial({ color: "#3d8b3d", side: THREE.DoubleSide, roughness: 0.8 }));
  const palmTrunkM = f.mat(new THREE.MeshStandardMaterial({ color: "#8b6b45", roughness: 1 }));
  const palms: THREE.Group[] = [];
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Group();
    p.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 9, 7).translate(0, 4.5, 0).rotateZ(rand(-0.15, 0.15)), palmTrunkM));
    for (let j = 0; j < 8; j++) {
      const fr = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 0.9).translate(2.25, 0, 0), frondM);
      fr.position.y = 9;
      fr.rotation.set(rand(-0.2, 0.2), (j / 8) * Math.PI * 2, -0.55);
      p.add(fr);
    }
    const side = i % 2 ? 1 : -1;
    p.position.set(side * rand(6, 16), 0, rand(-40, 0));
    palms.push(p);
    group.add(p);
  }

  // waterfall
  const cliff = new THREE.Mesh(new THREE.BoxGeometry(24, 22, 6), f.mat(new THREE.MeshStandardMaterial({ color: "#5d5a54", roughness: 1, flatShading: true })));
  cliff.position.set(-6, 11, -80);
  group.add(cliff);
  const uFade = f.uniform({ value: 0 });
  const fallMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uFade },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime, uFade; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){ float s = h(vec2(floor(vUv.x * 60.0), floor(vUv.y * 20.0 + uTime * 12.0)));
        float streak = smoothstep(0.35, 1.0, s);
        float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        vec3 col = mix(vec3(0.55, 0.8, 0.95), vec3(1.0), streak);
        gl_FragColor = vec4(col, (0.55 + streak * 0.45) * edge * uFade); }`,
  });
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(6, 22), fallMat);
  fall.position.set(-6, 11, -76.9);
  group.add(fall);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(9, 32).rotateX(-Math.PI / 2), f.mat(new THREE.MeshStandardMaterial({ color: "#2f8fb0", metalness: 0.6, roughness: 0.15 })));
  pool.position.set(-6, 0.03, -72);
  group.add(pool);
  const mist = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffffff", depthWrite: false }), 0.5));
  mist.position.set(-6, 2, -73);
  mist.scale.set(18, 7, 1);
  group.add(mist);

  // animals
  const eles = [0, 1].map((i) => {
    const e = elephant(f);
    e.g.scale.setScalar(i ? 0.75 : 1);
    group.add(e.g);
    return { ...e, x: i ? -30 : -18, z: i ? -26 : -30, v: 1.4, ph: i * 1.3 };
  });
  const gir = giraffe(f);
  gir.g.position.set(14, 0, -34);
  gir.g.rotation.y = -2.3;
  group.add(gir.g);
  const acacia = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.5, 1.2, 12), f.mat(new THREE.MeshStandardMaterial({ color: "#3f7a2c", flatShading: true })));
  acacia.position.set(17.5, 8.2, -36.5);
  const acTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 8, 7).translate(0, 4, 0), f.mat(new THREE.MeshStandardMaterial({ color: "#5b3a22" })));
  acTrunk.position.set(17.5, 0, -36.5);
  group.add(acacia, acTrunk);

  const macaws = Array.from({ length: ctx.lite ? 4 : 8 }, (_, i) => {
    const b = bird(f, ["#dc2626", "#2563eb", "#16a34a", "#f59e0b"][i % 4], ["#facc15", "#38bdf8", "#dc2626", "#2563eb"][i % 4], 3.2);
    group.add(b.g);
    return { ...b, r: rand(8, 18), h: rand(9, 15), sp: rand(0.25, 0.45) * (i % 2 ? 1 : -1), ph: rand(0, 6), c: new THREE.Vector3(rand(-10, 10), 0, rand(-40, -15)) };
  });

  // butterflies + light shafts
  const wingTex = canvasTex(64, 64, (c) => {
    const grd = c.createRadialGradient(22, 32, 2, 32, 32, 32);
    grd.addColorStop(0, "#fde047");
    grd.addColorStop(0.5, "#f97316");
    grd.addColorStop(1, "#1c1917");
    c.fillStyle = grd;
    c.beginPath();
    c.ellipse(32, 32, 30, 22, 0.3, 0, Math.PI * 2);
    c.fill();
  });
  const flies = Array.from({ length: 10 }, () => {
    const g = new THREE.Group();
    const wm = f.mat(new THREE.MeshBasicMaterial({ map: wingTex, side: THREE.DoubleSide, depthWrite: false }));
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.34).translate(-0.2, 0, 0), wm);
    const r = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.34).translate(0.2, 0, 0), wm);
    g.add(l, r);
    group.add(g);
    return { g, l, r, ph: rand(0, 6), c: new THREE.Vector3(rand(-8, 8), rand(1, 4), rand(-12, 2)), rad: rand(1.5, 4) };
  });
  const shaft = canvasTex(64, 256, (c) => {
    const grd = c.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, "rgba(255,248,200,0.9)");
    grd.addColorStop(1, "rgba(255,248,200,0)");
    c.fillStyle = grd;
    c.fillRect(18, 0, 28, 256);
  });
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(5, 34), f.mat(new THREE.MeshBasicMaterial({ map: shaft, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0.22));
    s.position.set(rand(-20, 20), 14, rand(-50, -10));
    s.rotation.z = rand(0.25, 0.45);
    group.add(s);
  }

  group.add(f.light(new THREE.HemisphereLight("#fff6d5", "#2f5f20", 1.6)));
  const sun = f.light(new THREE.DirectionalLight("#fff1c1", 2.6));
  sun.position.copy(sunDir).multiplyScalar(80);
  group.add(sun);

  return {
    group,
    fade: f,
    bg: new THREE.Color("#b9e3c6"),
    fog: new THREE.Color("#bfdcb2"),
    fogDensity: 0.012,
    update: (t, dt) => {
      fallMat.uniforms.uTime.value = t;
      mist.scale.set(18 + Math.sin(t) * 1.5, 7 + Math.sin(t * 1.3), 1);
      for (const e of eles) {
        e.x += e.v * dt;
        if (e.x > 40) e.x = -40;
        const step = t * 2.2 + e.ph;
        e.g.position.set(e.x, Math.abs(Math.sin(step)) * 0.06, e.z);
        e.legs.forEach((l, i) => (l.rotation.z = Math.sin(step + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.28));
        e.trunk.forEach((s, i) => (s.rotation.z = Math.sin(t * 1.3 + e.ph + i * 0.4) * 0.18 + 0.05));
        e.ears.forEach((ear, i) => (ear.rotation.y = (i ? 1 : -1) * (1.2 + Math.sin(t * 2 + e.ph) * 0.25)));
        e.tail.rotation.x = Math.sin(t * 3) * 0.4;
      }
      gir.neckPivot.rotation.z = Math.sin(t * 0.6) * 0.08;
      for (const m of macaws) {
        const a = t * m.sp + m.ph;
        m.g.position.set(m.c.x + Math.cos(a) * m.r, m.h + Math.sin(t * 1.2 + m.ph), m.c.z + Math.sin(a) * m.r);
        m.g.rotation.set(0, -a + (m.sp > 0 ? Math.PI : 0), m.sp > 0 ? -0.35 : 0.35);
        m.flap(t * 9 + m.ph);
      }
      palms.forEach((p, i) => (p.rotation.z = Math.sin(t * 0.8 + i) * 0.03));
      for (const b of flies) {
        const a = t * 0.6 + b.ph;
        b.g.position.set(b.c.x + Math.cos(a) * b.rad, b.c.y + Math.sin(a * 2) * 0.5, b.c.z + Math.sin(a) * b.rad);
        b.g.rotation.y = -a;
        const fl = Math.sin(t * 15 + b.ph) * 1.1;
        b.l.rotation.y = fl;
        b.r.rotation.y = -fl;
      }
    },
    camera: (cam, t, prog, m) => {
      cam.position.set(m.x * 3 + Math.sin(t * 0.15) * 1.2, 3.2 - m.y * 1.2, 14 - prog * 18);
      cam.lookAt(m.x * 2, 3.5, -40);
    },
  };
}
