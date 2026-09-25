import * as THREE from "three";
import { Ctx, Fader, glowTex, rand, stars, World } from "./common";

/* Milky Way: a barred spiral galaxy whose rotation runs entirely on the GPU
 * (inner stars orbit faster than outer ones, like the real thing). The camera
 * orbits above the disc and dives toward the core as you scroll. */
export function milkyway(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  group.add(stars(f, ctx.lite ? 1200 : 2600, 300, 1.4));

  const N = ctx.lite ? 26000 : 70000;
  const aR = new Float32Array(N);
  const aA = new Float32Array(N);
  const aH = new Float32Array(N);
  const aS = new Float32Array(N);
  const col = new Float32Array(N * 3);
  const c = new THREE.Color();
  const core = new THREE.Color("#ffd9a8");
  const armBlue = new THREE.Color("#8fb4ff");
  const hii = new THREE.Color("#ff7ab8");
  const ARMS = 4;
  for (let i = 0; i < N; i++) {
    const bulge = Math.random() < 0.18;
    let r: number, a: number, h: number;
    if (bulge) {
      r = Math.pow(Math.random(), 1.8) * 4.5;
      a = Math.random() * Math.PI * 2;
      h = (Math.random() - 0.5) * 2.2 * (1 - r / 5);
      c.copy(core).lerp(new THREE.Color("#ffffff"), Math.random() * 0.3);
    } else {
      r = 3 + Math.pow(Math.random(), 1.2) * 27;
      const arm = (i % ARMS) * ((Math.PI * 2) / ARMS);
      const spread = (Math.random() + Math.random() + Math.random() - 1.5) * (0.35 + r * 0.02);
      a = arm + Math.log(r / 2.5) * 2.2 + spread;
      h = (Math.random() - 0.5) * (0.5 + Math.random()) * 0.6;
      c.copy(core).lerp(armBlue, Math.min(1, r / 18));
      if (Math.random() < 0.04) c.lerp(hii, 0.8); // star-forming regions
    }
    aR[i] = r;
    aA[i] = a;
    aH[i] = h;
    aS[i] = bulge ? rand(1.2, 2.6) : Math.random() < 0.02 ? rand(3, 5) : rand(0.8, 2);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3)); // placeholder, positions come from the shader
  g.setAttribute("aR", new THREE.BufferAttribute(aR, 1));
  g.setAttribute("aA", new THREE.BufferAttribute(aA, 1));
  g.setAttribute("aH", new THREE.BufferAttribute(aH, 1));
  g.setAttribute("aS", new THREE.BufferAttribute(aS, 1));
  g.setAttribute("aC", new THREE.BufferAttribute(col, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
  const uFade = f.uniform({ value: 0 });
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade, uPx: { value: Math.min(window.devicePixelRatio || 1, 1.5) } },
    vertexShader: `attribute float aR, aA, aH, aS; attribute vec3 aC; uniform float uTime, uPx; varying vec3 vC; varying float vA;
      void main(){ float ang = aA + uTime * 0.9 / (aR + 2.0);
        vec3 p = vec3(cos(ang) * aR, aH, sin(ang) * aR);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aS * uPx * 60.0 / -mv.z;
        vC = aC; vA = smoothstep(0.0, 3.0, -mv.z);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uFade; varying vec3 vC; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vC * a, a * uFade * 0.85 * vA); }`,
  });
  const galaxy = new THREE.Points(g, mat);
  const disc = new THREE.Group();
  disc.add(galaxy);

  // glowing bulge + nebula glows in the arms
  const bulgeGlow = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffcf8f", blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0.9));
  bulgeGlow.scale.setScalar(16);
  disc.add(bulgeGlow);
  for (let i = 0; i < (ctx.lite ? 14 : 30); i++) {
    const r = rand(6, 26);
    const arm = (i % ARMS) * ((Math.PI * 2) / ARMS);
    const a = arm + Math.log(r / 2.5) * 2.2;
    const s = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: ["#f472b6", "#818cf8", "#38bdf8"][i % 3], blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0.22));
    s.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    s.scale.setScalar(rand(3, 7));
    disc.add(s);
  }
  disc.rotation.z = 0.12;
  group.add(disc);

  const target = new THREE.Vector3();
  return {
    group,
    fade: f,
    bg: new THREE.Color("#02030b"),
    fog: new THREE.Color("#02030b"),
    fogDensity: 0.001,
    update: (t) => {
      mat.uniforms.uTime.value = t;
      disc.rotation.y = t * 0.01;
    },
    camera: (cam, t, prog, m) => {
      const r = 46 - prog * 22;
      const el = 0.95 - prog * 0.55 + m.y * 0.1;
      const az = t * 0.02 + m.x * 0.4 + 0.6;
      cam.position.set(Math.cos(az) * Math.cos(el) * r, Math.sin(el) * r, Math.sin(az) * Math.cos(el) * r);
      target.set(0, 0, 0);
      cam.lookAt(target);
    },
  };
}
