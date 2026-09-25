import * as THREE from "three";
import { Ctx, Fader, fbm2, glowTex, rand, skyDome, stars, World } from "./common";

function pagoda(f: Fader, levels: number) {
  const g = new THREE.Group();
  const wall = f.mat(new THREE.MeshStandardMaterial({ color: "#7f1d1d", emissive: "#f59e0b", emissiveIntensity: 0.35, roughness: 0.6 }));
  const roof = f.mat(new THREE.MeshStandardMaterial({ color: "#1f2937", roughness: 0.4, metalness: 0.3 }));
  const gold = f.mat(new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#f59e0b", emissiveIntensity: 0.8, metalness: 0.8, roughness: 0.3 }));
  let y = 0;
  for (let i = 0; i < levels; i++) {
    const w = 2.4 - i * 0.35;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, w).translate(0, 0.6, 0), wall);
    body.position.y = y;
    const r = new THREE.Mesh(new THREE.ConeGeometry(w * 1.05, 0.9, 4, 1).rotateY(Math.PI / 4).translate(0, 0.45, 0), roof);
    r.position.y = y + 1.2;
    r.scale.set(1, 1, 1);
    g.add(body, r);
    y += 1.6;
  }
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.2, 8).translate(0, 0.6, 0), gold);
  finial.position.y = y;
  g.add(finial);
  const lantern = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffb347", blending: THREE.AdditiveBlending, depthWrite: false }), 0.8));
  lantern.position.y = 0.8;
  lantern.scale.setScalar(4);
  g.add(lantern);
  return g;
}

function island(f: Fader, r: number) {
  const g = new THREE.Group();
  const rock = new THREE.ConeGeometry(r, r * 1.8, 9, 3);
  const p = rock.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const n = 0.75 + fbm2(x * 0.4 + r, z * 0.4 + y * 0.2, 3) * 0.6;
    p.setXYZ(i, x * n, y, z * n);
  }
  rock.computeVertexNormals();
  const rockM = new THREE.Mesh(rock, f.mat(new THREE.MeshStandardMaterial({ color: "#4b4458", flatShading: true, roughness: 1 })));
  rockM.rotation.x = Math.PI;
  rockM.position.y = -r * 0.9;
  g.add(rockM);
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 0.95, 0.5, 9), f.mat(new THREE.MeshStandardMaterial({ color: "#3f7d4a", flatShading: true }))));
  return g;
}

/* Eastern serpent dragon: a chain of instanced scales following a winding path. */
function serpent(f: Fader, cA: string, cB: string, n: number) {
  const g = new THREE.Group();
  const scaleMat = f.mat(new THREE.MeshStandardMaterial({ metalness: 0.7, roughness: 0.3, emissive: cA, emissiveIntensity: 0.25 }));
  const segs = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), scaleMat, n);
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) segs.setColorAt(i, col.set(cA).lerp(new THREE.Color(cB), (Math.sin(i * 0.5) + 1) * 0.35));
  g.add(segs);
  const spines = new THREE.InstancedMesh(new THREE.ConeGeometry(0.18, 0.7, 5), f.mat(new THREE.MeshStandardMaterial({ color: cB, metalness: 0.8, roughness: 0.3 })), n);
  g.add(spines);
  const head = new THREE.Group();
  const hm = f.mat(new THREE.MeshStandardMaterial({ color: cA, metalness: 0.6, roughness: 0.35, emissive: cA, emissiveIntensity: 0.3 }));
  head.add(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12).scale(1.1, 0.8, 1.7), hm));
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8).scale(0.9, 0.6, 1.3), hm);
  snout.position.z = 1.5;
  head.add(snout);
  const hornM = f.mat(new THREE.MeshStandardMaterial({ color: "#fde68a", metalness: 0.5, roughness: 0.4 }));
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.6, 6), hornM);
    horn.position.set(s * 0.5, 0.7, -0.6);
    horn.rotation.set(-1.0, 0, s * -0.3);
    head.add(horn);
    const eye = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#fef08a", blending: THREE.AdditiveBlending, depthWrite: false })));
    eye.position.set(s * 0.55, 0.35, 0.7);
    eye.scale.setScalar(0.7);
    head.add(eye);
    const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 3, 4).translate(0, -1.5, 0), hornM);
    whisker.position.set(s * 0.45, -0.1, 1.9);
    whisker.rotation.set(1.2, 0, s * 0.8);
    head.add(whisker);
  }
  g.add(head);
  const aura = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: cA, blending: THREE.AdditiveBlending, depthWrite: false }), 0.35));
  aura.scale.setScalar(10);
  head.add(aura);
  return { g, segs, spines, head, n };
}

/* Dragon realm: floating islands with pagodas and waterfalls above a sea of clouds,
 * two serpent dragons winding between them under a giant moon. */
export function dragon(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  group.add(skyDome(f, "#0b1030", "#3b1d5e", "#b0487a"));
  group.add(stars(f, ctx.lite ? 500 : 1100, 300, 1.2, "#fde7ff"));
  const moon = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#fff1d6", depthWrite: false, fog: false })));
  moon.position.set(-60, 70, -220);
  moon.scale.setScalar(90);
  group.add(moon);

  // sea of clouds (GPU fbm)
  const uFade = f.uniform({ value: 0 });
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uFade },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uTime, uFade; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*n(p); p *= 2.03; a *= 0.5; } return v; }
      void main(){ vec2 p = vW.xz * 0.02 + vec2(uTime * 0.01, 0.0); float c = fbm(p + fbm(p * 1.7));
        vec3 col = mix(vec3(0.35, 0.2, 0.5), vec3(1.0, 0.8, 0.9), smoothstep(0.35, 0.8, c));
        float dist = length(vW.xz); gl_FragColor = vec4(col, smoothstep(0.25, 0.6, c) * uFade * exp(-dist * 0.004)); }`,
  });
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(700, 700).rotateX(-Math.PI / 2), cloudMat);
  clouds.position.y = -14;
  group.add(clouds);

  // islands
  const isl: { g: THREE.Group; base: number; ph: number }[] = [];
  const layout: [number, number, number, number, number][] = [
    [0, 0, -40, 9, 5],
    [-26, 6, -60, 6, 3],
    [24, -3, -55, 7, 4],
    [-14, 12, -95, 5, 2],
    [34, 10, -100, 6, 3],
    [-40, -6, -30, 4, 0],
    [18, 16, -140, 8, 5],
  ];
  const fallMat = f.mat(new THREE.MeshBasicMaterial({ color: "#bae6fd", blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0.35);
  for (const [x, y, z, r, lv] of layout) {
    const g = island(f, r);
    if (lv) {
      const pg = pagoda(f, lv);
      pg.position.set(rand(-r * 0.3, r * 0.3), 0.25, rand(-r * 0.3, r * 0.3));
      g.add(pg);
    }
    if (r > 5) {
      const fall = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 22).translate(0, -11, 0), fallMat);
      fall.position.set(r * 0.9, 0, 0);
      fall.rotation.y = Math.PI / 2;
      g.add(fall);
    }
    g.position.set(x, y, z);
    isl.push({ g, base: y, ph: rand(0, 6) });
    group.add(g);
  }

  // dragons
  const N = ctx.lite ? 50 : 80;
  const dragons = [
    { d: serpent(f, "#dc2626", "#fbbf24", N), c: new THREE.Vector3(0, 8, -60), rx: 38, rz: 30, sp: 0.16, ph: 0 },
    { d: serpent(f, "#0d9488", "#a7f3d0", N), c: new THREE.Vector3(5, 14, -90), rx: 46, rz: 26, sp: -0.12, ph: 2.5 },
  ];
  dragons.forEach((x) => group.add(x.d.g));

  // embers
  const EN = ctx.lite ? 250 : 600;
  const ep = new Float32Array(EN * 3);
  for (let i = 0; i < EN; i++) ep.set([rand(-60, 60), rand(-12, 40), rand(-160, 10)], i * 3);
  const eg = new THREE.BufferGeometry();
  eg.setAttribute("position", new THREE.BufferAttribute(ep, 3));
  const embers = new THREE.Points(eg, f.mat(new THREE.PointsMaterial({ map: glowTex(), color: "#fdba74", size: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })));
  group.add(embers);

  group.add(f.light(new THREE.HemisphereLight("#f0abfc", "#1e1b4b", 1.1)));
  const moonL = f.light(new THREE.DirectionalLight("#ffe7c7", 1.8));
  moonL.position.set(-60, 70, -100);
  group.add(moonL);
  const warm = f.light(new THREE.PointLight("#fb923c", 300, 80, 1.5));
  warm.position.set(0, 6, -40);
  group.add(warm);

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const p = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const look = new THREE.Matrix4();
  const path = (dr: (typeof dragons)[number], s: number, t: number, out: THREE.Vector3) => {
    const a = s + t * dr.sp + dr.ph;
    return out.set(dr.c.x + Math.cos(a) * dr.rx, dr.c.y + Math.sin(a * 2.3) * 5 + Math.sin(a * 5) * 1.2, dr.c.z + Math.sin(a) * dr.rz);
  };
  return {
    group,
    fade: f,
    bg: new THREE.Color("#2a1545"),
    fog: new THREE.Color("#4a2a5e"),
    fogDensity: 0.0065,
    update: (t) => {
      cloudMat.uniforms.uTime.value = t;
      isl.forEach((i) => (i.g.position.y = i.base + Math.sin(t * 0.4 + i.ph) * 0.8));
      for (const dr of dragons) {
        const { segs, spines, head, n } = dr.d;
        for (let i = 0; i < n; i++) {
          const s = -i * 0.035 * Math.sign(dr.sp);
          path(dr, s, t, p);
          path(dr, s + 0.01 * Math.sign(dr.sp), t, p2);
          const taper = i < 4 ? 0.8 + i * 0.1 : Math.max(0.25, 1.2 - (i / n) * 0.95);
          look.lookAt(p, p2, up);
          q.setFromRotationMatrix(look);
          m4.compose(p, q, sc.set(taper, taper, taper * 1.3));
          segs.setMatrixAt(i, m4);
          m4.compose(p.clone().addScaledVector(up, taper * 0.9), q, sc.setScalar(taper));
          spines.setMatrixAt(i, m4);
          if (i === 0) {
            // head sits just ahead of the first scale, nose (+z) pointing along the direction of travel
            const dir = p2.clone().sub(p).normalize();
            head.position.copy(p).addScaledVector(dir, 1.4);
            head.lookAt(head.position.clone().addScaledVector(dir, 5));
          }
        }
        segs.instanceMatrix.needsUpdate = true;
        spines.instanceMatrix.needsUpdate = true;
      }
      const a = eg.attributes.position.array as Float32Array;
      for (let i = 0; i < EN; i++) {
        a[i * 3 + 1] += 0.02;
        if (a[i * 3 + 1] > 40) a[i * 3 + 1] = -12;
      }
      eg.attributes.position.needsUpdate = true;
      warm.intensity = 300 * f.value * (0.85 + Math.sin(t * 4) * 0.1);
    },
    camera: (cam, t, prog, m) => {
      const az = -0.2 + Math.sin(t * 0.05) * 0.25 + m.x * 0.3;
      const r = 44 - prog * 16;
      cam.position.set(Math.sin(az) * r, 10 + prog * 6 - m.y * 3, -40 + Math.cos(az) * r);
      cam.lookAt(0, 6, -70);
    },
  };
}
