import * as THREE from "three";
import { bird, canvasTex, Ctx, Fader, glowTex, rand, skyDome, waterMaterial, waveHeight, windowTexture, World } from "./common";

const BOX_COLORS = ["#dc2626", "#2563eb", "#16a34a", "#f97316", "#e5e7eb", "#0891b2", "#ca8a04"];

function containerShip(f: Fader, lite: boolean) {
  const g = new THREE.Group();
  const hullTop = f.mat(new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.6 }));
  const hullBot = f.mat(new THREE.MeshStandardMaterial({ color: "#9f1239", roughness: 0.7 }));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 36).translate(0, 1.6, 0), hullTop));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.2, 35).translate(0, 0, 0), hullBot));
  const bow = new THREE.Mesh(new THREE.ConeGeometry(3, 6, 4, 1).rotateX(Math.PI / 2).rotateZ(Math.PI / 4).scale(1, 0.5, 1).translate(0, 1.4, 20.5), hullTop);
  g.add(bow);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(5.6, 5, 3).translate(0, 5.2, -15), f.mat(new THREE.MeshStandardMaterial({ color: "#f8fafc", emissive: "#fef3c7", emissiveIntensity: 0.15 })));
  g.add(bridge);
  const n = lite ? 60 : 120;
  const boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1.35, 1.2, 2.9), f.mat(new THREE.MeshStandardMaterial({ roughness: 0.7 })), n);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3(1, 1, 1);
  const c = new THREE.Color();
  let k = 0;
  for (let row = 0; row < 10 && k < n; row++)
    for (let col = 0; col < 4 && k < n; col++)
      for (let h = 0; h < 3 && k < n; h++) {
        boxes.setMatrixAt(k, m4.compose(new THREE.Vector3(-2.1 + col * 1.4, 3.3 + h * 1.22, -11 + row * 3.1), q, s));
        boxes.setColorAt(k++, c.set(BOX_COLORS[Math.floor(Math.random() * BOX_COLORS.length)]));
      }
  boxes.count = k;
  g.add(boxes);
  const mast = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ff3b3b", blending: THREE.AdditiveBlending, depthWrite: false })));
  mast.position.set(0, 8.5, -15);
  mast.scale.setScalar(1.6);
  g.add(mast);
  return { g, mast };
}

function crane(f: Fader) {
  const g = new THREE.Group();
  const red = f.mat(new THREE.MeshStandardMaterial({ color: "#dc2626", roughness: 0.5, metalness: 0.4 }));
  const white = f.mat(new THREE.MeshStandardMaterial({ color: "#f1f5f9", roughness: 0.5, metalness: 0.4 }));
  for (const x of [-3, 3])
    for (const z of [-2, 2]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 16, 0.5).translate(0, 8, 0), (x + z) % 2 ? red : white);
      leg.position.set(x, 0, z);
      g.add(leg);
    }
  g.add(new THREE.Mesh(new THREE.BoxGeometry(7, 0.8, 5).translate(0, 16, 0), red));
  const boom = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 30).translate(0, 17.2, 8), white);
  g.add(boom);
  const trolley = new THREE.Group();
  trolley.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.6), red));
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 4).translate(0, -0.5, 0), f.mat(new THREE.MeshBasicMaterial({ color: "#111" })));
  trolley.add(cable);
  const load = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.2, 2.9), f.mat(new THREE.MeshStandardMaterial({ color: BOX_COLORS[Math.floor(Math.random() * 5)] })));
  trolley.add(load);
  trolley.position.y = 16.6;
  g.add(trolley);
  const lamp = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: "#ffcf8a", blending: THREE.AdditiveBlending, depthWrite: false })));
  lamp.position.set(0, 17.8, 22);
  lamp.scale.setScalar(2);
  g.add(lamp);
  return { g, trolley, cable, load };
}

/* Port city at dusk: container yards, gantry cranes working a docked ship,
 * a ship sailing out with tugboats, a lighthouse sweeping its beam, skyline behind. */
export function port(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const sunDir = new THREE.Vector3(-0.6, 0.06, -1).normalize();
  group.add(skyDome(f, "#141a3a", "#6b3a6b", "#f59e6b", sunDir, "#ffb27a", 0.0022));

  const waterMat = waterMaterial(f, { deep: "#0a2138", shallow: "#1c4a6b", sky: "#c07a78", sunDir, sun: "#ffc08a", amp: 0.35 });
  const seg = ctx.lite ? 90 : 160;
  group.add(new THREE.Mesh(new THREE.PlaneGeometry(420, 420, seg, seg).rotateX(-Math.PI / 2), waterMat));

  // quay + container yard (right side)
  const concrete = f.mat(new THREE.MeshStandardMaterial({ color: "#4b5563", roughness: 0.95 }));
  const quay = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 200).translate(0, 0.5, 0), concrete);
  quay.position.set(38, 0, -60);
  group.add(quay);
  const yardN = ctx.lite ? 220 : 520;
  const yard = new THREE.InstancedMesh(new THREE.BoxGeometry(1.35, 1.2, 2.9), f.mat(new THREE.MeshStandardMaterial({ roughness: 0.7 })), yardN);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const c = new THREE.Color();
  for (let i = 0; i < yardN; i++) {
    const row = i % 14,
      stack = Math.floor(i / 14);
    const x = 24 + row * 1.5;
    const z = -140 + (stack % 40) * 3.3;
    const y = 2.1 + Math.floor(stack / 40) * 1.22;
    yard.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), q, one));
    yard.setColorAt(i, c.set(BOX_COLORS[Math.floor(Math.random() * BOX_COLORS.length)]));
  }
  group.add(yard);

  // docked ship + cranes working it
  const docked = containerShip(f, ctx.lite);
  docked.g.position.set(12.5, -0.4, -45);
  group.add(docked.g);
  const cranes = [-60, -44, -28].map((z, i) => {
    const cr = crane(f);
    cr.g.position.set(16, 1.5, z);
    cr.g.rotation.y = -Math.PI / 2;
    group.add(cr.g);
    return { ...cr, ph: i * 2.1 };
  });

  // outbound ship + tugs
  const outbound = containerShip(f, ctx.lite);
  outbound.g.rotation.y = Math.PI * 0.9;
  group.add(outbound.g);
  const tugs = [0, 1].map((i) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 4).translate(0, 0.3, 0), f.mat(new THREE.MeshStandardMaterial({ color: i ? "#b91c1c" : "#1d4ed8" }))));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.6).translate(0, 1.3, -0.4), f.mat(new THREE.MeshStandardMaterial({ color: "#f8fafc" }))));
    group.add(g);
    return g;
  });

  // lighthouse on a breakwater (left)
  const stripes = canvasTex(64, 256, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#f8fafc" : "#dc2626";
      g.fillRect(0, i * 32, 64, 32);
    }
  });
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(6, 0).scale(1.6, 0.5, 1), f.mat(new THREE.MeshStandardMaterial({ color: "#3f3f46", flatShading: true })));
  rock.position.set(-26, 0, -70);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 14, 16).translate(0, 7, 0), f.mat(new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.6 })));
  tower.position.set(-26, 2.5, -70);
  const lampHouse = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.4, 12), f.mat(new THREE.MeshStandardMaterial({ color: "#fff7d6", emissive: "#fde68a", emissiveIntensity: 2.2 })));
  lampHouse.position.set(-26, 17.2, -70);
  const beamPivot = new THREE.Group();
  beamPivot.position.set(-26, 17.2, -70);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(4.5, 60, 24, 1, true).rotateZ(Math.PI / 2).translate(30, 0, 0),
    f.mat(new THREE.MeshBasicMaterial({ color: "#fff4c2", blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0.09)
  );
  beamPivot.add(beam);
  group.add(rock, tower, lampHouse, beamPivot);

  // skyline behind the port
  const win = windowTexture(true);
  const skyN = ctx.lite ? 40 : 90;
  const sky = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), f.mat(new THREE.MeshStandardMaterial({ color: "#1e2130", map: win, emissive: "#ffffff", emissiveMap: win, emissiveIntensity: 0.9 })), skyN);
  const sv = new THREE.Vector3();
  for (let i = 0; i < skyN; i++) sky.setMatrixAt(i, m4.compose(new THREE.Vector3(rand(20, 140), 1, rand(-220, -150)), q, sv.set(rand(5, 10), rand(8, 40), rand(5, 10))));
  group.add(sky);

  const gulls = Array.from({ length: 6 }, (_, i) => {
    const b = bird(f, "#f1f5f9", "#e2e8f0", 3);
    group.add(b.g);
    return { ...b, r: rand(8, 20), h: rand(10, 18), sp: rand(0.18, 0.3) * (i % 2 ? 1 : -1), ph: rand(0, 6), c: new THREE.Vector3(rand(-5, 20), 0, rand(-60, -30)) };
  });

  group.add(f.light(new THREE.HemisphereLight("#f5b38a", "#0a2138", 1.1)));
  const sun = f.light(new THREE.DirectionalLight("#ffc28a", 2.2));
  sun.position.copy(sunDir).multiplyScalar(100);
  group.add(sun);
  const yardLight = f.light(new THREE.PointLight("#ffcf8a", 500, 90, 1.5));
  yardLight.position.set(24, 20, -45);
  group.add(yardLight);

  return {
    group,
    fade: f,
    bg: new THREE.Color("#6b3a6b"),
    fog: new THREE.Color("#8a5a78"),
    fogDensity: 0.0075,
    update: (t, dt) => {
      waterMat.uniforms.uTime.value = t;
      docked.mast.material.opacity = f.value * (Math.sin(t * 3) > 0 ? 1 : 0.15);
      for (const cr of cranes) {
        // cycle: trolley runs out over the ship, lowers, lifts, returns to the yard
        const cyc = ((t * 0.12 + cr.ph) % 1 + 1) % 1;
        const out = THREE.MathUtils.smoothstep(cyc, 0.0, 0.3) - THREE.MathUtils.smoothstep(cyc, 0.6, 0.9);
        const drop = Math.sin(Math.max(0, Math.min(1, (cyc - 0.3) / 0.3)) * Math.PI) * 9;
        cr.trolley.position.z = -2 + out * 20;
        cr.cable.scale.y = 1.5 + drop;
        cr.load.position.y = -2 - drop;
        cr.load.visible = cyc < 0.45 || cyc > 0.92;
      }
      const u = ((t * 0.015) % 1 + 1) % 1;
      const ox = -10 - u * 60,
        oz = -70 - u * 90;
      outbound.g.position.set(ox, waveHeight(ox, oz, t, 0.35) - 0.4, oz);
      outbound.mast.material.opacity = f.value * (Math.sin(t * 3 + 1) > 0 ? 1 : 0.15);
      tugs.forEach((tg, i) => {
        const x = ox + (i ? 5 : -5) + Math.sin(t + i) * 0.3,
          z = oz + 22;
        tg.position.set(x, waveHeight(x, z, t, 0.35), z);
        tg.rotation.y = Math.PI * 0.9;
      });
      beamPivot.rotation.y = t * 0.9;
      for (const gl of gulls) {
        const a = t * gl.sp + gl.ph;
        gl.g.position.set(gl.c.x + Math.cos(a) * gl.r, gl.h + Math.sin(t + gl.ph) * 0.8, gl.c.z + Math.sin(a) * gl.r);
        gl.g.rotation.set(0, -a + (gl.sp > 0 ? Math.PI : 0), gl.sp > 0 ? -0.3 : 0.3);
        gl.flap(t * 7 + gl.ph);
      }
    },
    camera: (cam, t, prog, m) => {
      cam.position.set(-6 + m.x * 4 + prog * 10, 14 - prog * 5 - m.y * 2, 18 - prog * 26);
      cam.lookAt(10 + m.x * 2, 4, -60 - prog * 10);
    },
  };
}
