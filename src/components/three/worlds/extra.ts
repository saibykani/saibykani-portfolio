import * as THREE from "three";
import { canvasTex, Ctx, Fader, fbm2, glowTex, rand, stars, World } from "./common";
import { buildAirliner } from "../aircraft";

/* Route every material of an imported object through the world's Fader. */
function fadeAll(f: Fader, o: THREE.Object3D) {
  o.traverse((c) => {
    const m = (c as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(m)) m.forEach((x) => f.mat(x));
    else if (m) f.mat(m);
  });
}

/* ============================ ROTATING MILKY WAY ============================ */
export function galaxy(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const uFade = f.uniform({ value: 0 });
  const uTime = { value: 0 };
  const uScale = { value: 600 };
  group.add(stars(f, ctx.lite ? 900 : 2200, 160, 0.55));

  const R = 42;
  const arms = 4;
  const build = (n: number, dust: boolean) => {
    const r = new Float32Array(n),
      a = new Float32Array(n),
      y = new Float32Array(n),
      col = new Float32Array(n * 3),
      size = new Float32Array(n),
      pos = new Float32Array(n * 3);
    const core = new THREE.Color("#ffd8a0"),
      arm = new THREE.Color("#a9c8ff"),
      white = new THREE.Color("#ffffff"),
      pink = new THREE.Color("#ff6fae"),
      dcol = new THREE.Color("#1a0d08"),
      c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const bulge = !dust && Math.random() < 0.2;
      let rr: number, aa: number, yy: number;
      if (bulge) {
        rr = Math.pow(Math.random(), 2.2) * 8;
        aa = Math.random() * Math.PI * 2;
        yy = (Math.random() - 0.5) * 3.2 * (1 - rr / 9);
        c.copy(core).lerp(white, Math.random() * 0.35);
        size[i] = rand(1.2, 2.6);
      } else {
        rr = 3 + Math.pow(Math.random(), 1.25) * R;
        const k = Math.floor(Math.random() * arms);
        const spread = (0.28 + rr * 0.006) * (Math.random() + Math.random() + Math.random() - 1.5);
        // logarithmic spiral arm; dust lanes trail on the inner edge
        aa = (k / arms) * Math.PI * 2 + Math.log(rr / 3) * 2.1 + spread + (dust ? -0.16 : 0);
        yy = (Math.random() - 0.5) * (dust ? 0.5 : 1.1) * (1.2 - rr / R);
        if (dust) {
          c.copy(dcol);
          size[i] = rand(14, 28);
        } else {
          const pk = Math.random() < 0.025;
          c.copy(arm).lerp(white, Math.random() * 0.6).lerp(core, Math.max(0, 1 - rr / 14) * 0.8);
          if (pk) c.copy(pink);
          size[i] = pk ? rand(2.5, 4.5) : rand(0.6, 1.9);
        }
      }
      r[i] = rr;
      a[i] = aa;
      y[i] = yy;
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aR", new THREE.BufferAttribute(r, 1));
    g.setAttribute("aA", new THREE.BufferAttribute(a, 1));
    g.setAttribute("aY", new THREE.BufferAttribute(y, 1));
    g.setAttribute("aCol", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R + 10);
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: dust ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: { uTime, uFade, uScale },
      vertexShader: `attribute float aR, aA, aY, aSize; attribute vec3 aCol; uniform float uTime, uScale; varying vec3 vCol; varying float vTw;
        void main(){
          // differential rotation: inner stars orbit faster
          float ang = aA + uTime * 0.9 / (2.5 + aR);
          vec3 p = vec3(cos(ang) * aR, aY, sin(ang) * aR);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vCol = aCol; vTw = 0.75 + 0.25 * sin(uTime * 2.0 + aA * 37.0);
          gl_PointSize = aSize * uScale / -mv.z;
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: dust
        ? `uniform float uFade; varying vec3 vCol; varying float vTw;
           void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * 0.07 * uFade; gl_FragColor = vec4(vCol, a); }`
        : `uniform float uFade; varying vec3 vCol; varying float vTw;
           void main(){ float d = length(gl_PointCoord - 0.5); float a = (smoothstep(0.5, 0.0, d) * 0.7 + smoothstep(0.15, 0.0, d) * 1.4) * vTw * uFade; gl_FragColor = vec4(vCol * a, a); }`,
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    return pts;
  };

  const gal = new THREE.Group();
  gal.add(build(ctx.lite ? 26000 : 60000, false));
  gal.add(build(ctx.lite ? 3000 : 7000, true));
  // glowing core + faint halo
  const mk = (color: string, s: number, o: number) => {
    const sp = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), o));
    sp.scale.setScalar(s);
    gal.add(sp);
  };
  mk("#ffcf8a", 16, 0.55);
  mk("#ffe7c0", 6, 0.8);
  mk("#6f8cff", 110, 0.12);
  gal.rotation.set(-0.95, 0, 0.18);
  gal.position.set(0, -4, -40);
  group.add(gal);

  return {
    group,
    fade: f,
    bg: new THREE.Color("#02030a"),
    fog: new THREE.Color("#02030a"),
    fogDensity: 0.0008,
    update: (t) => {
      uTime.value = t;
      uScale.value = window.innerHeight * Math.min(window.devicePixelRatio || 1, 1.25) * 0.16;
      gal.rotation.z = 0.18 + Math.sin(t * 0.03) * 0.05;
    },
    view: (t, pos, look) => {
      pos.set(Math.sin(t * 0.025) * 14, 16 + Math.sin(t * 0.04) * 3, 30 + Math.cos(t * 0.025) * 6);
      look.set(0, -6, -40);
    },
  };
}

/* ====================== HOT-AIR BALLOONS AT SUNRISE ====================== */
export function balloons(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const uFade = f.uniform({ value: 0 });
  const SUN = new THREE.Vector3(0.55, 0.12, -0.83).normalize();

  // sky dome
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(450, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      transparent: true,
      fog: false,
      uniforms: { uFade, uSun: { value: SUN } },
      vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uFade; uniform vec3 uSun; varying vec3 vD;
        void main(){ float h = clamp(vD.y, 0.0, 1.0);
          vec3 col = mix(vec3(1.0, 0.72, 0.5), vec3(0.33, 0.5, 0.82), pow(h, 0.55));
          col = mix(col, vec3(1.0, 0.86, 0.66), exp(-h * 14.0) * 0.6);
          float s = max(dot(vD, uSun), 0.0);
          col += vec3(1.0, 0.75, 0.45) * (pow(s, 12.0) * 0.55 + pow(s, 400.0) * 3.0);
          gl_FragColor = vec4(col, uFade); }`,
    })
  );
  f.mat(sky.material as THREE.Material);
  group.add(sky);

  // Cappadocia-style valley terrain
  const H = (x: number, z: number) => {
    const v = fbm2(x * 0.012 + 4, z * 0.012, 5);
    const ridge = 1 - Math.abs(fbm2(x * 0.02, z * 0.02 + 7, 4) * 2 - 1);
    return (v * 18 + ridge * 9) * Math.min(1, Math.max(0.15, -z / 60)) - 10;
  };
  const tg = new THREE.PlaneGeometry(520, 420, ctx.lite ? 110 : 190, ctx.lite ? 90 : 150);
  tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position as THREE.BufferAttribute;
  const tc = new Float32Array(tp.count * 3);
  const tuff = new THREE.Color("#e2bd92"),
    shade = new THREE.Color("#9a6f58"),
    green = new THREE.Color("#7d8a4e"),
    c = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i),
      z = tp.getZ(i) - 170;
    const h = H(x, z);
    tp.setXYZ(i, x, h, z);
    const n = fbm2(x * 0.08, z * 0.08, 3);
    c.copy(tuff).lerp(shade, THREE.MathUtils.clamp(0.6 - (h + 10) / 30 + n * 0.3, 0, 1));
    if (h < -6 && n > 0.45) c.lerp(green, 0.7);
    tc.set([c.r, c.g, c.b], i * 3);
  }
  tg.setAttribute("color", new THREE.BufferAttribute(tc, 3));
  tg.computeVertexNormals();
  group.add(new THREE.Mesh(tg, f.mat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }))));

  // fairy chimneys (rock cones with darker caps)
  const nC = ctx.lite ? 140 : 320;
  const cone = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 1, 1, 9, 1), f.mat(new THREE.MeshStandardMaterial({ color: "#e8c8a0", roughness: 1 })), nC);
  const cap = new THREE.InstancedMesh(new THREE.ConeGeometry(0.62, 0.7, 9), f.mat(new THREE.MeshStandardMaterial({ color: "#6e5446", roughness: 1 })), nC);
  const m4 = new THREE.Matrix4(),
    q = new THREE.Quaternion(),
    v3 = new THREE.Vector3(),
    s3 = new THREE.Vector3();
  for (let i = 0; i < nC; i++) {
    const cx = rand(-1, 1) * 200,
      cz = rand(-260, -20);
    const x = cx + rand(-6, 6),
      z = cz;
    const hgt = rand(3, 11),
      w = rand(0.9, 2.2);
    const base = H(x, z);
    v3.set(x, base + hgt / 2 - 0.5, z);
    s3.set(w, hgt, w);
    m4.compose(v3, q, s3);
    cone.setMatrixAt(i, m4);
    v3.set(x, base + hgt - 0.3, z);
    s3.set(w, w, w);
    m4.compose(v3, q, s3);
    cap.setMatrixAt(i, m4);
  }
  group.add(cone, cap);

  // balloons: lathe envelope with painted gores, per-instance colour
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const r = t < 0.72 ? Math.sin((t / 0.72) * Math.PI * 0.5) ** 0.7 : Math.cos(((t - 0.72) / 0.28) * Math.PI * 0.5) * 0.98 + 0.02;
    prof.push(new THREE.Vector2(Math.max(0.12, r) * 1.0, t * 2.4 - 1.2));
  }
  prof.reverse();
  const envG = new THREE.LatheGeometry(prof, 24);
  const gores = canvasTex(256, 256, (g) => {
    for (let i = 0; i < 12; i++) {
      g.fillStyle = i % 2 ? "#ffffff" : "#cfcfcf";
      g.fillRect((i * 256) / 12, 0, 256 / 12 + 1, 256);
    }
    g.fillStyle = "rgba(255,255,255,0.85)";
    g.fillRect(0, 150, 256, 18);
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(0, 170, 256, 6);
  });
  const nB = ctx.lite ? 18 : 34;
  const env = new THREE.InstancedMesh(envG, f.mat(new THREE.MeshStandardMaterial({ map: gores, side: THREE.DoubleSide, roughness: 0.55, emissive: "#3a1a08", emissiveIntensity: 0.25 })), nB);
  const basket = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.34, 0.42), f.mat(new THREE.MeshStandardMaterial({ color: "#5a3a22", roughness: 1 })), nB);
  const palette = ["#e11d48", "#f59e0b", "#2563eb", "#16a34a", "#9333ea", "#f97316", "#0ea5e9", "#facc15", "#dc2626", "#14b8a6"];
  type B = { x: number; y: number; z: number; vy: number; vx: number; s: number; ph: number; rot: number };
  const bs: B[] = [];
  for (let i = 0; i < nB; i++) {
    const near = i < 5;
    bs.push({
      x: near ? (i % 2 ? 1 : -1) * rand(14, 26) : rand(-160, 160),
      y: rand(-6, 40),
      z: near ? rand(-45, -25) : rand(-240, -35),
      vy: rand(0.25, 0.7),
      vx: rand(0.2, 0.8),
      s: rand(2.4, 3.4),
      ph: rand(0, 6),
      rot: rand(0, 6),
    });
    env.setColorAt(i, new THREE.Color(palette[i % palette.length]));
  }
  group.add(env, basket);
  // burner flames (flicker via sprite opacity)
  const burners = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(nB * 3), 3)),
    f.mat(new THREE.PointsMaterial({ size: 1.4, map: glowTex(), color: "#ffb347", blending: THREE.AdditiveBlending, depthWrite: false }))
  );
  burners.frustumCulled = false;
  group.add(burners);

  // valley mist
  for (let i = 0; i < 7; i++) {
    const sp = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffe2c4", depthWrite: false }), 0.35));
    sp.position.set(rand(-150, 150), -6, rand(-200, -40));
    sp.scale.set(rand(90, 150), 16, 1);
    group.add(sp);
  }

  group.add(f.light(new THREE.HemisphereLight("#ffe0bf", "#6a4a3a", 1.4)));
  const sun = f.light(new THREE.DirectionalLight("#ffc48a", 2.6));
  sun.position.copy(SUN).multiplyScalar(100);
  group.add(sun);

  const bp = burners.geometry.attributes.position as THREE.BufferAttribute;
  const bm = burners.material as THREE.PointsMaterial;
  return {
    group,
    fade: f,
    bg: new THREE.Color("#f4b98c"),
    fog: new THREE.Color("#f2c49c"),
    fogDensity: 0.0055,
    update: (t, dt) => {
      for (let i = 0; i < nB; i++) {
        const b = bs[i];
        b.y += b.vy * dt;
        b.x += b.vx * dt;
        if (b.y > 55) {
          b.y = -8;
          b.x = rand(-160, 120);
        }
        if (b.x > 180) b.x = -180;
        const y = b.y + Math.sin(t * 0.6 + b.ph) * 0.4;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.rot + t * 0.05);
        v3.set(b.x, y, b.z);
        s3.setScalar(b.s);
        m4.compose(v3, q, s3);
        env.setMatrixAt(i, m4);
        v3.set(b.x, y - b.s * 1.55, b.z);
        m4.compose(v3, q, s3);
        basket.setMatrixAt(i, m4);
        bp.setXYZ(i, b.x, y - b.s * 1.25, b.z);
      }
      env.instanceMatrix.needsUpdate = basket.instanceMatrix.needsUpdate = true;
      bp.needsUpdate = true;
      bm.size = 1.2 + Math.max(0, Math.sin(t * 7)) * 0.9;
    },
    view: (t, pos, look) => {
      pos.set(Math.sin(t * 0.02) * 10, 8 + Math.sin(t * 0.035) * 2.5, 14);
      look.set(Math.sin(t * 0.02) * 4, 6, -60);
    },
  };
}

/* ===================== DESERT EXTRAS: dust devils + airliner ===================== */
export function desertExtras(f: Fader, lite: boolean, height: (x: number, z: number) => number) {
  const group = new THREE.Group();
  const uFade = f.uniform({ value: 0 });
  const uTime = { value: 0 };
  const nD = 3;
  const per = lite ? 450 : 1000;
  const uDev = { value: Array.from({ length: nD }, () => new THREE.Vector3()) };
  const hA = new Float32Array(nD * per),
    pA = new Float32Array(nD * per),
    iA = new Float32Array(nD * per);
  for (let d = 0; d < nD; d++)
    for (let k = 0; k < per; k++) {
      const j = d * per + k;
      hA[j] = Math.pow(Math.random(), 0.8);
      pA[j] = Math.random() * Math.PI * 2;
      iA[j] = d;
    }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nD * per * 3), 3));
  dg.setAttribute("aH", new THREE.BufferAttribute(hA, 1));
  dg.setAttribute("aP", new THREE.BufferAttribute(pA, 1));
  dg.setAttribute("aI", new THREE.BufferAttribute(iA, 1));
  const dust = new THREE.Points(
    dg,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime, uFade, uDev },
      vertexShader: `attribute float aH, aP, aI; uniform float uTime; uniform vec3 uDev[3]; varying float vA;
        void main(){
          vec3 c = aI < 0.5 ? uDev[0] : (aI < 1.5 ? uDev[1] : uDev[2]);
          float r = mix(0.3, 4.2, pow(aH, 1.6));
          float ang = aP + uTime * (5.0 - aH * 3.0);
          vec3 p = c + vec3(cos(ang) * r + sin(uTime * 1.3 + aH * 6.0) * aH * 1.5, aH * 20.0, sin(ang) * r);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vA = (1.0 - aH) * 0.55 + 0.1;
          gl_PointSize = (1.5 + aH * 5.0) * 300.0 / -mv.z;
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uFade; varying float vA;
        void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA * 0.5 * uFade;
          gl_FragColor = vec4(0.86, 0.64, 0.42, a); }`,
    })
  );
  f.mat(dust.material as THREE.Material);
  dust.frustumCulled = false;
  group.add(dust);

  // an airliner crossing the sunset sky with a contrail
  const jet = buildAirliner(glowTex(), "#e11d48");
  fadeAll(f, jet.outer);
  jet.outer.scale.setScalar(1.6);
  group.add(jet.outer);
  const trailTex = canvasTex(256, 8, (g) => {
    const grd = g.createLinearGradient(0, 0, 256, 0);
    grd.addColorStop(0, "rgba(255,255,255,0)");
    grd.addColorStop(1, "rgba(255,240,230,1)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 8);
  });
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.9), f.mat(new THREE.MeshBasicMaterial({ map: trailTex, depthWrite: false, fog: false }), 0.55));
  group.add(trail);

  return {
    group,
    update(t: number) {
      uTime.value = t;
      for (let d = 0; d < nD; d++) {
        const x = (((t * (5 + d * 2) + d * 110) % 320) + 320) % 320 - 160;
        const z = -30 - d * 28;
        uDev.value[d].set(x, height(x, z) - 0.5, z);
      }
      const k = ((t + 8) % 50) / 38;
      const vis = k <= 1;
      jet.outer.visible = trail.visible = vis;
      if (vis) {
        const x = -260 + k * 520;
        jet.outer.position.set(x, 55, -170);
        jet.outer.lookAt(x + 1, 55, -170);
        const len = Math.min(140, k * 520);
        trail.scale.set(len, 1, 1);
        trail.position.set(x - len / 2 - 4, 55, -170);
      }
    },
  };
}
